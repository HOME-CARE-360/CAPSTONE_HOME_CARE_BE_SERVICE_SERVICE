import { createZodDto } from "nestjs-zod";
import {
    ForgotPasswordBodySchema,
    GetAuthorizationUrlResSchema,
    LoginBodySchema,
    LoginResSchema,
    LogoutBodySchema,
    RefreshTokenBodySchema,
    RefreshTokenResSchema,
    RegisterBodySchema,
    RegisterProviderBodySchema,
    RegisterResSchema,
    SendOTPBodySchema,
} from "./auth.model";




export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) { }
export class RegisterResDTO extends createZodDto(RegisterResSchema) { }

export class SendOTPBodyDTO extends createZodDto(SendOTPBodySchema) { }
export class LoginBodyDTO extends createZodDto(LoginBodySchema) { }

export class LoginResDTO extends createZodDto(LoginResSchema) { }

export class RefreshTokenBodyDTO extends createZodDto(RefreshTokenBodySchema) { }
export class RefreshTokenResDTO extends createZodDto(RefreshTokenResSchema) { }

export class LogoutBodyDTO extends createZodDto(LogoutBodySchema) { }
export class ForgotPasswordBodyDTO extends createZodDto(ForgotPasswordBodySchema) { }

export class GetAuthorizationUrlResDTO extends createZodDto(GetAuthorizationUrlResSchema) { }
export class RegisterProviderBodyDto extends createZodDto(RegisterProviderBodySchema) { }
