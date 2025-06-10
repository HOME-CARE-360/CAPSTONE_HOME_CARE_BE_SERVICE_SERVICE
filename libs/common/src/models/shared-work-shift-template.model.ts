import { z } from 'zod'
import { SessionEnum, WeekDayEnum } from '../constants/common.constants'





export const WorkShiftTemplateSchema = z.object({
    day: WeekDayEnum,
    session: SessionEnum,
    startTime: z.string(),
    endTime: z.string(),
    createdAt: z.date().nullable(),
    updatedAt: z.date().nullable()
})
