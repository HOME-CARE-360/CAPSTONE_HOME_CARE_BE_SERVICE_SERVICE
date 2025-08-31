import { Injectable } from "@nestjs/common"
import { PrismaService } from "../services/prisma.service"
import { ServiceType } from "../models/shared-services.model"
import { OrderByType, SortBy, SortByType } from "../constants/others.constant"
import { GetServicesResType } from "../request-response-type/service/services.model"
import { Prisma, ServiceStatus } from "@prisma/client"

import { isNotFoundPrismaError } from "libs/common/helpers"
import { ServiceNotFoundException } from "../errors/share-service.error"


@Injectable()
export class ShareServicesRepository {
    constructor(private readonly prismaService: PrismaService) { }

    async list({
        limit,
        page,
        name,
        providerIds,
        categories,
        minPrice,
        maxPrice,
        createdById,
        orderBy,
        sortBy,
    }: {
        limit: number
        page: number
        name?: string
        providerIds?: number[]
        categories?: number[]
        minPrice?: number
        maxPrice?: number
        createdById?: number
        orderBy: OrderByType
        sortBy: SortByType
    }): Promise<GetServicesResType> {
        console.log("cao r");
        console.log(limit, page);

        const skip = (page - 1) * limit
        const take = limit
        const where: Prisma.ServiceWhereInput = {
            publishedAt: {
                lte: new Date(),
                not: null,
            },
            status: ServiceStatus.ACCEPTED,
            deletedAt: null,
            createdById: createdById ? createdById : undefined,
        }

        if (name) {
            where.name = {
                contains: name,
                mode: 'insensitive',
            }
        }
        if (providerIds && providerIds.length > 0) {
            where.providerId = {
                in: providerIds,
            }
        }
        if (categories && categories.length > 0) {
            where.categoryId = {
                in: categories,


            }
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.virtualPrice = {
                gte: minPrice,
                lte: maxPrice,
            }
        }

        let caculatedOrderBy: Prisma.ServiceOrderByWithRelationInput | Prisma.ServiceOrderByWithRelationInput[] = {
            createdAt: orderBy,

        }
        if (sortBy === SortBy.Price) {
            caculatedOrderBy = {
                basePrice: orderBy,
            }
        } else if (sortBy === SortBy.Discount) {
            caculatedOrderBy = {
                basePrice: orderBy
            }
        }
        const [totalItems, data] = await Promise.all([
            this.prismaService.service.count({
                where,
            }),
            this.prismaService.service.findMany({
                where,

                include: {
                    // translations: {
                    //     where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
                    // },
                    provider: {
                        select: {
                            user: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },
                    Category: {

                        select: {
                            logo: true,
                            name: true
                        }
                    },
                    FavoriteService: true
                },
                omit: {
                    deletedAt: true,
                    deletedById: true,
                    updatedAt: true,
                    updatedById: true,
                    createdAt: true,
                    createdById: true,
                    publishedAt: true
                },

                orderBy: caculatedOrderBy,
                skip,
                take,
            }),
        ])
        const services = data.map(({ provider, ...rest }) => ({ ...rest, provider: provider.user.name }))
        return {
            data: services,
            totalItems,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalItems / limit),
        }
    }

    async getServiceDetail(serviceId: number): Promise<ServiceType> {
        try {
            const data = await this.prismaService.service.findFirstOrThrow({
                where: {
                    status: ServiceStatus.ACCEPTED,
                    id: serviceId,
                    deletedAt: null
                },
                include: {
                    Category: {
                        select: {
                            logo: true,
                            name: true
                        }
                    }
                }, omit: {
                    deletedById: true,
                    updatedById: true,
                    deletedAt: true,
                    createdById: true,

                }
            })
            console.log(data);

            return data as ServiceType
        } catch (error) {
            if (isNotFoundPrismaError(error)) {
                throw ServiceNotFoundException
            }
            return error
        }

    }
    async getServiceDetailForProvider(serviceId: number): Promise<ServiceType> {
        try {
            const data = await this.prismaService.service.findFirstOrThrow({
                where: {
                    id: serviceId,
                    deletedAt: null
                },
                select: {
                    name: true,
                    basePrice: true,
                    virtualPrice: true,
                    images: true,
                    durationMinutes: true,
                    publishedAt: true,
                    Category: true,
                    createdAt: true,
                    updatedAt: true


                }
            })
            return data as ServiceType
        } catch (error) {
            if (isNotFoundPrismaError(error)) {
                throw ServiceNotFoundException
            }
            return error
        }

    }
    async getListSuggestionDevice(customerId: number) {
        const customerAssets = await this.prismaService.customerAsset.findMany({
            where: {
                customerId
            }
        })
        console.log(customerAssets);
        const suggest = await this.prismaService.assetSuggestion.findMany(
            {
                where: {
                    customerAssetId: {
                        in: customerAssets.map((item) => item.id)
                    }
                },
                include: {
                    ExternalProduct: true

                }
            }
        )
        console.log(suggest);

        return suggest
    }
}