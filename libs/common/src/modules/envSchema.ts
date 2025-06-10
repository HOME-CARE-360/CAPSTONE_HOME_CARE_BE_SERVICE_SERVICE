import z from 'zod';

export const envSchema = z.object({
    DATABASE_URL_MAIN: z.string().url(),

    ACCESS_TOKEN_SECRET: z.string(),
    ACCESS_TOKEN_EXPIRES_IN: z.string().trim(),

    REFRESH_TOKEN_SECRET: z.string(),
    REFRESH_TOKEN_EXPIRES_IN: z.string().trim(),

    APP_NAME: z.string(),
    ADMIN_PASSWORD: z.string(),
    ADMIN_EMAIL: z.string().email(),
    ADMIN_PHONE_NUMBER: z.string(),

    ADMIN_NAME: z.string(),

    PAYMENT_API_KEY: z.string(),
    RESEND_API_KEY: z.string(),
    MANAGER_HTTP_PORT: z.string(),

    MANAGER_TCP_PORT: z.string(),
    OTP_EXPIRES_IN: z.string().trim(),

    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_REDIRECT_URI: z.string().url(),
    GOOGLE_CLIENT_REDIRECT_URI: z.string().optional(),

    S3_ACCESS_KEY: z.string(),
    S3_SECRET_KEY: z.string(),
    S3_BUCKET_NAME: z.string(),
    S3_REGION: z.string(),
    S3_ENPOINT: z.string().url(),
});
