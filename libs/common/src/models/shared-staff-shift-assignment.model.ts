import { z } from 'zod'

export const StaffShiftAssignmentSchema = z.object({
    staffId: z.number().int().positive(),
    shiftTemplateId: z.number().int().positive(),

    effectiveFrom: z.coerce.date({
        required_error: "effectiveFrom is required",
        invalid_type_error: "effectiveFrom must be a valid ISO date"
    }),

    effectiveTo: z.coerce.date().optional(),
})
