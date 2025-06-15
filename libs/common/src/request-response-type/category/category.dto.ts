import { createZodDto } from "nestjs-zod";
import { CreateServiceBodySchema } from "../service/services.model";

export class CreateCategoryBodyDTO extends createZodDto(CreateServiceBodySchema) { }