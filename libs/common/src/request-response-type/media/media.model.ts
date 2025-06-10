import { z } from 'zod'

export const PresignedUploadFileBodySchema = z
    .object({
        filename: z.string(),
        filesize: z.number().max(1 * 1024 * 1024),
    })
    .strict()
export type PresignedUploadFileBodyType = z.infer<typeof PresignedUploadFileBodySchema>