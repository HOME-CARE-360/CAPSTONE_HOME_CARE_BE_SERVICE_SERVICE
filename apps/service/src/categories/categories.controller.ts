import { Body, Controller, Post } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { CreateCategoryBodyType, GetListCategoryQueryType } from "libs/common/src/request-response-type/category/category.model";

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    // @UseGuards(AccessTokenGuard)
    @MessagePattern({ cmd: "get-list-category" })
    async getListCategories(@Payload() { query }: { query: GetListCategoryQueryType }) {
        const a = await this.categoriesService.findAllCategory(query);
        return a
    }
    @MessagePattern({ cmd: "get-list-category" })
    async createCategory(@Payload() { body }: { body: CreateCategoryBodyType }) {
        const a = await this.categoriesService.createCategory(body);
        return a
    }

}
