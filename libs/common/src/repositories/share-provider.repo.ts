import { Injectable } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";
import { ServiceProviderType } from "../models/shared-provider.model";

@Injectable()
export class SharedProviderRepository {
    constructor(private readonly prismaService: PrismaService) { }
    async findUnique({ id }: { id: number }): Promise<ServiceProviderType | null> {
        return await this.prismaService.serviceProvider.findFirst({
            where: {
                id
            }
        })
    }
    async update(body: ServiceProviderType): Promise<ServiceProviderType | null> {
        return await this.prismaService.serviceProvider.update({ where: { id: body.id }, data: { ...body } })
    }

}