import { NextResponse } from "next/server"

import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET() {
  try {
    const prisma = getPrisma()
    const data = await prisma.department.findMany({
      orderBy: { id: "asc" },
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server."
    return NextResponse.json({ success: false, code: "SERVER_ERROR", message }, { status: 500 })
  }
}
