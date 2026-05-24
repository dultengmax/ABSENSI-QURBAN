import { NextResponse } from "next/server"

import { getMonthlySummary } from "@/lib/attendance-db"

export const runtime = "nodejs"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const employeeId = Number(id)
    const year = Number(searchParams.get("year"))
    const month = Number(searchParams.get("month"))

    if (!Number.isInteger(employeeId) || !Number.isInteger(year) || !Number.isInteger(month)) {
      return NextResponse.json(
        { success: false, code: "INVALID_PARAMS", message: "id, year, dan month wajib berupa angka." },
        { status: 400 },
      )
    }

    const data = await getMonthlySummary(employeeId, year, month)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server."
    return NextResponse.json({ success: false, code: "SERVER_ERROR", message }, { status: 500 })
  }
}
