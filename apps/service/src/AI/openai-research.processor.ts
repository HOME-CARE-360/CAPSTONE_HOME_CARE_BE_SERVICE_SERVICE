import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, QueueEvents, JobsOptions, Job, RepeatOptions } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import { OpenAiResearchService } from 'libs/common/src/services/AI.services';
import { PrismaService } from 'libs/common/src/services/prisma.service';
// (tuỳ chọn) để validate cron
// import * as cronParser from 'cron-parser';

const QUEUE_NAME = 'openai-research';
const REPEAT_JOB_NAME = 'research-2h';
const REPEAT_JOB_ID = 'openai-research@2h';

@Injectable()
export class OpenAiResearchProcessor implements OnModuleInit, OnModuleDestroy {
    private queue!: Queue;
    private worker!: Worker;
    private events!: QueueEvents;

    private queueConn!: IORedis;
    private workerConn!: IORedis;
    private eventsConn!: IORedis;

    private cronWatcher?: NodeJS.Timeout;
    private lastAppliedCron?: string;
    private lastAppliedTz?: string;

    constructor(
        private readonly cfg: ConfigService,
        private readonly research: OpenAiResearchService,
        private readonly prisma: PrismaService,
    ) { }

    private buildConn(REDIS_URL: string) {
        return new IORedis(REDIS_URL, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
        });
    }

    async onModuleInit() {
        const REDIS_URL =
            this.cfg.get<string>('REDIS_URL') ??
            this.cfg.get<string>('REDIS_HOST') ??
            'redis://127.0.0.1:6379';

        // mỗi thành phần 1 connection
        this.queueConn = this.buildConn(REDIS_URL);
        this.workerConn = this.buildConn(REDIS_URL);
        this.eventsConn = this.buildConn(REDIS_URL);

        this.queue = new Queue(QUEUE_NAME, {
            connection: this.queueConn,
            defaultJobOptions: {
                removeOnComplete: true,
                attempts: Number(this.cfg.get('OPENAI_RESEARCH_ATTEMPTS') ?? 2),
                backoff: { type: 'exponential', delay: Number(this.cfg.get('OPENAI_RESEARCH_BACKOFF_MS') ?? 10_000) },
            },
        });

        this.worker = new Worker(
            QUEUE_NAME,
            async (job: Job) => {
                const {
                    customerId = null,
                    maxPerAsset = Number(process.env.MAX_PER_ASSET ?? 5),
                    timeoutMs = Number(this.cfg.get('OPENAI_RESEARCH_TIMEOUT_MS') ?? 15 * 60_000),
                } = job.data ?? {};

                const t0 = Date.now();
                console.log(`[${QUEUE_NAME}] ▶️ START jobId=${job.id}`, { customerId, maxPerAsset, timeoutMs });

                try {
                    const work = this.research.researchAndSuggestForCustomer({ customerId, maxPerAsset });
                    const timed = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs),
                    );
                    const res = await Promise.race([work, timed]);
                    console.log(`[${QUEUE_NAME}] ✅ DONE jobId=${job.id}`, res, `in ${Date.now() - t0}ms`);
                    return res;
                } catch (err: any) {
                    console.error(`[${QUEUE_NAME}] 🔴 ERROR jobId=${job.id}`, err?.message || err);
                    throw err;
                }
            },
            { connection: this.workerConn, concurrency: Number(this.cfg.get('OPENAI_RESEARCH_CONCURRENCY') ?? 1) },
        );

        this.worker.on('error', (e) => console.error(`[${QUEUE_NAME}] Worker error`, e));

        this.events = new QueueEvents(QUEUE_NAME, { connection: this.eventsConn });
        this.events.on('added', (e) => console.log(`[${QUEUE_NAME}] ➕ added`, e.jobId, e.name));
        this.events.on('completed', (e) => console.log(`[${QUEUE_NAME}] 🟢 completed`, e.jobId));
        this.events.on('failed', (e) => console.error(`[${QUEUE_NAME}] 🔴 failed`, e.jobId, e.failedReason));

        // lần đầu: đọc cron và ensure scheduler
        await this.ensureSchedulerFromDb();

        // watcher: 30s/lần kiểm tra thay đổi và đồng bộ vào Redis
        const intervalMs = Number(this.cfg.get('CRON_WATCH_INTERVAL_MS') ?? 30_000);
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.cronWatcher = setInterval(() => this.ensureSchedulerFromDb().catch(console.error), intervalMs);
    }

    private async ensureSchedulerFromDb() {
        const sys = await this.prisma.systemConfig.findFirst({ where: { key: 'SUGGEST_DEVICE_CRON' } });
        const CRON = sys?.value || '0 */2 * * *'; // fallback
        const TZ = this.cfg.get('CRON_TZ') || 'Asia/Ho_Chi_Minh';

        // nếu chưa đổi gì thì thôi
        if (this.lastAppliedCron === CRON && this.lastAppliedTz === TZ) return;

        // (tuỳ chọn) validate cron
        // try { cronParser.parseExpression(CRON); } catch { throw new Error(`Invalid SUGGEST_DEVICE_CRON="${CRON}"`); }

        // tìm đúng repeat của mình
        const repeats = await this.queue.getRepeatableJobs();
        const mine = repeats.find((r) => r.name === REPEAT_JOB_NAME && r.id === REPEAT_JOB_ID);

        // nếu đã tồn tại và pattern/tz khác, xoá đúng key cũ
        if (mine && (mine.pattern !== CRON || (mine.tz ?? TZ) !== TZ)) {
            try {
                await this.queue.removeRepeatableByKey(mine.key);
                console.log(`[${QUEUE_NAME}] 🧹 removed old repeat:`, mine.key);
            } catch (e) {
                console.warn(`[${QUEUE_NAME}] ⚠️ failed to remove old repeat`, mine.key, e);
            }
        }

        // nếu chưa có (hoặc vừa xoá), add lại theo pattern mới
        if (!mine || mine.pattern !== CRON || (mine.tz ?? TZ) !== TZ) {
            const repeat: RepeatOptions = { pattern: CRON, tz: TZ, jobId: REPEAT_JOB_ID };
            const opts: JobsOptions = { repeat, removeOnComplete: true };
            await this.queue.add(REPEAT_JOB_NAME, { customerId: null, maxPerAsset: Number(process.env.MAX_PER_ASSET ?? 5) }, opts);
            console.log(`[${QUEUE_NAME}] 🗓️ scheduler applied: ${CRON} (TZ=${TZ})`);
            this.lastAppliedCron = CRON;
            this.lastAppliedTz = TZ;
        }
    }

    async onModuleDestroy() {
        if (this.cronWatcher) clearInterval(this.cronWatcher);
        await this.worker?.close();
        await this.events?.close();
        await this.queue?.close();
        await this.queueConn?.quit();
        await this.workerConn?.quit();
        await this.eventsConn?.quit();
    }
}
