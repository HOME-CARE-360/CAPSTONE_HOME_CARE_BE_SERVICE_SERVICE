

import { TypeOfVerificationCode } from "libs/common/src/constants/auth.constant";
import { ServiceProviderSchema } from "libs/common/src/models/shared-provider.model";
import { UserSchema } from "libs/common/src/models/shared-user.model";
import { z } from "zod";
export const RegisterBody = UserSchema.pick({
    email: true,
    password: true,
    name: true,
    phone: true
}).extend({
    confirmPassword: z.string().min(6).max(100),
    code: z.string().length(6)
}).strict()

export const RegisterBodySchema = RegisterBody.superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
        ctx.addIssue({
            code: 'custom',
            message: 'Password and cofirm password must match',
            path: ['confirmPassword']
        })
    }
})

export const RegisterProviderBodySchema = ServiceProviderSchema.pick({
    taxId: true,
    companyType: true,
    industry: true,
    address: true,
    description: true
}).merge(RegisterBody).superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
        ctx.addIssue({
            code: 'custom',
            message: 'Password and confirm password must be the same',
            path: ['confirmNewPassword'],
        })
    }
})

export const RegisterResSchema = UserSchema.omit({
    password: true,
    totpSecret: true,
})

export const VerificationCodeSchema = z.object({
    id: z.number(),
    email: z.string().email(),
    code: z.string().length(6),
    type: z.enum([TypeOfVerificationCode.REGISTER, TypeOfVerificationCode.FORGOT_PASSWORD, TypeOfVerificationCode.DISABLE_2FA, TypeOfVerificationCode.LOGIN]),
    expiresAt: z.date(),
    createdAt: z.date()

})
export const ForgotPasswordBodySchema = z
    .object({
        email: z.string().email(),
        code: z.string().length(6),
        newPassword: z.string().min(6).max(100),
        confirmNewPassword: z.string().min(6).max(100),
    })
    .strict()
    .superRefine(({ confirmNewPassword, newPassword }, ctx) => {
        if (confirmNewPassword !== newPassword) {
            ctx.addIssue({
                code: 'custom',
                message: 'Password and confirm password must be the same',
                path: ['confirmNewPassword'],
            })
        }
    })

export const SendOTPBodySchema = VerificationCodeSchema.pick({
    email: true,
    type: true
}).strict()

export const LoginBodySchema = UserSchema.pick({
    email: true,
    password: true
}).extend({
    totpCode: z.string().length(6).optional(),
    code: z.string().length(6).optional()
}).strict().superRefine(({ totpCode, code }, ctx) => {
    if ((totpCode !== undefined) && (code !== undefined)) {
        ctx.addIssue({
            path: ['totpCode'],
            message: "You must provide either a 2FA authentication code or an OTP code. Do not provide both.",
            code: 'custom'

        })
        ctx.addIssue({
            path: ['code'],
            message: "You must provide either a 2FA authentication code or an OTP code. Do not provide both.",
            code: 'custom'

        })
    }
})

export const LoginResSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string()
}).strict()

export const RefreshTokenBodySchema = z.object({
    refreshToken: z.string()
}).strict()

export const RefreshTokenResSchema = LoginResSchema

export const DeviceSchema = z.object({
    id: z.number(),
    userId: z.number(),
    userAgent: z.string(),
    ip: z.string(),
    lastActive: z.date(),
    createdAt: z.date(),
    isActive: z.boolean(),
})

export const RoleSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    isActive: z.boolean(),
    createdById: z.number().nullable(),
    updatedById: z.number().nullable(),
    deletedAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
})
export const RefreshTokenSchema = z.object({
    token: z.string(),
    userId: z.number(),
    deviceId: z.number(),
    expiresAt: z.date(),
    createdAt: z.date(),
})
export const GoogleAuthStateSchema = DeviceSchema.pick({
    userAgent: true,
    ip: true,
})

export const GetAuthorizationUrlResSchema = z.object({
    url: z.string().url(),
})
export const DisableTwoFactorBodySchema = z.object({
    totpCode: z.string().length(6).optional(),
    code: z.string().length(6).optional()
}).superRefine(({ code, totpCode }, ctx) => {
    if ((totpCode !== undefined) === (code !== undefined)) {
        ctx.addIssue({
            path: ['totpCode'],
            message: "You must provide either a 2FA authentication code or an OTP code. Do not provide both.",
            code: 'custom'
        })
        ctx.addIssue({
            path: ['code'],
            message: "You must provide either a 2FA authentication code or an OTP code. Do not provide both.",
            code: 'custom'
        })
    }
})
export const TwoFactorSetupResSchema = z.object({
    secret: z.string(),
    uri: z.string(),
})
export const LogoutBodySchema = RefreshTokenBodySchema
export type LogoutBodyType = RefreshTokenBodyType
export type DeviceType = z.infer<typeof DeviceSchema>
export type LoginResType = z.infer<typeof LoginResSchema>
export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>
export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>
export type RefreshTokenResType = LoginResType
export type LoginBodyType = z.infer<typeof LoginBodySchema>
export type SendOTPBodyType = z.infer<typeof SendOTPBodySchema>
export type VerificationCodeType = z.infer<typeof VerificationCodeSchema>
export type RegisterBodyType = z.infer<typeof RegisterBodySchema>
export type RegisterResType = z.infer<typeof RegisterResSchema>
export type RegisterProviderBodyType = z.infer<typeof RegisterProviderBodySchema>
export type GoogleAuthStateType = z.infer<typeof GoogleAuthStateSchema>
export type GetAuthorizationUrlResType = z.infer<typeof GetAuthorizationUrlResSchema>
export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>
export type DisableTwoFactorBodyType = z.infer<typeof DisableTwoFactorBodySchema>
export type TwoFactorSetupResType = z.infer<typeof TwoFactorSetupResSchema>