import { Prisma, ScanMethod, SessionType } from "@prisma/client"

import { getPrisma } from "@/lib/prisma"

type ScanDto = {
  employeeId: number
  locationId: number
  sessionType: SessionType
  scannedAt: string
  scanMethod?: ScanMethod
  note?: string
}

type ScanByQrDto = Omit<ScanDto, "employeeId"> & {
  qrCode: string
}

type ReportFilter = {
  dateFrom: string
  dateTo: string
  locationId?: number
  departmentId?: number
  employeeId?: number
}

export async function scanAttendanceByQr(dto: ScanByQrDto) {
  const qrCode = dto.qrCode.trim()

  if (!qrCode) {
    return attendanceError("INVALID_QR", "Kode QR tidak valid.", 400)
  }

  const prisma = getPrisma()
  const employee = await prisma.employee.findUnique({
    where: { qrCode },
    select: { id: true },
  })

  if (!employee) {
    return attendanceError("INVALID_QR", "Kode QR tidak terdaftar di database.", 404)
  }

  return scanAttendance({
    ...dto,
    employeeId: employee.id,
  })
}

export async function scanAttendance(dto: ScanDto) {
  const prisma = getPrisma()
  const scannedAt = new Date(dto.scannedAt)
  const date = startOfLocalDay(scannedAt)

  const employee = await prisma.employee.findUnique({
    where: { id: dto.employeeId },
    include: {
      department: true,
      location: true,
    },
  })

  if (!employee) return attendanceError("EMPLOYEE_NOT_FOUND", "Karyawan tidak ditemukan.", 404)
  if (!employee.isActive) return attendanceError("INACTIVE_EMPLOYEE", "Karyawan tidak aktif.", 403)
  if (employee.locationId !== dto.locationId) {
    return attendanceError("WRONG_LOCATION", `Karyawan terdaftar di ${employee.location.name}.`, 400)
  }

  const schedule = await prisma.workSchedule.findUnique({
    where: { locationId: dto.locationId },
  })

  if (!schedule) return attendanceError("SCHEDULE_NOT_FOUND", "Jadwal lokasi belum dibuat.", 404)

  const window = getWindow(schedule, dto.sessionType)
  if (!isInsideWindow(scannedAt, window.start, window.end)) {
    return attendanceError(
      "OUTSIDE_WINDOW",
      `${sessionLabel(dto.sessionType)} hanya bisa discan antara ${window.start} - ${window.end}.`,
      400,
      { window },
    )
  }

  if (dto.sessionType !== "CHECK_IN") {
    const checkedIn = await prisma.attendanceSession.findUnique({
      where: {
        employeeId_date_sessionType: {
          employeeId: dto.employeeId,
          date,
          sessionType: "CHECK_IN",
        },
      },
    })

    if (!checkedIn) {
      return attendanceError("NOT_CHECKED_IN", "Karyawan harus absen datang terlebih dahulu.", 400)
    }
  }

  const lateMinutes =
    dto.sessionType === "CHECK_IN"
      ? Math.max(0, minutesFromDate(scannedAt) - minutesFromTime(schedule.checkInDeadline))
      : 0

  try {
    const session = await prisma.attendanceSession.create({
      data: {
        employeeId: dto.employeeId,
        locationId: dto.locationId,
        date,
        sessionType: dto.sessionType,
        scannedAt,
        scanMethod: dto.scanMethod ?? "QR",
        isLate: lateMinutes > 0,
        lateMinutes,
        note: dto.note,
      },
      include: {
        employee: {
          select: {
            id: true,
            nik: true,
            name: true,
            position: true,
            phone: true,
            cabang: true,
            isActive: true,
            qrCode: true,
            departmentId: true,
            locationId: true,
            department: { select: { id: true, name: true, code: true } },
            location: { select: { id: true, name: true, timezone: true } },
          },
        },
      },
    })

    await updateDailySummary(dto.employeeId, dto.locationId, date, dto.sessionType)

    return {
      status: 201,
      body: {
        success: true,
        message:
          dto.sessionType === "CHECK_IN" && lateMinutes > 0
            ? `Absen datang berhasil. Terlambat ${lateMinutes} menit.`
            : `${sessionLabel(dto.sessionType)} berhasil dicatat.`,
        data: session,
      },
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const previousScan = await prisma.attendanceSession.findUnique({
        where: {
          employeeId_date_sessionType: {
            employeeId: dto.employeeId,
            date,
            sessionType: dto.sessionType,
          },
        },
      })

      return attendanceError(
        "ALREADY_SCANNED",
        `${sessionLabel(dto.sessionType)} sudah tercatat hari ini.`,
        409,
        { previousScan },
      )
    }

    throw error
  }
}

export async function getDailyStatus(locationId: number, date: string) {
  const prisma = getPrisma()
  const targetDate = parseDateOnly(date)

  const employees = await prisma.employee.findMany({
    where: { locationId, isActive: true },
    include: { department: true, location: true },
    orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
  })

  const summaries = await prisma.dailySummary.findMany({
    where: { locationId, date: targetDate },
  })

  const summaryMap = new Map(summaries.map((summary) => [summary.employeeId, summary]))

  return employees.map((employee) => {
    const summary = summaryMap.get(employee.id)

    return {
      employeeId: employee.id,
      nik: employee.nik,
      name: employee.name,
      position: employee.position,
      cabang: employee.cabang,
      department: employee.department.name,
      location: employee.location.name,
      sessions: {
        checkIn: summary?.checkInDone ?? false,
        breakfast: summary?.breakfastDone ?? false,
        lunch: summary?.lunchDone ?? false,
        dinner: summary?.dinnerDone ?? false,
      },
      allComplete: summary?.allComplete ?? false,
    }
  })
}

export async function getReport(filter: ReportFilter) {
  const prisma = getPrisma()

  return prisma.attendanceSession.findMany({
    where: {
      date: {
        gte: parseDateOnly(filter.dateFrom),
        lte: parseDateOnly(filter.dateTo),
      },
      ...(filter.locationId ? { locationId: filter.locationId } : {}),
      ...(filter.employeeId ? { employeeId: filter.employeeId } : {}),
      ...(filter.departmentId
        ? {
            employee: {
              departmentId: filter.departmentId,
            },
          }
        : {}),
    },
    include: {
      employee: {
        select: {
          id: true,
          nik: true,
          name: true,
          cabang: true,
          department: { select: { id: true, name: true, code: true } },
          location: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ date: "desc" }, { scannedAt: "asc" }],
  })
}

export async function getMonthlySummary(employeeId: number, year: number, month: number) {
  const prisma = getPrisma()
  const dateFrom = new Date(year, month - 1, 1)
  const dateTo = new Date(year, month, 0)

  const summaries = await prisma.dailySummary.findMany({
    where: { employeeId, date: { gte: dateFrom, lte: dateTo } },
    orderBy: { date: "asc" },
  })

  return {
    employeeId,
    period: { year, month },
    stats: {
      totalWorkDays: summaries.length,
      completeDays: summaries.filter((summary) => summary.allComplete).length,
      incompleteDays: summaries.filter((summary) => !summary.allComplete).length,
      checkIn: summaries.filter((summary) => summary.checkInDone).length,
      breakfast: summaries.filter((summary) => summary.breakfastDone).length,
      lunch: summaries.filter((summary) => summary.lunchDone).length,
      dinner: summaries.filter((summary) => summary.dinnerDone).length,
    },
    daily: summaries,
  }
}

async function updateDailySummary(employeeId: number, locationId: number, date: Date, sessionType: SessionType) {
  const prisma = getPrisma()
  const field = sessionSummaryField(sessionType)

  const summary = await prisma.dailySummary.upsert({
    where: { employeeId_date: { employeeId, date } },
    create: {
      employeeId,
      locationId,
      date,
      [field]: true,
    },
    update: {
      [field]: true,
    },
  })

  const allComplete =
    summary.checkInDone && summary.breakfastDone && summary.lunchDone && summary.dinnerDone

  if (allComplete && !summary.allComplete) {
    await prisma.dailySummary.update({
      where: { id: summary.id },
      data: { allComplete: true },
    })
  }
}

function attendanceError(code: string, message: string, status: number, extra?: Record<string, unknown>) {
  return {
    status,
    body: {
      success: false,
      code,
      message,
      ...extra,
    },
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
  },
  sessionType: SessionType,
) {
  const map: Record<SessionType, { start: string; end: string }> = {
    CHECK_IN: { start: schedule.checkInStart, end: schedule.checkInDeadline },
    BREAKFAST: { start: schedule.breakfastStart, end: schedule.breakfastEnd },
    LUNCH: { start: schedule.lunchStart, end: schedule.lunchEnd },
    DINNER: { start: schedule.dinnerStart, end: schedule.dinnerEnd },
  }

  return map[sessionType]
}

function sessionSummaryField(sessionType: SessionType) {
  const map: Record<SessionType, "checkInDone" | "breakfastDone" | "lunchDone" | "dinnerDone"> = {
    CHECK_IN: "checkInDone",
    BREAKFAST: "breakfastDone",
    LUNCH: "lunchDone",
    DINNER: "dinnerDone",
  }

  return map[sessionType]
}

function sessionLabel(sessionType: SessionType) {
  const map: Record<SessionType, string> = {
    CHECK_IN: "Absen datang",
    BREAKFAST: "Makan pagi",
    LUNCH: "Makan siang",
    DINNER: "Makan sore",
  }

  return map[sessionType]
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
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
