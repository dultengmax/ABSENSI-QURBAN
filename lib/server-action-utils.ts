import { Prisma } from "@prisma/client"

export type ActionResult<T> =
  | {
      ok: true
      data: T
      message?: string
    }
  | {
      ok: false
      error: {
        code: string
        message: string
        fieldErrors?: Record<string, string[]>
      }
    }

export function actionSuccess<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message }
}

export function actionError<T = never>(
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return {
    ok: false,
    error: {
      code,
      message,
      fieldErrors,
    },
  }
}

export function formDataToObject(input: FormData | Record<string, unknown>) {
  if (!(input instanceof FormData)) return input

  return Object.fromEntries(input.entries())
}

export function cleanOptionalString(value: unknown) {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function coerceOptionalBoolean(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const normalized = value.toLowerCase()
    if (["true", "1", "on", "yes"].includes(normalized)) return true
    if (["false", "0", "off", "no"].includes(normalized)) return false
  }
  return value
}

export function handleActionException(error: unknown): ActionResult<never> {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const fields = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "field unik"
      return actionError("UNIQUE_CONSTRAINT", `Data dengan ${fields} tersebut sudah ada.`)
    }

    if (error.code === "P2003") {
      return actionError("FOREIGN_KEY_CONSTRAINT", "Data terkait tidak ditemukan atau masih dipakai oleh data lain.")
    }

    if (error.code === "P2025") {
      return actionError("NOT_FOUND", "Data tidak ditemukan.")
    }
  }

  if (error instanceof Error) {
    return actionError("SERVER_ACTION_ERROR", error.message)
  }

  return actionError("SERVER_ACTION_ERROR", "Terjadi kesalahan server action.")
}

export function revalidateOperationalPaths(revalidatePath: (path: string) => void) {
  revalidatePath("/")
  revalidatePath("/attendance")
  revalidatePath("/qurban")
  revalidatePath("/qr-scanner")
  revalidatePath("/qr-generator")
}
