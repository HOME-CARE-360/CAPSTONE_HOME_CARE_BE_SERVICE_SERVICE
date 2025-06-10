import { Injectable } from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'
import { RoleType } from '../models/shared-role.model'
import { RoleName } from '../constants/role.constant'


@Injectable()
export class SharedRoleRepository {
    private customerRoleId: number | null = null
    private adminRoleId: number | null = null
    private staffRoleId: number | null = null
    private serviceProviderRoleId: number | null = null

    constructor(private readonly prismaService: PrismaService) { }

    private async getRole(roleName: string) {
        const role: RoleType = await this.prismaService.$queryRaw`
    SELECT * FROM "Role" WHERE name = ${roleName} AND "deletedAt" IS NULL LIMIT 1;
  `.then((res: RoleType[]) => {
            if (res.length === 0) {
                throw new Error('Role not found')
            }
            return res[0]
        })
        return role
    }

    async getCustomerRoleId() {
        if (this.customerRoleId) {
            return {
                id: this.customerRoleId,
                name: RoleName.Customer
            }
        }
        const role = await this.getRole(RoleName.Customer)
        this.customerRoleId = role.id
        return {
            id: role.id,
            name: RoleName.Customer
        }
    }

    async getAdminRoleId() {
        if (this.adminRoleId) {
            return {
                id: this.adminRoleId,
                name: RoleName.Admin
            }
        }
        const role = await this.getRole(RoleName.Admin)

        this.adminRoleId = role.id
        return {
            id: role.id,
            name: RoleName.Admin
        }
    }

    async getStaffRoleId() {
        if (this.staffRoleId) {
            return {
                id: this.staffRoleId,
                name: RoleName.Staff
            }
        }
        const role = await this.getRole(RoleName.Staff)

        this.staffRoleId = role.id
        return {
            id: role.id,
            name: RoleName.Staff
        }
    }
    async getServiceProviderRoleId() {
        if (this.serviceProviderRoleId) {
            return {
                id: this.serviceProviderRoleId,
                name: RoleName.ServiceProvider
            }
        }
        const role = await this.getRole(RoleName.ServiceProvider)

        this.serviceProviderRoleId = role.id
        return {
            id: role.id,
            name: RoleName.ServiceProvider
        }
    }
}