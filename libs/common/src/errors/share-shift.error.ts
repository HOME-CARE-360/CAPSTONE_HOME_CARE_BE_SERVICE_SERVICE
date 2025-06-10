import { NotFoundException } from "@nestjs/common"

export const ShiftTemplateNotFoundException = new NotFoundException([
    {
        message: 'Error.ShiftTemplateNotFound',
        path: ['shiftTemplateId'],
    },
])

