import { z } from "zod"
import { CompanyTypeEnum, VerificationStatusEnum } from "../constants/common.constants"

export const ServiceProviderSchema = z.object({
    id: z.number(),

    userId: z.number().int().positive(),

    taxId: z.string()
        .trim()
        .min(10, "Tax ID must be at least 10 characters")
        .max(100, "Tax ID must be under 100 characters")
        .regex(/^[A-Z0-9-]+$/, "Tax ID format is invalid"),

    companyType: CompanyTypeEnum,

    licenseNo: z.string()
        .trim()
        .max(100, "License No must be under 100 characters")
        .nullable()
        .optional(),

    industry: z.string()
        .trim()
        .min(2, "Industry must be meaningful")
        .max(255, "Industry too long")
        .nullable()
        .optional(),

    description: z.string()
        .trim()
        .min(10, "Description must be at least 10 characters")
        .max(1000, "Description too long")
        .nullable()
        .optional(),

    address: z.string()
        .trim()
        .min(10, "Address must be at least 10 characters"),

    logo: z.string()
        .url("Logo must be a valid URL")
        .max(1000)
        .nullable()
        .optional(),

    verificationStatus: VerificationStatusEnum,

    verifiedAt: z.date()
        .nullable()
        .optional(),

    verifiedById: z.number()
        .int()
        .positive()
        .nullable()
        .optional(),

    createdAt: z.date(),
    updatedAt: z.date(),
});

export type CreateServiceProviderType = Pick<z.infer<typeof ServiceProviderSchema>, "address" | "taxId" | "userId" | "verificationStatus" | "description" | "companyType">
export type ServiceProviderType = z.infer<typeof ServiceProviderSchema>
