import { createZodDto } from "nestjs-zod";
import { CreateServiceBodySchema } from "../service/services.model";
import { GetListCategoryQuerySchema, GetListCategoryResSchema } from "./category.model";

export class CreateCategoryBodyDTO extends createZodDto(CreateServiceBodySchema) { }
export class GetListCategoryQueryDTO extends createZodDto(GetListCategoryQuerySchema) { }
export class GetListCategoryResDTO extends createZodDto(GetListCategoryResSchema) { }
