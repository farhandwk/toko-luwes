import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod'
import type { appUser } from './types'
import type { authUser } from './types';
import { google } from 'googleapis';


const getSheets = () => {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })
    return google.sheets({ version: 'v4', auth })
}

const SPREADSHEETS_ID = process.env.GOOGLE_SHEET_ID
const SHEET_NAME = 'users'

async function getUser(username: string) {
    try {
        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEETS_ID,
            range: `${SHEET_NAME}!A2:D`
        })

        if (!response.ok) {
            throw new ErrorEvent("Gagal mengambil data users")
        }

        const rows = response.data.values || [];
        const users: authUser[] = rows.map((row) => ({
            id: row[0],
            name: row[1],
            username: row[2],
            password: row[3]
        }))

        const user = users.find((u) => u.username == username)

        if (!user) return null;

        return user ?? null
    }
    catch (error) {
        return console.error('Pesan error mencari data user', error)
    }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [Credentials({
    async authorize(credentials): Promise<appUser | null> {
        if (!credentials) return null

        const parsed = z.object({ username: z.string(), password: z.string() }).safeParse(credentials)

        if (!parsed.success) return null;

        const { username, password } = parsed.data

        const user = await getUser(username)

        if (!user) {
            return null
        }

        if (user.password !== password) {
            return null
        }

        return {
            id: user.id,
            name: user.name,
            username: user.username,
        }
    }
  })],
  session: {
    strategy: 'jwt',
    maxAge: 1 * 24 * 60 * 60,
    // updateAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
        if (user) {
            token.id = user.id
        }

        return token
    },

    async session({ session, token }) {
        if (token) {
            session.user.id = token.id
        }

        return session
    },
  },
  secret: process.env.NEXT_AUTH_SECRET,
});