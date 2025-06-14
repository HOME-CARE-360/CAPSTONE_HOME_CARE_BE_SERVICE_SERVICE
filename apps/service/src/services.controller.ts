import { Body, Controller, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { ServicesService } from "./services.service";
import { IsPublic } from "libs/common/src/decorator/auth.decorator";
import { ZodSerializerDto } from "nestjs-zod";
import { GetServicesQueryDTO, GetServicesResDTO } from "libs/common/src/request-response-type/service/services.dto";

import { MessagePattern, Payload } from "@nestjs/microservices";
import { GetServicesQueryType } from "libs/common/src/request-response-type/service/services.model";

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  // @UseGuards(AccessTokenGuard)
  @Get(':customerId')
  async recommendPackage(@Param('customerId', ParseIntPipe) customerId: number) {
    return await this.servicesService.getRecommendation(customerId);
  }

  @IsPublic()
  @MessagePattern({ cmd: 'get-list-service' })
  @ZodSerializerDto(GetServicesResDTO)
  list(@Body() query: GetServicesQueryType) {
    return this.servicesService.getListService({ query })
  }
  @MessagePattern({ cmd: 'detail' })
  @IsPublic()
  async getDetailService(@Payload() { serviceID }: { serviceID: number }) {
    const data = await this.servicesService.getServiceDetail(serviceID)
    return {
      message: `Get service ${data.name} detail successfully`,
      data
    }
  }
}
