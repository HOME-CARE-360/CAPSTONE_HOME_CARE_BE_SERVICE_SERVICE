import { NotFoundException } from "@nestjs/common";

export const StaffNotFoundOrNotBelongToProviderException = new NotFoundException([
    {
        message: 'Error.StaffNotFoundOrNotBelongToProvider',
        path: ['staffId'],
    },
])