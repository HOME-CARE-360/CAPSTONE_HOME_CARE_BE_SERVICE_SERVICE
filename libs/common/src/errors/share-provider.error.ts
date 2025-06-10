import { NotFoundException } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";

export const ServiceProviderNotFoundException = new RpcException(
    new NotFoundException([
        { message: 'Error.ServiceProviderNotFound', path: ['id'] },
    ])
);