"use server"

import { revalidatePath } from "next/cache"

import { departmentCreateSchema, departmentUpdateSchema, idSchema } from "@/lib/crud-validation"
import { getPrisma } from "@/lib/prisma"
import {
  actionError,
  actionSuccess,
  formDataToObject,
  handleActionException,
  revalidateOperationalPaths,
} from "@/lib/server-action-utils"

export async function listDepartmentsAction() {
  try {
    const prisma = getPrisma()
    const data = await prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { id: "asc" },
    })

    return actionSuccess(data)
  } catch (error) {
    return handleActionException(error)
  }
}

export async function getDepartmentAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = idSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const data = await prisma.department.findUnique({
      where: { id: parsed.data.id },
      include: {
        employees: {
          orderBy: { name: "asc" },
        },
      },
    })

    if (!data) return actionError("NOT_FOUND", "Bagian tidak ditemukan.")
    return actionSuccess(data)
  } catch (error) {
    return handleActionException(error)
  }
}

export async function createDepartmentAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = departmentCreateSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const data = await prisma.department.create({
      data: parsed.data,
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(data, "Bagian berhasil dibuat.")
  } catch (error) {
    return handleActionException(error)
  }
}

export async function updateDepartmentAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = departmentUpdateSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const { id, ...data } = parsed.data
    const prisma = getPrisma()
    const updated = await prisma.department.update({
      where: { id },
      data,
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(updated, "Bagian berhasil diperbarui.")
  } catch (error) {
    return handleActionException(error)
  }
}

export async function deleteDepartmentAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = idSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const deleted = await prisma.department.delete({
      where: { id: parsed.data.id },
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(deleted, "Bagian berhasil dihapus.")
  } catch (error) {
    return handleActionException(error)
  }
}
