import { Injectable } from '@nestjs/common'
import { PythonShell } from 'python-shell'

import { PrismaService } from 'libs/common/src/services/prisma.service'
import { ShareServicesRepository } from 'libs/common/src/repositories/shared-service.repo'
import { GetServicesQueryType } from 'libs/common/src/request-response-type/service/services.model'

@Injectable()
export class ServicesService {
    constructor(private readonly prisma: PrismaService, private readonly servicesRepository: ShareServicesRepository) { }

    async getRecommendation(customerId: number) {
        const customer = await this.prisma.customerProfile.findUnique({
            where: { id: customerId },
            include: {
                rewardPoints: true,
                bookings: true,
                recurringBookings: true,
                chatMessages: true
            }
        })

        if (!customer) throw new Error('Customer not found')

        const input = {
            rewardPoints: customer.rewardPoints[0]?.points || 0,
            totalBookings: customer.bookings.length,
            hasRecurring: customer.recurringBookings.length > 0,
            chatKeywords: customer.chatMessages
                .filter(m => m.sender === 'user')
                .map(m => m.message.toLowerCase())
        }

        const result = await PythonShell.run('predict.py', {
            args: [JSON.stringify(input)],
            pythonPath: './venv/bin/python3',
        })


        const predictedPackageId: number[] = JSON.parse((result[0]))
        return this.prisma.servicePackage.findMany({
            where: {
                id: {
                    in: predictedPackageId
                }

            }
        })
    }
    async getListService(props: { query: GetServicesQueryType }) {

        const data = await this.servicesRepository.list({
            page: props.query.page,
            limit: props.query.limit,
            providerIds: props.query.providerIds,
            minPrice: props.query.minPrice,
            maxPrice: props.query.maxPrice,
            categories: props.query.categories,
            name: props.query.name,
            createdById: props.query.createdById,
            orderBy: props.query.orderBy,
            sortBy: props.query.sortBy,
        })
        return data
    }
    async getServiceDetail(serviceId: number) {
        const data = await this.servicesRepository.getServiceDetail(serviceId)
        return data

    }


}
