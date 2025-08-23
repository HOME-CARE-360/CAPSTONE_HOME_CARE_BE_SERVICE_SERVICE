import { Injectable } from '@nestjs/common'
// import { PythonShell } from 'python-shell'

import { PrismaService } from 'libs/common/src/services/prisma.service'
import { ShareServicesRepository } from 'libs/common/src/repositories/shared-service.repo'
import { GetServicesQueryType, } from 'libs/common/src/request-response-type/service/services.model'

@Injectable()
export class ServicesService {
    constructor(private readonly prisma: PrismaService, private readonly servicesRepository: ShareServicesRepository) { }

    // async getRecommendation(customerId: number) {
    //     const customer = await this.prisma.customerProfile.findUnique({
    //         where: { id: customerId },
    //         include: {
    //             rewardPoints: true,
    //             bookings: true,
    //             recurringBookings: true,
    //             chatMessages: true
    //         }
    //     })

    //     if (!customer) throw new Error('Customer not found')

    //     const input = {
    //         rewardPoints: customer.rewardPoints[0]?.points || 0,
    //         totalBookings: customer.bookings.length,
    //         hasRecurring: customer.recurringBookings.length > 0,
    //         chatKeywords: customer.chatMessages
    //             .filter(m => m.sender === 'user')
    //             .map(m => m.message.toLowerCase())
    //     }

    //     const result = await PythonShell.run('predict.py', {
    //         args: [JSON.stringify(input)],
    //         pythonPath: './venv/bin/python3',
    //     })


    //     const predictedPackageId: number[] = JSON.parse((result[0]))
    //     return this.prisma.servicePackage.findMany({
    //         where: {
    //             id: {
    //                 in: predictedPackageId
    //             }

    //         }
    //     })
    // }
    async getListService(props: GetServicesQueryType) {
        console.log(props);
        console.log("cc");

        const data = await this.servicesRepository.list({
            page: props.page,
            limit: props.limit,
            providerIds: props.providerIds,
            minPrice: props.minPrice,
            maxPrice: props.maxPrice,
            categories: props.categories,
            name: props.name,
            createdById: props.createdById,
            orderBy: props.orderBy,
            sortBy: props.sortBy,
        })
        return data
    }
    async getServiceDetail(serviceId: number) {
        const data = await this.servicesRepository.getServiceDetail(serviceId)
        return data

    }
    async getListSuggestionDevice(customerId: number) {
        return await this.servicesRepository.getListSuggestionDevice(customerId)
    }

}
