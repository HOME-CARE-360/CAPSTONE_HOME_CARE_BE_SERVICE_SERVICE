import { z } from "zod";
import { CategorySchema } from "../../models/shared-category.model";
import { OrderBy, SortBy } from "../../constants/others.constant";

export const CreateCategoryBodySchema = CategorySchema.pick({
    logo: true,
    name: true,
    parentCategoryId: true,
})
export const GetListCategoryResSchema = CategorySchema.pick({
    logo: true,
    name: true,
    parentCategoryId: true,
    id: true
})
export const GetListCategoryQuerySchema = z.object({
    name: z.string().optional(),
    orderBy: z.enum([OrderBy.Asc, OrderBy.Desc]).default(OrderBy.Desc),
    sortBy: z.enum([SortBy.CreatedAt]).default(SortBy.CreatedAt),
})
export type CreateCategoryBodyType = z.infer<typeof CreateCategoryBodySchema>
export type GetListCategoryQueryType = z.infer<typeof GetListCategoryQuerySchema>
export type GetListCategoryResType = z.infer<typeof GetListCategoryResSchema>
