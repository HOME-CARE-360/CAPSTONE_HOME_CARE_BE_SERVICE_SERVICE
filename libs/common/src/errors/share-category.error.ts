import { BadRequestException } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";

export function InvalidCategoryIdException(invalidIds: number[]) {
    return new RpcException(new BadRequestException([
        {
            message: 'Error.InvalidCategoryId',
            path: ['categoryRequirements'],
            meta: { invalidIds },
        },
    ]));
}
export function CategoryAlreadyExistException(invalidNames: string[]) {

    return new RpcException(new BadRequestException([
        {
            message: 'Error.CategoryAlreadyExist',
            path: ['name'],
            meta: { invalidNames },
        },
    ]))
}