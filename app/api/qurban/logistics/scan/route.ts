import { NextResponse } from "next/server"

import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

const LOGISTICS_QR_PREFIX = "QURBAN_LOGISTICS:"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = parseScanBody(body)

    if (!parsed.ok) {
      return NextResponse.json({ success: false, code: parsed.code, message: parsed.message }, { status: parsed.status })
    }

    const prisma = getPrisma()
    const item = await prisma.qurbanLogisticsItem.findUnique({
      where: { qrCode: parsed.qrCode },
    })

    if (!item) {
      return NextResponse.json(
        { success: false, code: "LOGISTICS_QR_NOT_FOUND", message: "QR logistik tidak terdaftar di database." },
        { status: 404 },
      )
    }

    const scannedAt = new Date(parsed.scannedAt)
    const updated = await prisma.qurbanLogisticsItem.update({
      where: { id: item.id },
      data: {
        isChecked: true,
        checkedAt: scannedAt,
      },
    })

    return NextResponse.json({
      success: true,
      message: `${updated.name} berhasil dicek untuk sesi kelengkapan logistik.`,
      data: updated,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server."
    return NextResponse.json({ success: false, code: "SERVER_ERROR", message }, { status: 500 })
  }
}

function parseScanBody(body: any) {
  const payload = typeof body.qrCode === "string" ? body.qrCode.trim() : ""
  const sessionType = typeof body.sessionType === "string" ? body.sessionType : ""

  if (!payload.startsWith(LOGISTICS_QR_PREFIX)) {
    return {
      ok: false as const,
      code: "INVALID_LOGISTICS_QR",
      message: "QR ini bukan QR logistik qurban.",
      status: 400,
    }
  }

  if (sessionType !== "LOGISTICS_COMPLETENESS") {
    return {
      ok: false as const,
      code: "WRONG_SESSION",
      message: "QR logistik hanya bisa discan pada sesi Kelengkapan Logistik.",
      status: 400,
    }
  }

  if (!body.scannedAt || Number.isNaN(new Date(body.scannedAt).getTime())) {
    return {
      ok: false as const,
      code: "INVALID_SCAN_TIME",
      message: "scannedAt wajib berupa ISO date string.",
      status: 400,
    }
  }

  return {
    ok: true as const,
    qrCode: payload.slice(LOGISTICS_QR_PREFIX.length).trim(),
    scannedAt: body.scannedAt as string,
  }
}
