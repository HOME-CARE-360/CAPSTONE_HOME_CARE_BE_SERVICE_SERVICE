import { createZodDto } from "nestjs-zod";
import { UpdateStatusProviderBodySchema } from "./manager.model";

export class UpdateStatusProviderBodyDTO extends createZodDto(UpdateStatusProviderBodySchema) { }