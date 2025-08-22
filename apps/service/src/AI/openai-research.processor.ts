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
            defaultJobOptions: { removeOnComplete: true, attempts: 1 },
        });

        // Dọn repeat cũ để tránh trùng
        const olds = await this.queue.getRepeatableJobs();
        for (const j of olds) await this.queue.removeRepeatableByKey(j.key);

        // Worker: chạy research
        this.worker = new Worker(
            QUEUE_NAME,
            async (job: Job) => {
                const { customerId = null, maxPerAsset = Number(process.env.MAX_PER_ASSET ?? 5) } = job.data ?? {};
                const t0 = Date.now();
                console.log(`[${QUEUE_NAME}] ▶️ START jobId=${job.id}`, { customerId, maxPerAsset });
                const res = await this.research.researchAndSuggestForCustomer({ customerId, maxPerAsset });
                console.log(`[${QUEUE_NAME}] ✅ DONE jobId=${job.id}`, res, `in ${Date.now() - t0}ms`);
            },
            { connection: this.connection, concurrency: Number(this.cfg.get('OPENAI_RESEARCH_CONCURRENCY') ?? 1) },
        );
        this.events = new QueueEvents(QUEUE_NAME, { connection: this.connection });
        this.events.on('added', (e) => console.log(`[${QUEUE_NAME}] ➕ added`, e.jobId, e.name));
        this.events.on('completed', (e) => console.log(`[${QUEUE_NAME}] 🟢 completed`, e.jobId));
        this.events.on('failed', (e) => console.error(`[${QUEUE_NAME}] 🔴 failed`, e.jobId, e.failedReason));
        const CRON = '0 */2 * * *';
        await this.queue.add(
            'research-minute',
            { customerId: null, maxPerAsset: Number(process.env.MAX_PER_ASSET ?? 5) },
            {
                repeat: { pattern: CRON, tz: this.cfg.get('CRON_TZ') || 'Asia/Ho_Chi_Minh', jobId: 'openai-research@1m' },
                removeOnComplete: true,
            } as JobsOptions,
        );

        console.log(`[${QUEUE_NAME}] 🗓️ scheduler registered: ${CRON}`);
    }

    async onModuleDestroy() {
        await this.worker?.close();
        await this.events?.close();
        await this.queue?.close();
        await this.connection?.quit();
    }
}
