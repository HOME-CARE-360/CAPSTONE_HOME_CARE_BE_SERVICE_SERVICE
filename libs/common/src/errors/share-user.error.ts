import { UnprocessableEntityException } from "@nestjs/common";

export const UserNotFoundException = new UnprocessableEntityException([
    {
        message: 'Error.UserNotFound',
        path: 'code',
    },
])