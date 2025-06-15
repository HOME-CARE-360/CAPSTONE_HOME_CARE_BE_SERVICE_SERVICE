import { Injectable } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";
import { CreateCategoryBodyType, GetListCategoryQueryType } from "../request-response-type/category/category.model";
import { Prisma } from "@prisma/client";

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
    async findUniqueName(categoryNames: string[]) {
        return await this.prismaService.category.findMany({
            where: {
                name: { in: categoryNames }
            },
            select: { id: true }
        });
    }
    async findAllCategory(query: GetListCategoryQueryType) {
        const where: Prisma.CategoryWhereInput = {}
        if (query.name) {
            where.name = query.name
        }
        const categories = await this.prismaService.category.findMany({
            where,
            select: {
                id: true, logo: true, name: true, parentCategory: {
                    select: {
                        name: true,
                        id: true,
                        logo: true
                    }
                }
            }, orderBy: {
                [query.sortBy]: query.orderBy
            }
        });
        return categories

    }
    async createCategory(body: CreateCategoryBodyType) {
        return await this.prismaService.category.create({
            data: {
                ...body
            }
        })



    }


}