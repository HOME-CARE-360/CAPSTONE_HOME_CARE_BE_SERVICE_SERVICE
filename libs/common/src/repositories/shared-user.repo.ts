import { Injectable } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";
import { UserType } from "../models/shared-user.model";
import { RoleType } from "../models/shared-role.model";
import { PermissionType } from "../models/shared-permission.model";
type NewUser = Omit<UserType, "roles" | "password" | "totpSecret">
type UserIncludeRolePermissionsType = NewUser & {
    roles: Array<
        RoleType & {
            permissions: PermissionType[]
        }
    >
}
type UserIncludeRolesType = NewUser & {
    roles: Array<
        RoleType
    >
}
export type WhereUniqueUserType = { id: number } | { email: string }
@Injectable()
export class SharedUserRepository {
    constructor(private readonly prismaService: PrismaService) { }
    async findUnique(where: WhereUniqueUserType): Promise<UserType | null> {

        const data = await this.prismaService.user.findFirst({
            where: {
                ...where,
                deletedAt: null,
            }, include: {
                roles: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })
        return data

    }
    async findUniqueIncludeRolePermissions(where: WhereUniqueUserType): Promise<UserIncludeRolePermissionsType | null> {
        const hihi = await this.prismaService.user.findFirst({
            where: {
                ...where,
                deletedAt: null,
            },
            omit: {
                totpSecret: true,
                password: true
            },
            include: {
                roles: {
                    include: {
                        permissions: {
                            where: {
                                deletedAt: null,
                            },
                        },
                    },
                },
            },
        })
        return hihi as UserIncludeRolePermissionsType
    }

    update(where: { id: number }, data: Omit<Partial<UserType>, "roles">): Promise<UserIncludeRolesType | null> {

        return this.prismaService.user.update({
            where: {
                ...where,
                deletedAt: null,
            },
            data: {
                ...data
            },
            omit: {
                password: true,
                totpSecret: true
            }, include: {
                roles: true
            }

        })
    }
}   