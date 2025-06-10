import { z } from 'zod'

export const DeviceSchema = z.object({
    id: z.number(),
    userId: z.number(),
    userAgent: z.string(),
    ip: z.string(),
    lastActive: z.date(),
    createdAt: z.date(),
    isActive: z.boolean(),
})

export type DeviceType = z.infer<typeof DeviceSchema>
