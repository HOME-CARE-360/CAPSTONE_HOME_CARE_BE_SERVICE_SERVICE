// src/common/guards/verified-provider.guard.ts
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { REQUEST_USER_KEY } from '../constants/auth.constant';
import { AccessTokenPayload } from '../types/jwt.type';

@Injectable()
export class VerifiedProviderGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();


        const user = req[REQUEST_USER_KEY] as AccessTokenPayload;
        const providerId = user.providerId;

        if (!providerId) {
            throw new ForbiddenException('Missing provider identifier');
        }

        const provider = await this.prisma.serviceProvider.findUnique({
            where: { id: providerId },
            select: { verificationStatus: true },
        });

        if (!provider) {
            throw new ForbiddenException('ServiceProvider not found');
        }
        if (!provider.verificationStatus) {
            throw new ForbiddenException('Your provider account is not verified');
        }

        return true;
    }
}
