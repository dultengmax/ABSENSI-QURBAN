"use server"

import { ScanMethod, SessionType, type Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"

import { attendanceSessionCreateSchema, attendanceSessionUpdateSchema, idSchema } from "@/lib/crud-validation"
import { getPrisma } from "@/lib/prisma"
import {
  actionError,
  actionSuccess,
  formDataToObject,
  handleActionException,
  revalidateOperationalPaths,
} from "@/lib/server-action-utils"

type Tx = Prisma.TransactionClient

export async function listAttendanceSessionsAction() {
  try {
    const prisma = getPrisma()
    const data = await prisma.attendanceSession.findMany({
      include: {
        employee: {
          include: {
            department: true,
            location: true,
          },
        },
        location: true,
      },
      orderBy: [{ date: "desc" }, { scannedAt: "asc" }],
    })

    return actionSuccess(data)
  } catch (error) {
    return handleActionException(error)
  }
}

export async function getAttendanceSessionAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = idSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const data = await prisma.attendanceSession.findUnique({
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

    if (!data) return actionError("NOT_FOUND", "Sesi absensi tidak ditemukan.")
    return actionSuccess(data)
  } catch (error) {
    return handleActionException(error)
  }
}

export async function createAttendanceSessionAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = attendanceSessionCreateSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const data = await prisma.$transaction(async (tx) => {
      const created = await tx.attendanceSession.create({
        data: parsed.data,
        include: {
          employee: true,
          location: true,
        },
      })

      await syncDailySummary(tx, created.employeeId, created.locationId, created.date)
      return created
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(data, "Sesi absensi berhasil dibuat.")
  } catch (error) {
    return handleActionException(error)
  }
}

export async function updateAttendanceSessionAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = attendanceSessionUpdateSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const { id, ...data } = parsed.data
    const prisma = getPrisma()
    const updated = await prisma.$transaction(async (tx) => {
      const before = await tx.attendanceSession.findUniqueOrThrow({ where: { id } })
      const result = await tx.attendanceSession.update({
        where: { id },
        data,
        include: {
          employee: true,
          location: true,
        },
      })

      await syncDailySummary(tx, before.employeeId, before.locationId, before.date)
      await syncDailySummary(tx, result.employeeId, result.locationId, result.date)
      return result
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(updated, "Sesi absensi berhasil diperbarui.")
  } catch (error) {
    return handleActionException(error)
  }
}

export async function deleteAttendanceSessionAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = idSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const deleted = await prisma.$transaction(async (tx) => {
      const result = await tx.attendanceSession.delete({
        where: { id: parsed.data.id },
      })

      await syncDailySummary(tx, result.employeeId, result.locationId, result.date)
      return result
    })

    revalidateOperationalPaths(revalidatePath)
    return actionSuccess(deleted, "Sesi absensi berhasil dihapus.")
  } catch (error) {
    return handleActionException(error)
  }
}

async function syncDailySummary(tx: Tx, employeeId: number, locationId: number, date: Date) {
  const sessions = await tx.attendanceSession.findMany({
    where: { employeeId, date },
    select: { sessionType: true },
  })

  if (sessions.length === 0) {
    await tx.dailySummary.deleteMany({
      where: { employeeId, date },
    })
    return
  }

  const done = new Set(sessions.map((session) => session.sessionType))
  const data = {
    locationId,
    checkInDone: done.has(SessionType.CHECK_IN),
    breakfastDone: done.has(SessionType.BREAKFAST),
    lunchDone: done.has(SessionType.LUNCH),
    dinnerDone: done.has(SessionType.DINNER),
    meatDistributionDone: done.has(SessionType.MEAT_DISTRIBUTION),
    logisticsDone: done.has(SessionType.LOGISTICS_COMPLETENESS),
    allComplete:
      done.has(SessionType.CHECK_IN) &&
      done.has(SessionType.BREAKFAST) &&
      done.has(SessionType.LUNCH) &&
      done.has(SessionType.DINNER) &&
      done.has(SessionType.MEAT_DISTRIBUTION) &&
      done.has(SessionType.LOGISTICS_COMPLETENESS),
  }

  await tx.dailySummary.upsert({
    where: { employeeId_date: { employeeId, date } },
    create: {
      employeeId,
      date,
      ...data,
    },
    update: data,
  })
}

export async function createAttendanceSessionFromScanAction(input: FormData | Record<string, unknown>) {
  try {
    const parsed = attendanceSessionCreateSchema.safeParse(formDataToObject(input))
    if (!parsed.success) return actionError("VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten().fieldErrors)

    const prisma = getPrisma()
    const employee = await prisma.employee.findUnique({
      where: { id: parsed.data.employeeId },
      include: { location: { include: { workSchedule: true } } },
    })

    if (!employee) return actionError("NOT_FOUND", "Karyawan tidak ditemukan.")
    if (!employee.isActive) return actionError("INACTIVE_EMPLOYEE", "Karyawan tidak aktif.")
    if (employee.locationId !== parsed.data.locationId) {
      return actionError("WRONG_LOCATION", `Karyawan terdaftar di ${employee.location.name}.`)
    }
    if (!employee.location.workSchedule) return actionError("SCHEDULE_NOT_FOUND", "Jadwal lokasi belum dibuat.")

    const schedule = employee.location.workSchedule
    const window = getWindow(schedule, parsed.data.sessionType)
    if (!isInsideWindow(parsed.data.scannedAt, window.start, window.end)) {
      return actionError("OUTSIDE_WINDOW", `${parsed.data.sessionType} hanya bisa discan antara ${window.start} - ${window.end}.`)
    }

    if (parsed.data.sessionType !== SessionType.CHECK_IN) {
      const checkedIn = await prisma.attendanceSession.findUnique({
        where: {
          employeeId_date_sessionType: {
            employeeId: parsed.data.employeeId,
            date: parsed.data.date,
            sessionType: SessionType.CHECK_IN,
          },
        },
      })
      if (!checkedIn) return actionError("NOT_CHECKED_IN", "Karyawan harus absen datang terlebih dahulu.")
    }

    const lateMinutes =
      parsed.data.sessionType === SessionType.CHECK_IN
        ? Math.max(0, minutesFromDate(parsed.data.scannedAt) - minutesFromTime(schedule.checkInDeadline))
        : 0

    return createAttendanceSessionAction({
      ...parsed.data,
      scanMethod: parsed.data.scanMethod ?? ScanMethod.QR,
      isLate: lateMinutes > 0,
      lateMinutes,
    })
  } catch (error) {
    return handleActionException(error)
  }
}

function getWindow(
  schedule: {
    checkInStart: string
    checkInDeadline: string
    breakfastStart: string
    breakfastEnd: string
    lunchStart: string
    lunchEnd: string
    dinnerStart: string
    dinnerEnd: string
    meatDistributionStart: string
    meatDistributionEnd: string
    logisticsStart: string
    logisticsEnd: string
  },
  sessionType: SessionType,
) {
  const map: Record<SessionType, { start: string; end: string }> = {
    CHECK_IN: { start: schedule.checkInStart, end: schedule.checkInDeadline },
    BREAKFAST: { start: schedule.breakfastStart, end: schedule.breakfastEnd },
    LUNCH: { start: schedule.lunchStart, end: schedule.lunchEnd },
    DINNER: { start: schedule.dinnerStart, end: schedule.dinnerEnd },
    MEAT_DISTRIBUTION: { start: schedule.meatDistributionStart, end: schedule.meatDistributionEnd },
    LOGISTICS_COMPLETENESS: { start: schedule.logisticsStart, end: schedule.logisticsEnd },
  }

  return map[sessionType]
}

function isInsideWindow(date: Date, start: string, end: string) {
  const minutes = minutesFromDate(date)
  return minutes >= minutesFromTime(start) && minutes <= minutesFromTime(end)
}

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number)
  return hours * 60 + minutes
}

function minutesFromDate(value: Date) {
  return value.getHours() * 60 + value.getMinutes()
}
