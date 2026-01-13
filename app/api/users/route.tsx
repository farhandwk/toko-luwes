import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Users } from "lucide-react";

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

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID
const SHEET_NAME = 'users'

export async function POST(req: Request) {
    try {
        const sheets = getSheets()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A2:D2`
        })

        if (!response.ok) {
            throw new Error("Gagal fetch users")
        }

        const rows = response.data.values || [];
        const user = rows.map((row) => ({
            id: row[0],
            name: row[1],
            username: row[2],
            passowrd: row[3],
        }))

        const username = user[0]?.username
        console.log('Username: ', username)

        return NextResponse.json(user)
    }
    catch (error) {
        console.error("Pesan Error fetch users:", error)
        return NextResponse.json({error: "Gagal mengambil data users"}, {status: 500})
    }
}