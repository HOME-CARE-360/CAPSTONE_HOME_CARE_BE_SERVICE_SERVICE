
import { ServiceProviderSchema } from "libs/common/src/models/shared-provider.model";
import { z } from "zod";
export const UpdateStatusProviderBodySchema = ServiceProviderSchema.pick({
    id: true,
    verificationStatus: true
}).strict()


export type UpdateStatusProviderBody = z.infer<typeof UpdateStatusProviderBodySchema>