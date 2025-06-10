import { Injectable } from "@nestjs/common"
import { PrismaService } from "../services/prisma.service"
import { ServiceFullInformationType, ServiceType } from "../models/shared-services.model"
import { OrderByType, SortBy, SortByType } from "../constants/others.constant"
import { GetServicesForProviderResType, GetServicesResType, UpdateServiceBodyType } from "../request-response-type/service/services.model"
import { Prisma } from "@prisma/client"
import { RoleType } from "../models/shared-role.model"

import { UnauthorizedAccessException } from "../errors/share-auth.error"
import { RoleName } from "../constants/role.constant"
import { isNotFoundPrismaError } from "libs/common/helpers"
import { ServiceNotFoundException } from "../errors/share-service.error"
import { ServiceProviderNotFoundException } from "../errors/share-provider.error"


@Injectable()
export class ShareServicesRepository {
    constructor(private readonly prismaService: PrismaService) { }
    async createService(service: ServiceType & { categories: number[] }, userId: number, providerId: number) {

        await this.prismaService.service.create({
            data: {
                ...service,
                providerId: providerId,
                createdById: userId,
                updatedById: userId,
                categories: {
                    connect: service.categories.map((id) => ({ id }))
                }
            }
        })
    }
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
        const skip = (page - 1) * limit
        const take = limit
        const where: Prisma.ServiceWhereInput = {
            publishedAt: {
                lte: new Date(),
                not: null,
            },
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
            where.categories = {
                some: {
                    id: {
                        in: categories,
                    },
                },
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
                bookings: {
                    _count: orderBy,
                },
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
                    categories: {
                        select: {
                            name: true
                        }
                    }
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
    async listForProvider({
        limit,
        page,
        name,
        categories,
        minPrice,
        maxPrice,
        createdById,
        isPublic,
        orderBy,
        sortBy,
    }: {
        limit: number
        page: number
        name?: string
        categories?: number[]
        minPrice?: number
        maxPrice?: number
        createdById?: number
        isPublic?: boolean
        orderBy: OrderByType
        sortBy: SortByType
    }): Promise<GetServicesForProviderResType> {
        const skip = (page - 1) * limit
        const take = limit
        let where: Prisma.ServiceWhereInput = {

            deletedAt: null,
            createdById: createdById
        }
        if (isPublic === true) {
            where.publishedAt = {
                lte: new Date(),
                not: null,
            }
        } else if (isPublic === false) {
            where = {
                ...where,
                OR: [{ publishedAt: null }, { publishedAt: { gt: new Date() } }],
            }
        }
        if (name) {
            where.name = {
                contains: name,
                mode: 'insensitive',
            }
        }

        if (categories && categories.length > 0) {
            where.categories = {
                some: {
                    id: {
                        in: categories,
                    },
                },
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
                bookings: {
                    _count: orderBy,
                },
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
                    categories: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: caculatedOrderBy,
                skip,
                take,
            }),
        ])
        return {
            data,
            totalItems,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalItems / limit),
        }
    }
    async updateServices(data: UpdateServiceBodyType, userId: number): Promise<ServiceFullInformationType> {
        const { categories, id, ...rest } = data
        return await this.prismaService.service.update({
            where: {
                id: id
            },
            data: {
                ...rest,
                updatedById: userId,
                categories: {
                    connect: categories.map((item) => ({ id: item }))
                }
            }
        })
    }
    async serviceBelongProvider(serviceId: number, providerId: number, roleName: Pick<RoleType, "id" | "name">[]) {
        const service = await this.prismaService.service.findUnique({
            where: { id: serviceId },
            select: { providerId: true },
        });

        if (!service) {
            throw ServiceProviderNotFoundException;
        }

        if (service.providerId !== providerId && roleName.every((item) => item.name !== RoleName.Admin)) {

            throw UnauthorizedAccessException
        }
    }
    async deleteService(serviceId: number, userId: number) {
        return await this.prismaService.service.update({
            where: {
                id: serviceId
            },
            data: {
                deletedAt: new Date(),
                deletedById: userId
            }
        })
    }
    async getServiceDetail(serviceId: number): Promise<ServiceType> {
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
                    categories: {
                        select: {
                            logo: true,
                            name: true
                        }
                    }
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
                    categories: {
                        select: {
                            logo: true,
                            name: true
                        }
                    },
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
}