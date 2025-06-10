import { NotFoundException } from '@nestjs/common'

export const StaffAlreadyAssignedToShiftException = new NotFoundException([
    {
        message: 'Error.StaffAlreadyAssignedToShift',
        path: ['staffId', 'shiftTemplateId'],
    },
])
