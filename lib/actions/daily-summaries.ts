"use server"

import { revalidatePath } from "next/cache"

import { dailySummaryCreateSchema, dailySummaryUpdateSchema, idSchema } from "@/lib/crud-validation"
import { getPrisma } from "@/lib/prisma"
import {
  actionError,
  actionSuccess,
  formDataToObject,
  handleActionException,
  revalidateOperationalPaths,
} from "@/lib/server-action-utils"

export async function listDailySummariesAction() {
  try {
    const prisma = getPrisma()
    const data = await prisma.dailySummary.findMany({
      include: {
        employee: {
          include: {
            department: true,
            location: true,
          },
        },
        location: true,
      },
      orderBy: [{ date: "desc" }, { employee: { name: "asc" } }],
    })

    return actionSuccess(data)
  } catch (error) {
    return handleActionException(error)
  }
}

export async function getDailySummaryAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = idSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const data = await prisma.dailySummary.findUnique({
      where: { id: parsed.data.id },
      include: {
        employee: {
          include: {
            department: true,
            location: true,
          },
        },
        location: true,
      },
    })

    if (!data) return actionError("NOT_FOUND", "Rekap harian tidak ditemukan.")
    return actionSuccess(data)
  } catch (error) {
    return handleActionException(error)
  }
}

export async function createDailySummaryAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = dailySummaryCreateSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const data = await prisma.dailySummary.create({
      data: normalizeDailySummary(parsed.data),
      include: {
        employee: true,
        location: true,
      },
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(data, "Rekap harian berhasil dibuat.")
  } catch (error) {
    return handleActionException(error)
  }
}

export async function updateDailySummaryAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = dailySummaryUpdateSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const { id, ...data } = parsed.data
    const prisma = getPrisma()
    const updated = await prisma.dailySummary.update({
      where: { id },
      data: normalizeDailySummary(data),
      include: {
        employee: true,
        location: true,
      },
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(updated, "Rekap harian berhasil diperbarui.")
  } catch (error) {
    return handleActionException(error)
  }
}

export async function deleteDailySummaryAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = idSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const deleted = await prisma.dailySummary.delete({
      where: { id: parsed.data.id },
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(deleted, "Rekap harian berhasil dihapus.")
  } catch (error) {
    return handleActionException(error)
  }
}

function normalizeDailySummary<T extends { checkInDone?: boolean; breakfastDone?: boolean; lunchDone?: boolean; dinnerDone?: boolean; allComplete?: boolean }>(
  data: T,
) {
  const allSessionFlagsPresent =
    data.checkInDone !== undefined &&
    data.breakfastDone !== undefined &&
    data.lunchDone !== undefined &&
    data.dinnerDone !== undefined

  if (!allSessionFlagsPresent || data.allComplete !== undefined) return data

  return {
    ...data,
    allComplete: Boolean(data.checkInDone && data.breakfastDone && data.lunchDone && data.dinnerDone),
  }
}
