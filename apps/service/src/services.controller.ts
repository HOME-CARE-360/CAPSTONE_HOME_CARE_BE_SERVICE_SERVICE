import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ServicesService } from "./services.service";
import { IsPublic } from "libs/common/src/decorator/auth.decorator";
import { OrderBy, SortBy } from "libs/common/src/constants/others.constant";
import { ZodSerializerDto } from "nestjs-zod";
import { DeleteServicesParamDTO, GetServiceResDTO, GetServicesQueryDTO, GetServicesResDTO } from "libs/common/src/request-response-type/service/services.dto";
import { ApiQuery } from '@nestjs/swagger';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  // @UseGuards(AccessTokenGuard)
  @Get(':customerId')
  async recommendPackage(@Param('customerId', ParseIntPipe) customerId: number) {
    return await this.servicesService.getRecommendation(customerId);
  }
  @IsPublic()
  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Items per page' })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by service name (partial match)' })
  @ApiQuery({
    name: 'providerIds',
    required: false,
    isArray: true,
    type: Number,
    description: 'List of provider IDs to filter by',
    example: [1, 3],
  })
  @ApiQuery({
    name: 'categories',
    required: false,
    isArray: true,
    type: Number,
    description: 'List of category IDs to filter by',
    example: [4, 7],
  })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum base price' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum base price' })
  @ApiQuery({ name: 'createdById', required: false, type: Number, description: 'Filter by creator user ID' })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: OrderBy,
    description: 'Sort order: Asc or Desc',
    example: OrderBy.Desc,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: SortBy,
    description: 'Sort field: CreatedAt, Price, or Discount',
    example: SortBy.CreatedAt,
  })
  @IsPublic()
  @ZodSerializerDto(GetServicesResDTO)
  list(@Query() query: GetServicesQueryDTO) {
    return this.servicesService.getListService({
      query,
    })
  }
  @IsPublic()
  @Get("detail/:serviceId")
  @ZodSerializerDto(GetServiceResDTO)
  async getDetailService(@Param() serviceID: DeleteServicesParamDTO) {
    const data = await this.servicesService.getServiceDetail(serviceID.serviceId)
    return {
      message: `Get service ${data.name} detail successfully`,
      data
    }
  }
}
