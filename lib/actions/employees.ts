"use server"

import { revalidatePath } from "next/cache"

import { employeeCreateSchema, employeeUpdateSchema, idSchema } from "@/lib/crud-validation"
import { getPrisma } from "@/lib/prisma"
import {
  actionError,
  actionSuccess,
  formDataToObject,
  handleActionException,
  revalidateOperationalPaths,
} from "@/lib/server-action-utils"

export async function listEmployeesAction() {
  try {
    const prisma = getPrisma()
    const data = await prisma.employee.findMany({
      include: {
        department: true,
        location: true,
        _count: {
          select: {
            attendanceSessions: true,
            dailySummaries: true,
          },
        },
      },
      orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
    })

    return actionSuccess(data)
  } catch (error) {
    return handleActionException(error)
  }
}

export async function getEmployeeAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = idSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const data = await prisma.employee.findUnique({
      where: { id: parsed.data.id },
      include: {
        department: true,
        location: true,
        dailySummaries: {
          orderBy: { date: "desc" },
          take: 31,
        },
      },
    })

    if (!data) return actionError("NOT_FOUND", "Karyawan tidak ditemukan.")
    return actionSuccess(data)
  } catch (error) {
    return handleActionException(error)
  }
}

export async function createEmployeeAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = employeeCreateSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const data = await prisma.employee.create({
      data: parsed.data,
      include: {
        department: true,
        location: true,
      },
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(data, "Karyawan berhasil dibuat.")
  } catch (error) {
    return handleActionException(error)
  }
}

type CreateEmployeeFormState = Awaited<ReturnType<typeof createEmployeeAction>> | null

export async function createEmployeeFormAction(
  _previousState: CreateEmployeeFormState,
  formData: FormData,
): Promise<CreateEmployeeFormState> {
  return createEmployeeAction(formData)
}

export async function updateEmployeeAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = employeeUpdateSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const { id, ...data } = parsed.data
    const prisma = getPrisma()
    const updated = await prisma.employee.update({
      where: { id },
      data,
      include: {
        department: true,
        location: true,
      },
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(updated, "Karyawan berhasil diperbarui.")
  } catch (error) {
    return handleActionException(error)
  }
}

type UpdateEmployeeFormState = Awaited<ReturnType<typeof updateEmployeeAction>> | null

export async function updateEmployeeFormAction(
  _previousState: UpdateEmployeeFormState,
  formData: FormData,
): Promise<UpdateEmployeeFormState> {
  return updateEmployeeAction(formData)
}

export async function deleteEmployeeAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = idSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const deleted = await prisma.employee.update({
      where: { id: parsed.data.id },
      data: { isActive: false },
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(deleted, "Karyawan berhasil dinonaktifkan.")
  } catch (error) {
    return handleActionException(error)
  }
}

type DeleteEmployeeFormState = Awaited<ReturnType<typeof deleteEmployeeAction>> | null

export async function deleteEmployeeFormAction(
  _previousState: DeleteEmployeeFormState,
  formData: FormData,
): Promise<DeleteEmployeeFormState> {
  return deleteEmployeeAction(formData)
}

export async function hardDeleteEmployeeAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = idSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const deleted = await prisma.employee.delete({
      where: { id: parsed.data.id },
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(deleted, "Karyawan berhasil dihapus permanen.")
  } catch (error) {
    return handleActionException(error)
  }
}
