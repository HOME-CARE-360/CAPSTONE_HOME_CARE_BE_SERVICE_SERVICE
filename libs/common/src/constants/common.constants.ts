import { z } from 'zod'

export const UserStatusConst = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    BLOCKED: 'BLOCKED'
} as const;

export const UserStatusEnum = z.nativeEnum(UserStatusConst);

export const SessionConst = {
    MORNING: 'MORNING',
    AFTERNOON: 'AFTERNOON'
} as const;

export const SessionEnum = z.nativeEnum(SessionConst);

export const WeekDayConst = {
    MONDAY: 'MONDAY',
    TUESDAY: 'TUESDAY',
    WEDNESDAY: 'WEDNESDAY',
    THURSDAY: 'THURSDAY',
    FRIDAY: 'FRIDAY',
    SATURDAY: 'SATURDAY',
    SUNDAY: 'SUNDAY'
} as const;

export const WeekDayEnum = z.nativeEnum(WeekDayConst);

export const GenderConst = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER'
} as const;

export const GenderEnum = z.nativeEnum(GenderConst);

export const BookingStatusConst = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
} as const;

export const BookingStatusEnum = z.nativeEnum(BookingStatusConst);

export const PaymentStatusConst = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED'
} as const;

export const PaymentStatusEnum = z.nativeEnum(PaymentStatusConst);

export const PaymentMethodConst = {
    CASH: 'CASH',
    CREDIT_CARD: 'CREDIT_CARD',
    BANK_TRANSFER: 'BANK_TRANSFER',
    MOMO: 'MOMO',
    ZALOPAY: 'ZALOPAY'
} as const;

export const PaymentMethodEnum = z.nativeEnum(PaymentMethodConst);

export const VerificationCodeTypeConst = {
    REGISTER: 'REGISTER',
    FORGOT_PASSWORD: 'FORGOT_PASSWORD',
    LOGIN: 'LOGIN',
    DISABLE_2FA: 'DISABLE_2FA'
} as const;

export const VerificationCodeTypeEnum = z.nativeEnum(VerificationCodeTypeConst);

export const HTTPMethodConst = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    PATCH: 'PATCH',
    OPTIONS: 'OPTIONS',
    HEAD: 'HEAD'
} as const;

export const HTTPMethodEnum = z.nativeEnum(HTTPMethodConst);

export const CompanyTypeConst = {
    SOLE_PROPRIETORSHIP: 'SOLE_PROPRIETORSHIP',
    LIMITED_LIABILITY: 'LIMITED_LIABILITY',
    JOINT_STOCK: 'JOINT_STOCK',
    PARTNERSHIP: 'PARTNERSHIP',
    OTHER: 'OTHER',
} as const

export const CompanyTypeEnum = z.nativeEnum(CompanyTypeConst)

export type CompanyType = keyof typeof CompanyTypeConst
export const VerificationStatusConst = {
    PENDING: 'PENDING',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED',
} as const

export const VerificationStatusEnum = z.nativeEnum(VerificationStatusConst)

export type VerificationStatus = keyof typeof VerificationStatusConst