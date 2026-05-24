import { NextResponse } from "next/server"

import { getDailyStatus } from "@/lib/attendance-db"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = Number(searchParams.get("location_id"))
    const date = searchParams.get("date")

    if (!Number.isInteger(locationId)) {
      return NextResponse.json({ success: false, code: "INVALID_LOCATION", message: "location_id wajib angka." }, { status: 400 })
    }

    if (!date) {
      return NextResponse.json({ success: false, code: "INVALID_DATE", message: "date wajib diisi." }, { status: 400 })
    }

    const data = await getDailyStatus(locationId, date)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server."
    return NextResponse.json({ success: false, code: "SERVER_ERROR", message }, { status: 500 })
  }
}
