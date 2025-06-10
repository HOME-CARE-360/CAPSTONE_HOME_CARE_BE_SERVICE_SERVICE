import { createZodDto } from 'nestjs-zod'
import { PresignedUploadFileBodySchema } from './media.model';
export class PresignedUploadFileBodyDTO extends createZodDto(PresignedUploadFileBodySchema) { }
