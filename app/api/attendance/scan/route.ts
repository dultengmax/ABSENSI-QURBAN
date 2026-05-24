import { NextResponse } from "next/server"
import { ScanMethod, SessionType } from "@prisma/client"

import { scanAttendance, scanAttendanceByQr } from "@/lib/attendance-db"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = parseScanBody(body)

    if (!parsed.ok) {
      return NextResponse.json({ success: false, code: "INVALID_PAYLOAD", message: parsed.message }, { status: 400 })
    }

    const result = "qrCode" in parsed.data ? await scanAttendanceByQr(parsed.data) : await scanAttendance(parsed.data)
    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    return handleRouteError(error)
  }
}

function parseScanBody(body: any) {
  const rawEmployeeId = body.employeeId
  const employeeId = Number(rawEmployeeId)
  const qrCode = typeof body.qrCode === "string" ? body.qrCode.trim() : ""
  const locationId = Number(body.locationId)
  const sessionType = body.sessionType as SessionType
  const scanMethod = body.scanMethod as ScanMethod | undefined

  if (!qrCode && !Number.isInteger(employeeId)) {
    return { ok: false as const, message: "employeeId atau qrCode wajib diisi." }
  }
  if (!Number.isInteger(locationId)) return { ok: false as const, message: "locationId wajib berupa angka." }
  if (!Object.values(SessionType).includes(sessionType)) return { ok: false as const, message: "sessionType tidak valid." }
  if (!body.scannedAt || Number.isNaN(new Date(body.scannedAt).getTime())) {
    return { ok: false as const, message: "scannedAt wajib berupa ISO date string." }
  }
  if (scanMethod && !Object.values(ScanMethod).includes(scanMethod)) {
    return { ok: false as const, message: "scanMethod tidak valid." }
  }

  const baseData = {
    locationId,
    sessionType,
    scannedAt: body.scannedAt as string,
    scanMethod,
    note: typeof body.note === "string" ? body.note : undefined,
  }

  if (qrCode) {
    return {
      ok: true as const,
      data: {
        ...baseData,
        qrCode,
      },
    }
  }

  return {
    ok: true as const,
    data: {
      ...baseData,
      employeeId,
    },
  }
}

function handleRouteError(error: unknown) {
  const message = error instanceof Error ? error.message : "Terjadi kesalahan server."
  return NextResponse.json({ success: false, code: "SERVER_ERROR", message }, { status: 500 })
}
