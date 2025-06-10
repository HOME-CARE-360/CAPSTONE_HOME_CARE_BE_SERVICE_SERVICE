import { UnprocessableEntityException } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";




export const ServiceNotFoundException = new RpcException(new UnprocessableEntityException([
    {
        message: 'Error.ServiceNotFound',
        path: 'serviceId',
    },
]))

