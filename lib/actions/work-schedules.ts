"use server"

import { revalidatePath } from "next/cache"

import { idSchema, workScheduleCreateSchema, workScheduleUpdateSchema } from "@/lib/crud-validation"
import { getPrisma } from "@/lib/prisma"
import {
  actionError,
  actionSuccess,
  formDataToObject,
  handleActionException,
  revalidateOperationalPaths,
} from "@/lib/server-action-utils"

export async function listWorkSchedulesAction() {
  try {
    const prisma = getPrisma()
    const data = await prisma.workSchedule.findMany({
      include: {
        location: true,
      },
      orderBy: {
        location: { name: "asc" },
      },
    })

    return actionSuccess(data)
  } catch (error) {
    return handleActionException(error)
  }
}

export async function getWorkScheduleAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = idSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const data = await prisma.workSchedule.findUnique({
      where: { id: parsed.data.id },
      include: { location: true },
    })

    if (!data) return actionError("NOT_FOUND", "Jadwal kerja tidak ditemukan.")
    return actionSuccess(data)
  } catch (error) {
    return handleActionException(error)
  }
}

export async function createWorkScheduleAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = workScheduleCreateSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const data = await prisma.workSchedule.create({
      data: parsed.data,
      include: { location: true },
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(data, "Jadwal kerja berhasil dibuat.")
  } catch (error) {
    return handleActionException(error)
  }
}

export async function updateWorkScheduleAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = workScheduleUpdateSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const { id, ...data } = parsed.data
    const prisma = getPrisma()
    const updated = await prisma.workSchedule.update({
      where: { id },
      data,
      include: { location: true },
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(updated, "Jadwal kerja berhasil diperbarui.")
  } catch (error) {
    return handleActionException(error)
  }
}

export async function deleteWorkScheduleAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = idSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const deleted = await prisma.workSchedule.delete({
      where: { id: parsed.data.id },
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(deleted, "Jadwal kerja berhasil dihapus.")
  } catch (error) {
    return handleActionException(error)
  }
}
