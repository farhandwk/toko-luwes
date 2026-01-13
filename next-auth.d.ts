import type { appUser } from "./types"
import NextAuth from "next-auth"

declare module "next-auth" {
    interface User extends appUser {}

    interface Session {
        user: appUser & DefaultSession['user']
    } 
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string,
        username: string
    }
}