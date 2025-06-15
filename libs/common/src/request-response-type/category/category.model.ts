import { z } from "zod";
import { CategorySchema } from "../../models/shared-category.model";

export const CreateCategoryBodySchema = CategorySchema.pick({
    logo: true,
    name: true,
    parentCategoryId: true,
})
export type CreateCategoryBodyType = z.infer<typeof CreateCategoryBodySchema>