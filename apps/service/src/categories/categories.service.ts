import { Injectable } from '@nestjs/common'

import { PrismaService } from 'libs/common/src/services/prisma.service'

import { SharedCategoryRepository } from 'libs/common/src/repositories/shared-category.repo'
import { CreateCategoryBodyType } from 'libs/common/src/request-response-type/category/category.model'
import { CategoryAlreadyExistException } from 'libs/common/src/errors/share-category.error'

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService, private readonly categoriesRepository: SharedCategoryRepository) { }
    async findAllCategory() {

        return await this.categoriesRepository.findAllCategory()
    }
    async createCategory(body: CreateCategoryBodyType) {
        if ((await this.categoriesRepository.findUniqueName([body.name])).length > 0) throw CategoryAlreadyExistException([body.name])
        return await this.categoriesRepository.createCategory(body)
    }
}