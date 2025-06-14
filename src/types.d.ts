import { AdminUser } from "@prisma/client"

export type Env<B = {}, V = {}> = {
  Bindings: B
  Variables: V
}

export type BaseEnv = {
  DB: D1Database
}

export type WithJWT = {
  JWT_SECRET: string
}

export type DBEnv = AppEnv<BaseEnv>

export type AdminEnv = AppEnv<BaseEnv & WithJWT, { user: AdminUser }>
