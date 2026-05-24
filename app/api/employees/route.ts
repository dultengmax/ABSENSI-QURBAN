import { NextResponse } from "next/server"

import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const prisma = getPrisma()
    const { searchParams } = new URL(request.url)
    const locationId = parseOptionalNumber(searchParams.get("location_id"))
    const departmentId = parseOptionalNumber(searchParams.get("department_id"))
    const search = searchParams.get("search")?.trim()

    const data = await prisma.employee.findMany({
      where: {
        isActive: true,
        ...(locationId ? { locationId } : {}),
        ...(departmentId ? { departmentId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { nik: { contains: search, mode: "insensitive" } },
                { cabang: { contains: search, mode: "insensitive" } },
                { qrCode: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        department: true,
        location: true,
      },
      orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
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
