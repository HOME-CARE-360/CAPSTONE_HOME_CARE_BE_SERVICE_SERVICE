import { Body, Controller, Post } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { MessagePattern } from "@nestjs/microservices";
import { CreateCategoryBodyType } from "libs/common/src/request-response-type/category/category.model";

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    // @UseGuards(AccessTokenGuard)
    @MessagePattern({ cmd: "get-list-category" })
    async getListCategories() {
        const a = await this.categoriesService.findAllCategory();
        return a
    }
    @MessagePattern({ cmd: "get-list-category" })
    async createCategory(@Body() body: CreateCategoryBodyType) {
        const a = await this.categoriesService.createCategory(body);
        return a
    }

}
