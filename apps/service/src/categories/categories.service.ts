import { Injectable } from '@nestjs/common'

import { PrismaService } from 'libs/common/src/services/prisma.service'

import { SharedCategoryRepository } from 'libs/common/src/repositories/shared-category.repo'
import { GetListCategoryQueryType } from 'libs/common/src/request-response-type/category/category.model'

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService, private readonly categoriesRepository: SharedCategoryRepository) { }
    async findAllCategory(query: GetListCategoryQueryType) {

        return await this.categoriesRepository.findAllCategory(query)
    }
}