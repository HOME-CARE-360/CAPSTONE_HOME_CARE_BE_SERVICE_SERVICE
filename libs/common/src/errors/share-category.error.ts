import { BadRequestException } from "@nestjs/common";

export function InvalidCategoryIdException(invalidIds: number[]) {
    return new BadRequestException([
        {
            message: 'Error.InvalidCategoryId',
            path: ['categoryRequirements'],
            meta: { invalidIds },
        },
    ]);
}