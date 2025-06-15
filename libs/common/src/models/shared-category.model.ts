import { z } from 'zod'

export const CategorySchema = z.object({
    id: z.number(),
    name: z.string(),
    logo: z.string().nullable().optional(),
    parentCategoryId: z.number().nullable().optional(),
    createdById: z.number().nullable().optional(),
    updatedById: z.number().nullable().optional(),
    deletedById: z.number().nullable().optional(),
    deletedAt: z.date().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
})

export type CategoryType = z.infer<typeof CategorySchema>
