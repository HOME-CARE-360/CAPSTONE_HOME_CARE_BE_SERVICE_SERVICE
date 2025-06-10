import { UserStatus } from "@prisma/client"
import { z } from "zod"
import { RoleSchema } from "./shared-role.model"
import { PermissionSchema } from "./shared-permission.model"


export const UserSchema = z.object({
    id: z.number(),
    email: z.string().email(),
    phone: z.string().min(9).max(100),
    password: z.string().min(6).max(100),
    name: z.string().min(1).max(100),
    avatar: z.string().nullable(),
    status: z.nativeEnum(UserStatus),
    totpSecret: z.string().nullable(),
    roles: z.array(
        z.object({
            id: z.number(),
            name: z.string(),
        })
    ),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
    createdById: z.number().nullable(),
    deletedById: z.number().nullable(),
    updatedById: z.number().nullable()

})

export const GetUserProfileResSchema = UserSchema.omit({
    password: true,
    totpSecret: true,
}).extend({
    role: RoleSchema.pick({
        id: true,
        name: true,
    }).extend({
        permissions: z.array(
            PermissionSchema.pick({
                id: true,
                name: true,
                module: true,
                path: true,
                method: true,
            }),
        ),
    }),
})
export const UpdateProfileResSchema = UserSchema.omit({
    password: true,
    totpSecret: true,
})

export type UserType = z.infer<typeof UserSchema>
export type GetUserProfileResType = z.infer<typeof GetUserProfileResSchema>
export type UpdateProfileResType = z.infer<typeof UpdateProfileResSchema>