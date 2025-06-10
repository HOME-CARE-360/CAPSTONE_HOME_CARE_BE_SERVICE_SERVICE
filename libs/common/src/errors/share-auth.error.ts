import { UnauthorizedException } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";

export const UnauthorizedAccessException = new RpcException(
    new UnauthorizedException('Error.UnauthorizedAccess')
);