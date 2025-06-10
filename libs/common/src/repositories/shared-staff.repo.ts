import { Injectable } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";

@Injectable()
export class ShareStaffRepository {
    constructor(private readonly prismaService: PrismaService) { }
    async findUniqueStaffAndBelongToProvider(id: number, providerId: number) {
        return await this.prismaService.staff.findUnique({
            where: {
                id: id,
                providerId
            }
        })
    }
}