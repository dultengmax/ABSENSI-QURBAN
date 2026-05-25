"use server"

import { QurbanLogisticsStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"

import { idSchema, qurbanLogisticsCreateSchema, qurbanLogisticsUpdateSchema } from "@/lib/crud-validation"
import { getPrisma } from "@/lib/prisma"
import {
  actionError,
  actionSuccess,
  formDataToObject,
  handleActionException,
  revalidateOperationalPaths,
} from "@/lib/server-action-utils"

export async function listQurbanLogisticsAction() {
  try {
    const prisma = getPrisma()
    const data = await prisma.qurbanLogisticsItem.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
    })

    return actionSuccess(data)
  } catch (error) {
    return handleActionException(error)
  }
}

export async function getQurbanLogisticsAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = idSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const data = await prisma.qurbanLogisticsItem.findUnique({
      where: { id: parsed.data.id },
    })

    if (!data) return actionError("NOT_FOUND", "Data logistik tidak ditemukan.")
    return actionSuccess(data)
  } catch (error) {
    return handleActionException(error)
  }
}

export async function createQurbanLogisticsAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = qurbanLogisticsCreateSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const data = await prisma.qurbanLogisticsItem.create({
      data: {
        ...parsed.data,
        status: parsed.data.status ?? deriveStatus(parsed.data.quantity, parsed.data.available),
      },
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(data, "Data logistik berhasil ditambahkan.")
  } catch (error) {
    return handleActionException(error)
  }
}

type CreateQurbanLogisticsFormState = Awaited<ReturnType<typeof createQurbanLogisticsAction>> | null

export async function createQurbanLogisticsFormAction(
  _previousState: CreateQurbanLogisticsFormState,
  formData: FormData,
): Promise<CreateQurbanLogisticsFormState> {
  return createQurbanLogisticsAction(formData)
}

export async function updateQurbanLogisticsAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = qurbanLogisticsUpdateSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const { id, ...data } = parsed.data
    const prisma = getPrisma()
    const current = await prisma.qurbanLogisticsItem.findUnique({ where: { id } })
    if (!current) return actionError("NOT_FOUND", "Data logistik tidak ditemukan.")

    const quantity = data.quantity ?? current.quantity
    const available = data.available ?? current.available
    const updated = await prisma.qurbanLogisticsItem.update({
      where: { id },
      data: {
        ...data,
        status: data.status ?? deriveStatus(quantity, available),
      },
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(updated, "Data logistik berhasil diperbarui.")
  } catch (error) {
    return handleActionException(error)
  }
}

type UpdateQurbanLogisticsFormState = Awaited<ReturnType<typeof updateQurbanLogisticsAction>> | null

export async function updateQurbanLogisticsFormAction(
  _previousState: UpdateQurbanLogisticsFormState,
  formData: FormData,
): Promise<UpdateQurbanLogisticsFormState> {
  return updateQurbanLogisticsAction(formData)
}

export async function deleteQurbanLogisticsAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = idSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const deleted = await prisma.qurbanLogisticsItem.delete({
      where: { id: parsed.data.id },
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(deleted, "Data logistik berhasil dihapus.")
  } catch (error) {
    return handleActionException(error)
  }
}

type DeleteQurbanLogisticsFormState = Awaited<ReturnType<typeof deleteQurbanLogisticsAction>> | null

export async function deleteQurbanLogisticsFormAction(
  _previousState: DeleteQurbanLogisticsFormState,
  formData: FormData,
): Promise<DeleteQurbanLogisticsFormState> {
  return deleteQurbanLogisticsAction(formData)
}

function deriveStatus(quantity: number, available: number) {
  if (quantity === 0 || available === 0) return QurbanLogisticsStatus.UNAVAILABLE
  if (available < quantity) return QurbanLogisticsStatus.LIMITED
  return QurbanLogisticsStatus.AVAILABLE
}
