import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { TokenService } from '../services/token.service';
import { REQUEST_USER_KEY } from '../constants/auth.constant';
import { AccessTokenPayload } from '../types/jwt.type';
import { PrismaService } from '../services/prisma.service';
import { HTTPMethod } from '@prisma/client';

@Injectable()
export class AccessTokenGuard implements CanActivate {
    constructor(private readonly tokenService: TokenService, private readonly prismaService: PrismaService) { }
    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const decodedAccessToken = await this.extractAndValidateToken(request)
        console.log(decodedAccessToken);

        await this.validateUserPermission(decodedAccessToken, request)
        return true



    }
    private async extractAndValidateToken(request: any): Promise<AccessTokenPayload> {
        const accessToken = this.extractAccessTokenFromHeader(request)
        try {
            const decodedAccessToken = await this.tokenService.verifyAccessToken(accessToken)
            request[REQUEST_USER_KEY] = decodedAccessToken
            return decodedAccessToken
        } catch {
            throw new UnauthorizedException('Error.InvalidAccessToken')
        }
    }
    private extractAccessTokenFromHeader(request: any): string {
        const accessToken = request.headers.authorization?.split(' ')[1]
        if (!accessToken) {
            throw new UnauthorizedException('Error.MissingAccessToken')
        }
        return accessToken
    }
    private async validateUserPermission(decodedAccessToken: AccessTokenPayload, req: any): Promise<void> {
        const roleIds = decodedAccessToken.roles.map((item) => item.id)
        const path = req.route.path
        const method = req.method as keyof typeof HTTPMethod
        const rolesWithPerms = await this.prismaService.role.findMany({
            where: {
                id: { in: roleIds },
                deletedAt: null,
            },
            include: {
                permissions: {
                    where: {
                        deletedAt: null,
                        path,
                        method,
                    }
                }
            }
        }).catch(() => { throw new ForbiddenException() })
        console.log(rolesWithPerms);

        const allPerms = rolesWithPerms.flatMap(r => r.permissions)
        if (allPerms.length === 0) {
            throw new ForbiddenException()
        }
    }



}