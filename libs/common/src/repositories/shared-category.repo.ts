import { Injectable } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";

@Injectable()
export class SharedCategoryRepository {
    constructor(private readonly prismaService: PrismaService) { }
    async findUnique(categoryIds: number[]) {
        return await this.prismaService.category.findMany({
            where: {
                id: { in: categoryIds }
            },
            select: { id: true }
        });
    }


}