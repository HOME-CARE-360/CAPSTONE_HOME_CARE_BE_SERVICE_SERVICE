import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class PaymentAPIKeyGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) { }
    canActivate(
        context: ExecutionContext,
    ): boolean {
        const request = context.switchToHttp().getRequest();
        const xAPIKey = request.headers['Authorization']?.split(' ')[1]
        if (xAPIKey !== this.configService.get("PAYMENT_API_KEY")) {
            throw new UnauthorizedException()
        }
        return true
    }
}