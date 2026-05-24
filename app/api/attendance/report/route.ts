import { NextResponse } from "next/server"

import { getReport } from "@/lib/attendance-db"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { success: false, code: "INVALID_DATE_RANGE", message: "date_from dan date_to wajib diisi." },
        { status: 400 },
      )
    }

    const data = await getReport({
      dateFrom,
      dateTo,
      locationId: parseOptionalNumber(searchParams.get("location_id")),
      departmentId: parseOptionalNumber(searchParams.get("department_id")),
      employeeId: parseOptionalNumber(searchParams.get("employee_id")),
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server."
    return NextResponse.json({ success: false, code: "SERVER_ERROR", message }, { status: 500 })
  }
}

function parseOptionalNumber(value: string | null) {
  if (!value) return undefined
  const numberValue = Number(value)
  return Number.isInteger(numberValue) ? numberValue : undefined
}
