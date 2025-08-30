import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ServiceStatus } from '@prisma/client';

@Injectable()
export class DbToolsService {
    constructor(private prisma: PrismaService) { }

    async findProviders(params: { id?: number; name?: string; taxId?: string; page?: number; size?: number }) {
        const { id, name, taxId, page = 1, size = 10 } = params;
        return this.prisma.serviceProvider.findMany({
            where: {
                ...(id ? { id } : {}),
                ...(taxId ? { taxId } : {}),
                ...(name ? { user: { name: { contains: name, mode: 'insensitive' } } } : {}),
            },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                services: { select: { id: true, name: true, basePrice: true, status: true } },
            },
            skip: (page - 1) * size,
            take: size,
            orderBy: { id: 'desc' },
        });
    }

    async findServices(params: { id?: number; name?: string; providerId?: number; categoryId?: number; page?: number; size?: number }) {
        const { id, name, providerId, categoryId, page = 1, size = 10 } = params;
        return this.prisma.service.findMany({
            where: {
                ...(id ? { id } : {}),
                ...(name ? { name: { contains: name, mode: 'insensitive' } } : {}),
                ...(providerId ? { providerId } : {}),
                ...(categoryId ? { categoryId } : {}),
                deletedAt: null,
                status: ServiceStatus.ACCEPTED
            },
            select: {
                id: true,
                name: true,
                basePrice: true,
                virtualPrice: true,
                durationMinutes: true,
                status: true,
                unit: true,
                Category: { select: { id: true, name: true } },
                provider: { select: { id: true, user: { select: { name: true } } } },
            },
            skip: (page - 1) * size,
            take: size,
            orderBy: { id: 'desc' },
        });
    }

    async findCategories(params: { id?: number; name?: string; parentCategoryId?: number; page?: number; size?: number }) {
        const { id, name, parentCategoryId, page = 1, size = 10 } = params;
        return this.prisma.category.findMany({
            where: {
                ...(id ? { id } : {}),
                ...(name ? { name: { contains: name, mode: 'insensitive' } } : {}),
                ...(parentCategoryId !== undefined ? { parentCategoryId } : {}),
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                parentCategoryId: true,
                childrenCategories: { select: { id: true, name: true } },
            },
            skip: (page - 1) * size,
            take: size,
            orderBy: { id: 'asc' },
        });
    }
}
