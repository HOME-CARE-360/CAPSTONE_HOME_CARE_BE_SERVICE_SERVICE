import { createZodDto } from "nestjs-zod";
import { CreateServiceBodySchema, GetServiceParamsSchema, GetServicesForProviderQuerySchema, GetServicesForProviderResSchema, GetServicesQuerySchema, GetServicesResSchema, ServiceBodyPrototype, UpdateServiceBodySchema } from "./services.model";

export class CreateServicesBodyDTO extends createZodDto(CreateServiceBodySchema) { }
export class GetServicesQueryDTO extends createZodDto(GetServicesQuerySchema) { }
export class GetServicesResDTO extends createZodDto(GetServicesResSchema) { }
export class GetServicesForProviderResDTO extends createZodDto(GetServicesForProviderResSchema) { }
export class UpdateServicesBodyDTO extends createZodDto(UpdateServiceBodySchema) { }
export class DeleteServicesParamDTO extends createZodDto(GetServiceParamsSchema) { }
export class GetServicesForProviderQueryDTO extends createZodDto(GetServicesForProviderQuerySchema) { }
export class GetServiceResDTO extends createZodDto(ServiceBodyPrototype) { }

