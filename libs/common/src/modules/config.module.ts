
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envSchema } from './envSchema';
import { config } from 'dotenv';
import path from 'path';

config({
    path: '.env',
})
@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: process.env.NODE_ENV === 'production',
            envFilePath: process.env.NODE_ENV !== 'production'
                ? [path.resolve('.env')]
                : undefined,
            validate: (env) => {
                const parsed = envSchema.safeParse(env);
                if (!parsed.success) {
                    console.error('❌ Biến môi trường không hợp lệ');
                    console.error(parsed.error.format());
                    process.exit(1);
                }
                return parsed.data;
            },
        }),
    ],
})
export class ConfigModule { }
