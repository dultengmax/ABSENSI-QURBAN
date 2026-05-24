export type SessionType = "CHECK_IN" | "BREAKFAST" | "LUNCH" | "DINNER" | "MEAT_DISTRIBUTION" | "LOGISTICS_COMPLETENESS"
export type ScanMethod = "QR" | "RFID" | "MANUAL"

export type WorkSchedule = {
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
}

export type Department = {
  id: number
  name: string
  code: string
}

export type Location = {
  id: number
  name: string
  address?: string | null
  timezone: string
  schedule: WorkSchedule
}

export type Employee = {
  id: number
  nik: string
  name: string
  position?: string | null
  phone?: string | null
  cabang?: string | null
  departmentId: number
  locationId: number
  isActive: boolean
  qrCode: string
}

export type AttendanceSession = {
  id: string
  employeeId: number
  locationId: number
  date: string
  sessionType: SessionType
  scannedAt: string
  scanMethod: ScanMethod
  isLate: boolean
  lateMinutes: number
  note?: string
}

export type DailyAttendanceRow = {
  employee: Employee
  department: Department
  location: Location
  sessions: Record<SessionType, AttendanceSession | null>
  allComplete: boolean
  completeCount: number
}

export type ScanInput = {
  employeeId: number
  locationId: number
  sessionType: SessionType
  scannedAt: string
  scanMethod?: ScanMethod
  note?: string
}

export type ScanResult =
  | {
      success: true
      message: string
      session: AttendanceSession
    }
  | {
      success: false
      code:
        | "EMPLOYEE_NOT_FOUND"
        | "INVALID_QR"
        | "INACTIVE_EMPLOYEE"
        | "WRONG_LOCATION"
        | "SCHEDULE_NOT_FOUND"
        | "OUTSIDE_WINDOW"
        | "NOT_CHECKED_IN"
        | "ALREADY_SCANNED"
      message: string
      window?: { start: string; end: string }
      previousScan?: AttendanceSession
    }

export const demoAttendanceDate = "2026-05-22"

export const sessionOrder: SessionType[] = [
  "CHECK_IN",
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "MEAT_DISTRIBUTION",
  "LOGISTICS_COMPLETENESS",
]

export const sessionMeta: Record<
  SessionType,
  {
    label: string
    shortLabel: string
    apiValue: SessionType
    description: string
  }
> = {
  CHECK_IN: {
    label: "Absen Datang",
    shortLabel: "Datang",
    apiValue: "CHECK_IN",
    description: "Wajib sebelum semua sesi makan.",
  },
  BREAKFAST: {
    label: "Makan Pagi",
    shortLabel: "Pagi",
    apiValue: "BREAKFAST",
    description: "Sesi konsumsi pagi setelah absen datang.",
  },
  LUNCH: {
    label: "Makan Siang",
    shortLabel: "Siang",
    apiValue: "LUNCH",
    description: "Sesi konsumsi siang setelah absen datang.",
  },
  DINNER: {
    label: "Makan Sore",
    shortLabel: "Sore",
    apiValue: "DINNER",
    description: "Sesi konsumsi sore setelah absen datang.",
  },
  MEAT_DISTRIBUTION: {
    label: "Pembagian Daging",
    shortLabel: "Daging",
    apiValue: "MEAT_DISTRIBUTION",
    description: "Validasi panitia saat sesi pembagian daging qurban.",
  },
  LOGISTICS_COMPLETENESS: {
    label: "Kelengkapan Logistik",
    shortLabel: "Logistik",
    apiValue: "LOGISTICS_COMPLETENESS",
    description: "Validasi kesiapan dan kelengkapan logistik operasional.",
  },
}

export const demoScanTimes: Record<SessionType, string> = {
  CHECK_IN: "07:45",
  BREAKFAST: "07:50",
  LUNCH: "12:10",
  DINNER: "17:15",
  MEAT_DISTRIBUTION: "14:00",
  LOGISTICS_COMPLETENESS: "06:30",
}

export const defaultWorkSchedule: WorkSchedule = {
  checkInStart: "07:00",
  checkInDeadline: "09:00",
  breakfastStart: "06:30",
  breakfastEnd: "08:30",
  lunchStart: "11:30",
  lunchEnd: "13:00",
  dinnerStart: "16:30",
  dinnerEnd: "18:00",
  meatDistributionStart: "13:00",
  meatDistributionEnd: "16:00",
  logisticsStart: "06:00",
  logisticsEnd: "18:30",
}

export const departments: Department[] = [
  { id: 1, name: "Tim Pengendali", code: "ACR" },
  { id: 2, name: "Tim Penyembelih Sapi", code: "KSM" },
  { id: 3, name: "Tim Penyembelih Domba", code: "KAM" },
  { id: 4, name: "Tim Sisit Sapi", code: "DOK" },
  { id: 5, name: "Tim Sisit Domba", code: "TRP" },
  { id: 6, name: "Tim Sisit Domba", code: "TRP2" },
  { id: 7, name: "Tim Kadut Domba", code: "TRP3" },
  { id: 8, name: "Tim Recah Domba", code: "TRP4" },
  { id: 9, name: "Tim Recah Sapi", code: "TRP5" },
  { id: 10, name: "Tim Recah Kadut domba dan Sapi", code: "TRP6" },
  { id: 11, name: "Tim Timbang dan Packing Domba", code: "TRP7" },
  { id: 12, name: "Tim Timbang dan Packing Sapi", code: "TRP8" },
  { id: 13, name: "Tim Recah Tulang", code: "TRP9" },
  { id: 14, name: "Tim Distribusi", code: "TRP10" },
  { id: 15, name: "Tim Administrasi dan Dokumentasi", code: "TRP11" },
  { id: 16, name: "Tim Konsumsi", code: "TRP12" },
  { id: 17, name: "Tim Logistik", code: "TRP13" },
  { id: 18, name: "Tim Kebersihan", code: "TRP14" },
  { id: 19, name: "Tim Campuran", code: "TRP15" },
]

export const locations: Location[] = [
  {
    id: 1,
    name: "Kantor Panitia",
    address: "Area Masjid Al-Ikhlas",
    timezone: "Asia/Jakarta",
    schedule: {
      checkInStart: "07:00",
      checkInDeadline: "09:00",
      breakfastStart: "06:30",
      breakfastEnd: "08:30",
      lunchStart: "11:30",
      lunchEnd: "13:00",
      dinnerStart: "16:30",
      dinnerEnd: "18:00",
      meatDistributionStart: "13:00",
      meatDistributionEnd: "16:00",
      logisticsStart: "06:00",
      logisticsEnd: "18:30",
    },
  },
  {
    id: 2,
    name: "Pos Distribusi",
    address: "Gerbang distribusi warga",
    timezone: "Asia/Jakarta",
    schedule: {
      checkInStart: "06:45",
      checkInDeadline: "08:45",
      breakfastStart: "06:15",
      breakfastEnd: "08:15",
      lunchStart: "11:00",
      lunchEnd: "12:45",
      dinnerStart: "16:00",
      dinnerEnd: "17:45",
      meatDistributionStart: "12:30",
      meatDistributionEnd: "16:30",
      logisticsStart: "05:45",
      logisticsEnd: "18:15",
    },
  },
]

export const employees: Employee[] = []

export const initialAttendanceSessions: AttendanceSession[] = []

export type LocationRecord = Omit<Location, "schedule"> & {
  schedule?: WorkSchedule | null
  workSchedule?: WorkSchedule | null
}

export function normalizeEmployeeRecord(employee: Employee): Employee {
  return {
    ...employee,
    position: employee.position ?? "",
    phone: employee.phone ?? "",
    cabang: employee.cabang ?? "",
  }
}

export function normalizeLocationRecord(location: LocationRecord): Location {
  return {
    ...location,
    address: location.address ?? "",
    schedule: location.schedule ?? location.workSchedule ?? defaultWorkSchedule,
  }
}

export function getDepartment(departmentId: number, departmentList = departments) {
  return departmentList.find((department) => department.id === departmentId)
}

export function getLocation(locationId: number, locationList = locations) {
  return locationList.find((location) => location.id === locationId)
}

export function getEmployeeByQr(qrCode: string, employeeList = employees) {
  const normalized = qrCode.trim().toLowerCase()
  return employeeList.find(
    (employee) =>
      employee.qrCode.toLowerCase() === normalized ||
      employee.nik.toLowerCase() === normalized ||
      String(employee.id) === normalized,
  )
}

export function getSessionWindow(location: Location, sessionType: SessionType) {
  const schedule = location.schedule

  switch (sessionType) {
    case "CHECK_IN":
      return { start: schedule.checkInStart, end: schedule.checkInDeadline }
    case "BREAKFAST":
      return { start: schedule.breakfastStart, end: schedule.breakfastEnd }
    case "LUNCH":
      return { start: schedule.lunchStart, end: schedule.lunchEnd }
    case "DINNER":
      return { start: schedule.dinnerStart, end: schedule.dinnerEnd }
    case "MEAT_DISTRIBUTION":
      return { start: schedule.meatDistributionStart, end: schedule.meatDistributionEnd }
    case "LOGISTICS_COMPLETENESS":
      return { start: schedule.logisticsStart, end: schedule.logisticsEnd }
  }
}

export function combineDateAndTime(date: string, time: string) {
  return `${date}T${time}:00`
}

export function getDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatScanTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function isScanInWindow(scannedAt: string, start: string, end: string) {
  const minutes = minutesFromDate(scannedAt)
  return minutes >= minutesFromTime(start) && minutes <= minutesFromTime(end)
}

export function scanAttendance(
  existingSessions: AttendanceSession[],
  input: ScanInput,
  employeeList = employees,
  locationList = locations,
): ScanResult {
  const employee = employeeList.find((item) => item.id === input.employeeId)
  if (!employee) {
    return {
      success: false,
      code: "EMPLOYEE_NOT_FOUND",
      message: "Karyawan tidak ditemukan.",
    }
  }

  if (!employee.isActive) {
    return {
      success: false,
      code: "INACTIVE_EMPLOYEE",
      message: "Karyawan tidak aktif.",
    }
  }

  if (employee.locationId !== input.locationId) {
    const registeredLocation = getLocation(employee.locationId, locationList)
    return {
      success: false,
      code: "WRONG_LOCATION",
      message: `Lokasi scan salah. Karyawan terdaftar di ${registeredLocation?.name ?? "lokasi lain"}.`,
    }
  }

  const location = getLocation(input.locationId, locationList)
  if (!location) {
    return {
      success: false,
      code: "SCHEDULE_NOT_FOUND",
      message: "Jadwal lokasi tidak ditemukan.",
    }
  }

  const date = getDateKey(input.scannedAt)
  const window = getSessionWindow(location, input.sessionType)
  if (!isScanInWindow(input.scannedAt, window.start, window.end)) {
    return {
      success: false,
      code: "OUTSIDE_WINDOW",
      message: `${sessionMeta[input.sessionType].label} hanya bisa discan antara ${window.start} - ${window.end}.`,
      window,
    }
  }

  if (input.sessionType !== "CHECK_IN") {
    const checkedIn = existingSessions.find(
      (session) =>
        session.employeeId === input.employeeId &&
        session.date === date &&
        session.sessionType === "CHECK_IN",
    )

    if (!checkedIn) {
      return {
        success: false,
        code: "NOT_CHECKED_IN",
        message: "Karyawan harus absen datang terlebih dahulu sebelum sesi lanjutan.",
      }
    }
  }

  const previousScan = existingSessions.find(
    (session) =>
      session.employeeId === input.employeeId &&
      session.date === date &&
      session.sessionType === input.sessionType,
  )

  if (previousScan) {
    return {
      success: false,
      code: "ALREADY_SCANNED",
      message: `${sessionMeta[input.sessionType].label} sudah tercatat hari ini.`,
      previousScan,
    }
  }

  const deadline = getSessionWindow(location, "CHECK_IN").end
  const lateMinutes =
    input.sessionType === "CHECK_IN"
      ? Math.max(0, minutesFromDate(input.scannedAt) - minutesFromTime(deadline))
      : 0

  const session: AttendanceSession = {
    id: `scan-${Date.now()}-${input.employeeId}-${input.sessionType}`,
    employeeId: input.employeeId,
    locationId: input.locationId,
    date,
    sessionType: input.sessionType,
    scannedAt: input.scannedAt,
    scanMethod: input.scanMethod ?? "QR",
    isLate: lateMinutes > 0,
    lateMinutes,
    note: input.note,
  }

  return {
    success: true,
    message:
      input.sessionType === "CHECK_IN" && lateMinutes > 0
        ? `Absen datang berhasil. Terlambat ${lateMinutes} menit.`
        : `${sessionMeta[input.sessionType].label} berhasil dicatat.`,
    session,
  }
}

export function getDailyStatus(params: {
  sessions: AttendanceSession[]
  date: string
  locationId?: number | "all"
  departmentId?: number | "all"
  search?: string
  employees?: Employee[]
  departments?: Department[]
  locations?: Location[]
}): DailyAttendanceRow[] {
  const search = params.search?.trim().toLowerCase() ?? ""
  const employeeList = params.employees ?? employees
  const departmentList = params.departments ?? departments
  const locationList = params.locations ?? locations

  return employeeList
    .filter((employee) => employee.isActive)
    .filter((employee) => params.locationId === "all" || !params.locationId || employee.locationId === params.locationId)
    .filter(
      (employee) =>
        params.departmentId === "all" || !params.departmentId || employee.departmentId === params.departmentId,
    )
    .filter((employee) => {
      if (!search) return true
      const department = getDepartment(employee.departmentId, departmentList)
      const position = employee.position ?? ""
      const cabang = employee.cabang ?? ""
      return (
        employee.name.toLowerCase().includes(search) ||
        employee.nik.toLowerCase().includes(search) ||
        position.toLowerCase().includes(search) ||
        cabang.toLowerCase().includes(search) ||
        department?.name.toLowerCase().includes(search)
      )
    })
    .map((employee) => {
      const department = getDepartment(employee.departmentId, departmentList) ?? departmentList[0]
      const location = getLocation(employee.locationId, locationList) ?? locationList[0]
      const sessions = sessionOrder.reduce(
        (acc, sessionType) => {
          acc[sessionType] =
            params.sessions.find(
              (session) =>
                session.employeeId === employee.id &&
                session.date === params.date &&
                session.sessionType === sessionType,
            ) ?? null
          return acc
        },
        {} as Record<SessionType, AttendanceSession | null>,
      )
      const completeCount = sessionOrder.filter((sessionType) => Boolean(sessions[sessionType])).length

      return {
        employee,
        department,
        location,
        sessions,
        completeCount,
        allComplete: completeCount === sessionOrder.length,
      }
    })
}

export function summarizeDailyRows(rows: DailyAttendanceRow[]) {
  return {
    totalEmployees: rows.length,
    checkedIn: rows.filter((row) => Boolean(row.sessions.CHECK_IN)).length,
    breakfast: rows.filter((row) => Boolean(row.sessions.BREAKFAST)).length,
    lunch: rows.filter((row) => Boolean(row.sessions.LUNCH)).length,
    dinner: rows.filter((row) => Boolean(row.sessions.DINNER)).length,
    meatDistribution: rows.filter((row) => Boolean(row.sessions.MEAT_DISTRIBUTION)).length,
    logistics: rows.filter((row) => Boolean(row.sessions.LOGISTICS_COMPLETENESS)).length,
    complete: rows.filter((row) => row.allComplete).length,
    incomplete: rows.filter((row) => !row.allComplete).length,
  }
}

export function getSessionCount(
  sessions: AttendanceSession[],
  date: string,
  sessionType: SessionType,
  locationId?: number | "all",
) {
  return sessions.filter(
    (session) =>
      session.date === date &&
      session.sessionType === sessionType &&
      (locationId === "all" || !locationId || session.locationId === locationId),
  ).length
}

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number)
  return hours * 60 + minutes
}

function minutesFromDate(value: string) {
  const date = new Date(value)
  return date.getHours() * 60 + date.getMinutes()
}
