import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, QueueEvents, JobsOptions, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import { OpenAiResearchService } from 'libs/common/src/services/AI.services';

const QUEUE_NAME = 'openai-research';

@Injectable()
export class OpenAiResearchProcessor implements OnModuleInit, OnModuleDestroy {
    private queue!: Queue;
    private worker!: Worker;
    private events!: QueueEvents;
    private connection!: IORedis;

    constructor(
        private readonly cfg: ConfigService,
        private readonly research: OpenAiResearchService,
    ) { }

    async onModuleInit() {
        const REDIS_URL =
            this.cfg.get<string>('REDIS_URL') ??
            this.cfg.get<string>('REDIS_HOST') ??
            'redis://127.0.0.1:6379';

        this.connection = new IORedis(REDIS_URL, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
        });

        this.queue = new Queue(QUEUE_NAME, {
            connection: this.connection,
            defaultJobOptions: {
                removeOnComplete: true,
                attempts: Number(this.cfg.get('OPENAI_RESEARCH_ATTEMPTS') ?? 2),
                backoff: { type: 'exponential', delay: Number(this.cfg.get('OPENAI_RESEARCH_BACKOFF_MS') ?? 10_000) },
            },
        });

        const olds = await this.queue.getRepeatableJobs();
        for (const j of olds) {
            try {
                await this.queue.removeRepeatableByKey(j.key);
                console.log(`[${QUEUE_NAME}] 🧹 removed old repeat:`, j.key);
            } catch (e) {
                console.warn(`[${QUEUE_NAME}] ⚠️ failed to remove repeat`, j.key, e);
            }
        }

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
            {
                connection: this.connection,
                concurrency: Number(this.cfg.get('OPENAI_RESEARCH_CONCURRENCY') ?? 1),
            },
        );

        this.events = new QueueEvents(QUEUE_NAME, { connection: this.connection });
        this.events.on('added', (e) => console.log(`[${QUEUE_NAME}] ➕ added`, e.jobId, e.name));
        this.events.on('completed', (e) => console.log(`[${QUEUE_NAME}] 🟢 completed`, e.jobId));
        this.events.on('failed', (e) => console.error(`[${QUEUE_NAME}] 🔴 failed`, e.jobId, e.failedReason));

        const CRON = this.cfg.get('OPENAI_RESEARCH_CRON') || '0 */2 * * *';
        const TZ = this.cfg.get('CRON_TZ') || 'Asia/Ho_Chi_Minh';

        await this.queue.add(
            'research-2h',
            { customerId: null, maxPerAsset: Number(process.env.MAX_PER_ASSET ?? 5) },
            {
                repeat: { pattern: CRON, tz: TZ, jobId: 'openai-research@2h' },
                removeOnComplete: true,
            } as JobsOptions,
        );

        console.log(`[${QUEUE_NAME}] 🗓️ scheduler registered: ${CRON} (TZ=${TZ})`);
    }

    async onModuleDestroy() {
        await this.worker?.close();
        await this.events?.close();
        await this.queue?.close();
        await this.connection?.quit();
    }
}
