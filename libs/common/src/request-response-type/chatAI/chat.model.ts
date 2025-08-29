import { z } from 'zod';

export const historyItemSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1, 'content is required'),
});

export const chatRequestSchema = z.object({
    message: z.string().min(1, 'message is required'),
    history: z.array(historyItemSchema).optional().default([]),
    stream: z.boolean().optional(), // nếu FE có gửi kèm, không bắt buộc
});

export const chatStreamQuerySchema = z.object({
    message: z.string().min(1, 'message is required'),
    // Base64(JSON.stringify(history[])) — optional
    history: z.string().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatHistoryItem = z.infer<typeof historyItemSchema>;
export type ChatStreamQuery = z.infer<typeof chatStreamQuerySchema>;
