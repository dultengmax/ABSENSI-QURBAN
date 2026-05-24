import { NextResponse } from "next/server"
import { QurbanLogisticsStatus } from "@prisma/client"

import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET() {
  try {
    const prisma = getPrisma()
    const data = await prisma.qurbanLogisticsItem.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = parseLogisticsBody(body)

    if (!parsed.ok) {
      return NextResponse.json({ success: false, code: "INVALID_PAYLOAD", message: parsed.message }, { status: 400 })
    }

    const prisma = getPrisma()
    const data = await prisma.qurbanLogisticsItem.create({
      data: parsed.data,
    })

    return NextResponse.json({ success: true, message: "Data logistik berhasil ditambahkan.", data }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}

function parseLogisticsBody(body: any) {
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const ownerName = typeof body.ownerName === "string" ? body.ownerName.trim() : ""
  const quantity = Number(body.quantity)
  const available = Number(body.available)
  const status = normalizeStatus(body.status)

  if (!name) return { ok: false as const, message: "Nama peralatan wajib diisi." }
  if (!ownerName) return { ok: false as const, message: "Data punya siapa wajib diisi." }
  if (!Number.isInteger(quantity) || quantity < 0) return { ok: false as const, message: "Total jumlah wajib angka minimal 0." }
  if (!Number.isInteger(available) || available < 0) {
    return { ok: false as const, message: "Jumlah tersedia wajib angka minimal 0." }
  }
  if (available > quantity) return { ok: false as const, message: "Jumlah tersedia tidak boleh melebihi total." }

  return {
    ok: true as const,
    data: {
      name,
      ownerName,
      quantity,
      available,
      status: status ?? deriveStatus(quantity, available),
      category: optionalString(body.category),
      ownerContact: optionalString(body.ownerContact),
      unit: optionalString(body.unit) ?? "unit",
      storageLocation: optionalString(body.storageLocation),
      notes: optionalString(body.notes),
    },
  }
}

function optionalString(value: unknown) {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function normalizeStatus(value: unknown) {
  if (typeof value !== "string") return null
  const normalized = value.trim().toUpperCase().replaceAll("-", "_")
  if (!Object.values(QurbanLogisticsStatus).includes(normalized as QurbanLogisticsStatus)) return null
  return normalized as QurbanLogisticsStatus
}

function deriveStatus(quantity: number, available: number) {
  if (quantity === 0 || available === 0) return QurbanLogisticsStatus.UNAVAILABLE
  if (available < quantity) return QurbanLogisticsStatus.LIMITED
  return QurbanLogisticsStatus.AVAILABLE
}

function handleRouteError(error: unknown) {
  const message = error instanceof Error ? error.message : "Terjadi kesalahan server."
  return NextResponse.json({ success: false, code: "SERVER_ERROR", message }, { status: 500 })
}
