"use server"

import { revalidatePath } from "next/cache"

import { idSchema, locationCreateSchema, locationUpdateSchema } from "@/lib/crud-validation"
import { getPrisma } from "@/lib/prisma"
import {
  actionError,
  actionSuccess,
  formDataToObject,
  handleActionException,
  revalidateOperationalPaths,
} from "@/lib/server-action-utils"

export async function listLocationsAction() {
  try {
    const prisma = getPrisma()
    const data = await prisma.location.findMany({
      include: {
        workSchedule: true,
        _count: {
          select: {
            employees: true,
            attendanceSessions: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return actionSuccess(data)
  } catch (error) {
    return handleActionException(error)
  }
}

export async function getLocationAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = idSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const data = await prisma.location.findUnique({
      where: { id: parsed.data.id },
      include: {
        workSchedule: true,
        employees: {
          orderBy: { name: "asc" },
        },
      },
    })

    if (!data) return actionError("NOT_FOUND", "Lokasi tidak ditemukan.")
    return actionSuccess(data)
  } catch (error) {
    return handleActionException(error)
  }
}

export async function createLocationAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = locationCreateSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const data = await prisma.location.create({
      data: parsed.data,
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(data, "Lokasi berhasil dibuat.")
  } catch (error) {
    return handleActionException(error)
  }
}

export async function updateLocationAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = locationUpdateSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const { id, ...data } = parsed.data
    const prisma = getPrisma()
    const updated = await prisma.location.update({
      where: { id },
      data,
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(updated, "Lokasi berhasil diperbarui.")
  } catch (error) {
    return handleActionException(error)
  }
}

export async function deleteLocationAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = idSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const deleted = await prisma.location.delete({
      where: { id: parsed.data.id },
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(deleted, "Lokasi berhasil dihapus.")
  } catch (error) {
    return handleActionException(error)
  }
}
