import { z } from 'zod'

export const ServiceSchema = z.object({
    id: z.number().int().nonnegative(),
    description: z.string()
        .trim()
        .min(20, 'Service description must be at least 3 characters')
        .max(1000, 'Service description  must not exceed 1000 characters'),
    name: z.string()
        .trim()
        .min(3, 'Service name must be at least 3 characters')
        .max(500, 'Service name must not exceed 500 characters'),
    basePrice: z.number()
        .nonnegative()
        .max(1_000_000_000, 'Base price is too large'),
    virtualPrice: z.number()
        .nonnegative()
        .max(1_000_000_000, 'Virtual price is too large'),
    images: z.array(z.string().url({ message: 'Each image must be a valid URL' })).optional(),
    durationMinutes: z.number()
        .int()
        .positive()
        .max(1440, 'Duration cannot exceed 24 hours'),

    providerId: z.number().int().nonnegative(),

    createdById: z.number().nullable(),
    updatedById: z.number().nullable(),
    deletedById: z.number().nullable(),
    publishedAt: z.date().nullable(),
    deletedAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
})

export type ServiceFullInformationType = z.infer<typeof ServiceSchema>
export type ServiceType = Pick<z.infer<typeof ServiceSchema>, "basePrice" | "name" | "durationMinutes" | "images" | "virtualPrice">
