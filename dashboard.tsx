"use client"

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Coffee,
  Download,
  MapPin,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Utensils,
} from "lucide-react"

import { createEmployeeFormAction, deleteEmployeeFormAction, updateEmployeeFormAction } from "@/lib/actions/employees"
import {
  type AttendanceSession,
  type Department,
  type Employee,
  type Location,
  type ScanResult,
  type SessionType,
  combineDateAndTime,
  demoAttendanceDate,
  demoScanTimes,
  departments as initialDepartments,
  employees as initialEmployees,
  formatScanTime,
  getDailyStatus,
  getSessionWindow,
  initialAttendanceSessions,
  locations as initialLocations,
  normalizeEmployeeRecord,
  normalizeLocationRecord,
  scanAttendance,
  sessionMeta,
  sessionOrder,
  summarizeDailyRows,
} from "@/lib/attendance-system"

type ApiAttendanceReportSession = {
  id: number | string
  employeeId: number
  locationId: number
  date: string
  sessionType: SessionType
  scannedAt: string
  scanMethod: AttendanceSession["scanMethod"]
  isLate: boolean
  lateMinutes: number
  note?: string | null
}

const statCards = [
  { key: "checkedIn", title: "Absen Datang", icon: CalendarCheck, tone: "text-emerald-700 bg-emerald-50" },
  { key: "breakfast", title: "Makan Pagi", icon: Coffee, tone: "text-amber-700 bg-amber-50" },
  { key: "lunch", title: "Makan Siang", icon: Utensils, tone: "text-sky-700 bg-sky-50" },
  { key: "dinner", title: "Makan Sore", icon: Clock, tone: "text-rose-700 bg-rose-50" },
  { key: "meatDistribution", title: "Pembagian Daging", icon: PackageCheck, tone: "text-violet-700 bg-violet-50" },
  { key: "logistics", title: "Kelengkapan Logistik", icon: ShieldCheck, tone: "text-teal-700 bg-teal-50" },
] as const

const cabangOptions = ["1", "2", "3", "4"] as const

export default function AttendanceDashboard() {
  const [departmentList, setDepartmentList] = useState<Department[]>(initialDepartments)
  const [locationList, setLocationList] = useState<Location[]>(initialLocations)
  const [masterDataError, setMasterDataError] = useState<string | null>(null)
  const [employeeList, setEmployeeList] = useState<Employee[]>(initialEmployees)
  const [employeeListError, setEmployeeListError] = useState<string | null>(null)
  const [attendanceSessionsError, setAttendanceSessionsError] = useState<string | null>(null)
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(initialAttendanceSessions)
  const [selectedDate, setSelectedDate] = useState(demoAttendanceDate)
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false)
  const [manualEmployeeId, setManualEmployeeId] = useState(String(initialEmployees[0]?.id ?? ""))
  const [manualLocationId, setManualLocationId] = useState(String(initialEmployees[0]?.locationId ?? initialLocations[0]?.id ?? ""))
  const [manualSessionType, setManualSessionType] = useState<SessionType>("CHECK_IN")
  const [manualTime, setManualTime] = useState(demoScanTimes.CHECK_IN)
  const [scanNotice, setScanNotice] = useState<ScanResult | null>(null)
  const [employeeCabang, setEmployeeCabang] = useState("")
  const [employeeDepartmentId, setEmployeeDepartmentId] = useState(String(initialDepartments[0]?.id ?? ""))
  const [employeeLocationId, setEmployeeLocationId] = useState(String(initialLocations[0]?.id ?? ""))
  const [employeeFormState, employeeFormAction, isEmployeePending] = useActionState(createEmployeeFormAction, null)
  const [editEmployeeFormState, editEmployeeFormAction, isEditEmployeePending] = useActionState(updateEmployeeFormAction, null)
  const [deleteEmployeeFormState, deleteEmployeeAction, isDeleteEmployeePending] = useActionState(deleteEmployeeFormAction, null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [editEmployeeCabang, setEditEmployeeCabang] = useState("")
  const [editEmployeeDepartmentId, setEditEmployeeDepartmentId] = useState("")
  const [editEmployeeLocationId, setEditEmployeeLocationId] = useState("")
  const employeeFormRef = useRef<HTMLFormElement>(null)

  const loadEmployees = useCallback(async () => {
    try {
      const response = await fetch("/api/employees", { cache: "no-store" })
      const payload = (await response.json()) as { success?: boolean; data?: Employee[]; message?: string }

      if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
        throw new Error(payload.message ?? "Gagal memuat data karyawan.")
      }

      setEmployeeList(payload.data.map(normalizeEmployeeRecord))
      setEmployeeListError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data karyawan."
      setEmployeeListError(message)
    }
  }, [])

  const loadMasterData = useCallback(async () => {
    try {
      const [departmentResponse, locationResponse] = await Promise.all([
        fetch("/api/departments", { cache: "no-store" }),
        fetch("/api/locations", { cache: "no-store" }),
      ])
      const departmentPayload = (await departmentResponse.json()) as {
        success?: boolean
        data?: Department[]
        message?: string
      }
      const locationPayload = (await locationResponse.json()) as {
        success?: boolean
        data?: Array<Location & { workSchedule?: Location["schedule"] | null }>
        message?: string
      }

      if (!departmentResponse.ok || !departmentPayload.success || !Array.isArray(departmentPayload.data)) {
        throw new Error(departmentPayload.message ?? "Gagal memuat data bagian.")
      }

      if (!locationResponse.ok || !locationPayload.success || !Array.isArray(locationPayload.data)) {
        throw new Error(locationPayload.message ?? "Gagal memuat data lokasi.")
      }

      setDepartmentList(departmentPayload.data)
      setLocationList(locationPayload.data.map(normalizeLocationRecord))
      setMasterDataError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data bagian/lokasi."
      setMasterDataError(message)
    }
  }, [])

  const loadAttendanceSessions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        date_from: selectedDate,
        date_to: selectedDate,
      })
      const response = await fetch(`/api/attendance/report?${params.toString()}`, { cache: "no-store" })
      const payload = (await response.json()) as {
        success?: boolean
        data?: ApiAttendanceReportSession[]
        message?: string
      }

      if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
        throw new Error(payload.message ?? "Gagal memuat data scan.")
      }

      setAttendanceSessions(payload.data.map((session) => mapApiAttendanceSession(session, selectedDate)))
      setAttendanceSessionsError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data scan."
      setAttendanceSessionsError(message)
    }
  }, [selectedDate])

  const locationFilter = selectedLocation === "all" ? "all" : Number(selectedLocation)
  const departmentFilter = selectedDepartment === "all" ? "all" : Number(selectedDepartment)

  const rows = useMemo(
    () =>
      getDailyStatus({
        sessions: attendanceSessions,
        date: selectedDate,
        locationId: locationFilter,
        departmentId: departmentFilter,
        search: searchTerm,
        employees: employeeList,
        departments: departmentList,
        locations: locationList,
      }),
    [attendanceSessions, departmentFilter, departmentList, employeeList, locationFilter, locationList, searchTerm, selectedDate],
  )

  const summary = summarizeDailyRows(rows)
  const selectedLocationDetail = locationList.find((location) => location.id === Number(selectedLocation)) ?? locationList[0]
  const manualLocationDetail = locationList.find((location) => location.id === Number(manualLocationId)) ?? locationList[0]
  const reportRows = attendanceSessions
    .filter((session) => session.date === selectedDate)
    .filter((session) => selectedLocation === "all" || session.locationId === Number(selectedLocation))
    .filter((session) => {
      const employee = employeeList.find((item) => item.id === session.employeeId)
      if (!employee) return false
      if (selectedDepartment !== "all" && employee.departmentId !== Number(selectedDepartment)) return false
      if (!searchTerm) return true
      const search = searchTerm.toLowerCase()
      return (
        employee.name.toLowerCase().includes(search) ||
        employee.nik.toLowerCase().includes(search) ||
        (employee.cabang ?? "").toLowerCase().includes(search)
      )
    })

  const completionRate = summary.totalEmployees
    ? Math.round((summary.complete / summary.totalEmployees) * 100)
    : 0

  const employeeFieldErrors = employeeFormState?.ok === false ? employeeFormState.error.fieldErrors : undefined
  const editEmployeeFieldErrors = editEmployeeFormState?.ok === false ? editEmployeeFormState.error.fieldErrors : undefined

  useEffect(() => {
    void loadMasterData()
    void loadEmployees()
  }, [loadEmployees, loadMasterData])

  useEffect(() => {
    void loadAttendanceSessions()

    const refreshInterval = window.setInterval(() => {
      void loadAttendanceSessions()
    }, 5000)
    const refreshOnFocus = () => {
      void loadAttendanceSessions()
    }
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") void loadAttendanceSessions()
    }

    window.addEventListener("focus", refreshOnFocus)
    document.addEventListener("visibilitychange", refreshOnVisible)

    return () => {
      window.clearInterval(refreshInterval)
      window.removeEventListener("focus", refreshOnFocus)
      document.removeEventListener("visibilitychange", refreshOnVisible)
    }
  }, [loadAttendanceSessions])

  useEffect(() => {
    if (departmentList.length === 0) {
      setEmployeeDepartmentId("")
      return
    }

    if (!departmentList.some((department) => department.id === Number(employeeDepartmentId))) {
      setEmployeeDepartmentId(String(departmentList[0].id))
    }
  }, [departmentList, employeeDepartmentId])

  useEffect(() => {
    if (locationList.length === 0) {
      setEmployeeLocationId("")
      setManualLocationId("")
      return
    }

    if (!locationList.some((location) => location.id === Number(employeeLocationId))) {
      setEmployeeLocationId(String(locationList[0].id))
    }

    if (!manualLocationId || !locationList.some((location) => location.id === Number(manualLocationId))) {
      setManualLocationId(String(locationList[0].id))
    }
  }, [employeeLocationId, locationList, manualLocationId])

  useEffect(() => {
    if (employeeList.length === 0) {
      setManualEmployeeId("")
      setManualLocationId(String(locationList[0]?.id ?? ""))
      return
    }

    const selectedEmployee = employeeList.find((employee) => employee.id === Number(manualEmployeeId))
    if (selectedEmployee) {
      setManualLocationId(String(selectedEmployee.locationId))
      return
    }

    setManualEmployeeId(String(employeeList[0].id))
    setManualLocationId(String(employeeList[0].locationId))
  }, [employeeList, locationList, manualEmployeeId])

  useEffect(() => {
    if (!employeeFormState?.ok) return

    employeeFormRef.current?.reset()
    setEmployeeCabang("")
    setEmployeeDepartmentId(String(departmentList[0]?.id ?? ""))
    setEmployeeLocationId(String(locationList[0]?.id ?? ""))
    void loadEmployees()
  }, [departmentList, employeeFormState, loadEmployees, locationList])

  useEffect(() => {
    if (!editEmployeeFormState?.ok) return

    setEditingEmployee(null)
    void loadEmployees()
    void loadAttendanceSessions()
  }, [editEmployeeFormState, loadAttendanceSessions, loadEmployees])

  useEffect(() => {
    if (!deleteEmployeeFormState?.ok) return

    setDeletingEmployee(null)
    void loadEmployees()
    void loadAttendanceSessions()
  }, [deleteEmployeeFormState, loadAttendanceSessions, loadEmployees])

  const openEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setEditEmployeeCabang(employee.cabang ?? "")
    setEditEmployeeDepartmentId(String(employee.departmentId))
    setEditEmployeeLocationId(String(employee.locationId))
  }

  const handleManualScan = () => {
    if (!manualEmployeeId || !manualLocationId) {
      setScanNotice({
        success: false,
        code: "EMPLOYEE_NOT_FOUND",
        message: "Tambahkan karyawan terlebih dahulu sebelum mencatat scan manual.",
      })
      return
    }

    const result = scanAttendance(attendanceSessions, {
      employeeId: Number(manualEmployeeId),
      locationId: Number(manualLocationId),
      sessionType: manualSessionType,
      scannedAt: combineDateAndTime(selectedDate, manualTime),
      scanMethod: "MANUAL",
      note: "Input dari dashboard",
    }, employeeList, locationList)

    setScanNotice(result)

    if (result.success) {
      setAttendanceSessions((current) => [result.session, ...current])
      setIsAddDialogOpen(false)
    }
  }

  const handleSessionChange = (value: SessionType) => {
    setManualSessionType(value)
    setManualTime(demoScanTimes[value])
  }

  return (
    <div className="app-page">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard Absensi 6 Sesi</h1>
            <p className="page-subtitle">
              Menerapkan aturan `SISTEM_ABSENSI.md`: satu scan per sesi, makan wajib setelah absen datang, dan window waktu per lokasi.
            </p>
          </div>
          <div className="page-actions">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tambah Karyawan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tambah Karyawan</DialogTitle>
                  <DialogDescription>
                    Data disimpan melalui server action Prisma dan langsung memakai relasi bagian serta lokasi kerja.
                  </DialogDescription>
                </DialogHeader>
                <form ref={employeeFormRef} action={employeeFormAction} className="grid gap-5 py-2">
                  <input type="hidden" name="isActive" value="true" />
                  <input type="hidden" name="cabang" value={employeeCabang} />
                  <input type="hidden" name="departmentId" value={employeeDepartmentId} />
                  <input type="hidden" name="locationId" value={employeeLocationId} />

                  {employeeFormState?.ok && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" aria-live="polite">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-semibold">{employeeFormState.message ?? "Karyawan berhasil dibuat."}</p>
                          <p className="text-emerald-700">Data baru sudah masuk ke database absensi.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {employeeFormState?.ok === false && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" aria-live="polite">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-semibold">{employeeFormState.error.code}</p>
                          <p>{employeeFormState.error.message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="employee-nik">NIK</Label>
                      <Input id="employee-nik" name="nik" placeholder="EMP-001" autoComplete="off" required />
                      {employeeFieldErrors?.nik?.[0] && <p className="text-xs text-red-600">{employeeFieldErrors.nik[0]}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="employee-name">Nama Karyawan</Label>
                      <Input id="employee-name" name="name" placeholder="Nama lengkap" autoComplete="name" required />
                      {employeeFieldErrors?.name?.[0] && <p className="text-xs text-red-600">{employeeFieldErrors.name[0]}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="employee-position">Jabatan</Label>
                      <Input id="employee-position" name="position" placeholder="Operator produksi" autoComplete="organization-title" />
                      {employeeFieldErrors?.position?.[0] && <p className="text-xs text-red-600">{employeeFieldErrors.position[0]}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="employee-phone">No. Telepon</Label>
                      <Input id="employee-phone" name="phone" placeholder="08xxxxxxxxxx" autoComplete="tel" />
                      {employeeFieldErrors?.phone?.[0] && <p className="text-xs text-red-600">{employeeFieldErrors.phone[0]}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label>Cabang</Label>
                      <Select value={employeeCabang} onValueChange={setEmployeeCabang}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih cabang" />
                        </SelectTrigger>
                        <SelectContent>
                          {cabangOptions.map((cabang) => (
                            <SelectItem key={cabang} value={cabang}>
                              Cabang {cabang}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {employeeFieldErrors?.cabang?.[0] && <p className="text-xs text-red-600">{employeeFieldErrors.cabang[0]}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label>Bagian</Label>
                      <Select value={employeeDepartmentId} onValueChange={setEmployeeDepartmentId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih bagian" />
                        </SelectTrigger>
                        <SelectContent>
                          {departmentList.map((department) => (
                            <SelectItem key={department.id} value={String(department.id)}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {employeeFieldErrors?.departmentId?.[0] && (
                        <p className="text-xs text-red-600">{employeeFieldErrors.departmentId[0]}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label>Lokasi Kerja</Label>
                      <Select value={employeeLocationId} onValueChange={setEmployeeLocationId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih lokasi" />
                        </SelectTrigger>
                        <SelectContent>
                          {locationList.map((location) => (
                            <SelectItem key={location.id} value={String(location.id)}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {employeeFieldErrors?.locationId?.[0] && <p className="text-xs text-red-600">{employeeFieldErrors.locationId[0]}</p>}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="employee-qr-code">Kode QR</Label>
                    <Input id="employee-qr-code" name="qrCode" placeholder="Kosongkan jika dibuat terpisah" autoComplete="off" />
                    {employeeFieldErrors?.qrCode?.[0] && <p className="text-xs text-red-600">{employeeFieldErrors.qrCode[0]}</p>}
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={isEmployeePending || !employeeDepartmentId || !employeeLocationId}>
                      {isEmployeePending ? "Menyimpan..." : "Simpan Karyawan"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Simulasi Scan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Simulasi Scan Absensi</DialogTitle>
                  <DialogDescription>Form ini memakai validator yang sama dengan aturan scan QR.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {employeeList.length === 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Tambahkan karyawan terlebih dahulu agar scan manual bisa dicatat.
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label>Karyawan</Label>
                    <Select
                      value={manualEmployeeId}
                      onValueChange={(value) => {
                        const employee = employeeList.find((item) => item.id === Number(value))
                        setManualEmployeeId(value)
                        if (employee) setManualLocationId(String(employee.locationId))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih karyawan" />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeList.map((employee) => (
                          <SelectItem key={employee.id} value={String(employee.id)}>
                            {employee.nik} - {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Lokasi</Label>
                      <Select value={manualLocationId} onValueChange={setManualLocationId}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {locationList.map((location) => (
                            <SelectItem key={location.id} value={String(location.id)}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Sesi</Label>
                      <Select value={manualSessionType} onValueChange={(value) => handleSessionChange(value as SessionType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sessionOrder.map((sessionType) => (
                            <SelectItem key={sessionType} value={sessionType}>
                              {sessionMeta[sessionType].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="manual-time">Jam Scan</Label>
                    <Input id="manual-time" type="time" value={manualTime} onChange={(event) => setManualTime(event.target.value)} />
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                    Window aktif: {getSessionWindow(manualLocationDetail, manualSessionType).start} -{" "}
                    {getSessionWindow(manualLocationDetail, manualSessionType).end}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleManualScan} disabled={employeeList.length === 0}>
                    Catat Scan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Dialog open={Boolean(editingEmployee)} onOpenChange={(open) => {
          if (!open) setEditingEmployee(null)
        }}>
          <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Karyawan</DialogTitle>
              <DialogDescription>Perubahan memakai server action update karyawan dan langsung disinkronkan ke tabel.</DialogDescription>
            </DialogHeader>
            {editingEmployee && (
              <form action={editEmployeeFormAction} className="grid gap-5 py-2">
                <input type="hidden" name="id" value={editingEmployee.id} />
                <input type="hidden" name="isActive" value="true" />
                <input type="hidden" name="cabang" value={editEmployeeCabang} />
                <input type="hidden" name="departmentId" value={editEmployeeDepartmentId} />
                <input type="hidden" name="locationId" value={editEmployeeLocationId} />

                {editEmployeeFormState?.ok === false && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" aria-live="polite">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-semibold">{editEmployeeFormState.error.code}</p>
                        <p>{editEmployeeFormState.error.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-employee-nik">NIK</Label>
                    <Input id="edit-employee-nik" name="nik" defaultValue={editingEmployee.nik} autoComplete="off" required />
                    {editEmployeeFieldErrors?.nik?.[0] && <p className="text-xs text-red-600">{editEmployeeFieldErrors.nik[0]}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-employee-name">Nama Karyawan</Label>
                    <Input id="edit-employee-name" name="name" defaultValue={editingEmployee.name} autoComplete="name" required />
                    {editEmployeeFieldErrors?.name?.[0] && <p className="text-xs text-red-600">{editEmployeeFieldErrors.name[0]}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-employee-position">Jabatan</Label>
                    <Input
                      id="edit-employee-position"
                      name="position"
                      defaultValue={editingEmployee.position ?? ""}
                      autoComplete="organization-title"
                    />
                    {editEmployeeFieldErrors?.position?.[0] && (
                      <p className="text-xs text-red-600">{editEmployeeFieldErrors.position[0]}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-employee-phone">No. Telepon</Label>
                    <Input id="edit-employee-phone" name="phone" defaultValue={editingEmployee.phone ?? ""} autoComplete="tel" />
                    {editEmployeeFieldErrors?.phone?.[0] && <p className="text-xs text-red-600">{editEmployeeFieldErrors.phone[0]}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label>Cabang</Label>
                    <Select value={editEmployeeCabang} onValueChange={setEditEmployeeCabang}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih cabang" />
                      </SelectTrigger>
                      <SelectContent>
                        {cabangOptions.map((cabang) => (
                          <SelectItem key={cabang} value={cabang}>
                            Cabang {cabang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editEmployeeFieldErrors?.cabang?.[0] && <p className="text-xs text-red-600">{editEmployeeFieldErrors.cabang[0]}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label>Bagian</Label>
                    <Select value={editEmployeeDepartmentId} onValueChange={setEditEmployeeDepartmentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bagian" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentList.map((department) => (
                          <SelectItem key={department.id} value={String(department.id)}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editEmployeeFieldErrors?.departmentId?.[0] && (
                      <p className="text-xs text-red-600">{editEmployeeFieldErrors.departmentId[0]}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Lokasi Kerja</Label>
                    <Select value={editEmployeeLocationId} onValueChange={setEditEmployeeLocationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih lokasi" />
                      </SelectTrigger>
                      <SelectContent>
                        {locationList.map((location) => (
                          <SelectItem key={location.id} value={String(location.id)}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editEmployeeFieldErrors?.locationId?.[0] && (
                      <p className="text-xs text-red-600">{editEmployeeFieldErrors.locationId[0]}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-employee-qr-code">Kode QR</Label>
                  <Input id="edit-employee-qr-code" name="qrCode" defaultValue={editingEmployee.qrCode} autoComplete="off" />
                  {editEmployeeFieldErrors?.qrCode?.[0] && <p className="text-xs text-red-600">{editEmployeeFieldErrors.qrCode[0]}</p>}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingEmployee(null)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isEditEmployeePending || !editEmployeeDepartmentId || !editEmployeeLocationId}>
                    {isEditEmployeePending ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={Boolean(deletingEmployee)} onOpenChange={(open) => {
          if (!open) setDeletingEmployee(null)
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Nonaktifkan karyawan?</AlertDialogTitle>
              <AlertDialogDescription>
                Data {deletingEmployee?.name ?? "karyawan"} akan disembunyikan dari daftar karyawan aktif. Riwayat scan yang sudah ada tetap tersimpan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteEmployeeFormState?.ok === false && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" aria-live="polite">
                <p className="font-semibold">{deleteEmployeeFormState.error.code}</p>
                <p>{deleteEmployeeFormState.error.message}</p>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleteEmployeePending}>Batal</AlertDialogCancel>
              <form action={deleteEmployeeAction}>
                <input type="hidden" name="id" value={deletingEmployee?.id ?? ""} />
                <Button type="submit" variant="destructive" disabled={isDeleteEmployeePending || !deletingEmployee}>
                  {isDeleteEmployeePending ? "Menghapus..." : "Delete"}
                </Button>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {scanNotice && (
          <div
            className={`rounded-lg border p-4 text-sm ${
              scanNotice.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {scanNotice.success ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertCircle className="mt-0.5 h-4 w-4" />}
              <div>
                <p className="font-semibold">{scanNotice.success ? "Scan berhasil" : scanNotice.code}</p>
                <p>{scanNotice.message}</p>
                {!scanNotice.success && scanNotice.previousScan && (
                  <p className="mt-1">Scan sebelumnya: {formatScanTime(scanNotice.previousScan.scannedAt)}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {employeeListError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-semibold">Data karyawan belum bisa dimuat</p>
                <p>{employeeListError}</p>
              </div>
            </div>
          </div>
        )}

        {masterDataError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-semibold">Data bagian/lokasi belum bisa dimuat</p>
                <p>{masterDataError}</p>
              </div>
            </div>
          </div>
        )}

        {attendanceSessionsError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-semibold">Data scan belum bisa dimuat</p>
                <p>{attendanceSessionsError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="stat-grid">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Karyawan Aktif</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">{summary.complete} lengkap, {summary.incomplete} belum lengkap</p>
            </CardContent>
          </Card>
          {statCards.map((card) => {
            const Icon = card.icon
            const value = summary[card.key]

            return (
              <Card key={card.key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <div className={`rounded-lg p-2 ${card.tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{value}</div>
                  <p className="text-xs text-muted-foreground">Tercatat pada {selectedDate}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="overflow-hidden">
          <CardContent className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_280px]">
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              {sessionOrder.map((sessionType) => {
                const window = getSessionWindow(selectedLocationDetail, sessionType)
                return (
                  <div key={sessionType} className="rounded-lg border border-border bg-muted/35 p-3">
                    <p className="text-sm font-semibold">{sessionMeta[sessionType].label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{window.start} - {window.end}</p>
                  </div>
                )
              })}
            </div>
            <div className="rounded-lg bg-primary p-4 text-primary-foreground">
              <p className="text-sm font-medium">Kelengkapan {sessionOrder.length} sesi</p>
              <div className="mt-2 text-3xl font-semibold">{completionRate}%</div>
              <p className="mt-1 text-xs opacity-85">Berdasarkan filter aktif.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filter Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="toolbar-grid">
              {/* <div className="grid gap-2">
                <Label htmlFor="date">Tanggal</Label>
                <Input id="date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
              </div> */}
              <div className="grid gap-2">
                <Label>Lokasi</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Lokasi</SelectItem>
                    {locationList.map((location) => (
                      <SelectItem key={location.id} value={String(location.id)}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Bagian</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Bagian</SelectItem>
                    {departmentList.map((department) => (
                      <SelectItem key={department.id} value={String(department.id)}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="search">Cari</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nama, NIK, posisi..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="tabs-responsive grid-cols-3">
            <TabsTrigger value="daily">Status Harian</TabsTrigger>
            <TabsTrigger value="report">Laporan Scan</TabsTrigger>
            <TabsTrigger value="rules">Aturan</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle>Status Harian Semua Karyawan</CardTitle>
                <CardDescription>Setiap baris mengikuti konsep `DailySummary` dari dokumentasi.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Karyawan</TableHead>
                      <TableHead>Lokasi</TableHead>
                      {sessionOrder.map((sessionType) => (
                        <TableHead key={sessionType}>{sessionMeta[sessionType].shortLabel}</TableHead>
                      ))}
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length > 0 ? (
                      rows.map((row) => (
                        <TableRow key={row.employee.id}>
                          <TableCell>
                            <div className="font-medium">{row.employee.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {row.employee.nik} - {row.department.name}
                              {row.employee.cabang ? ` - Cabang ${row.employee.cabang}` : ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{row.location.name}</span>
                            </div>
                          </TableCell>
                          {sessionOrder.map((sessionType) => (
                            <TableCell key={sessionType}>{renderSessionBadge(row.sessions[sessionType])}</TableCell>
                          ))}
                          <TableCell>
                            <Badge className={row.allComplete ? "bg-emerald-600" : "bg-slate-500"}>
                              {row.completeCount}/{sessionOrder.length} sesi
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => openEditEmployee(row.employee)}>
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => setDeletingEmployee(row.employee)}>
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={sessionOrder.length + 4} className="h-24 text-center text-muted-foreground">
                          Belum ada karyawan. Klik Tambah Karyawan untuk mulai input data.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report">
            <Card>
              <CardHeader>
                <CardTitle>Laporan Scan</CardTitle>
                <CardDescription>Format data mendekati response `/attendance/report`.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Karyawan</TableHead>
                      <TableHead>Sesi</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead>Keterlambatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportRows.length > 0 ? (
                      reportRows.map((session) => {
                        const employee = employeeList.find((item) => item.id === session.employeeId)
                        return (
                          <TableRow key={session.id}>
                            <TableCell>{formatScanTime(session.scannedAt)}</TableCell>
                            <TableCell>
                              <div className="font-medium">{employee?.name ?? "-"}</div>
                              <div className="text-xs text-muted-foreground">
                                {employee?.nik}
                                {employee?.cabang ? ` - Cabang ${employee.cabang}` : ""}
                              </div>
                            </TableCell>
                            <TableCell>{sessionMeta[session.sessionType].label}</TableCell>
                            <TableCell>{session.scanMethod}</TableCell>
                            <TableCell>{session.isLate ? `${session.lateMinutes} menit` : "-"}</TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          Belum ada scan untuk tanggal dan filter ini.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    Anti Duplikat
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  Kombinasi karyawan, tanggal, dan sesi hanya boleh tercatat satu kali. Scan kedua akan mengembalikan `ALREADY_SCANNED`.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-sky-600" />
                    Check-in Wajib
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  Semua sesi lanjutan, termasuk pembagian daging dan kelengkapan logistik, ditolak bila `CHECK_IN` belum tercatat pada tanggal yang sama.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    Window Lokasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  Setiap lokasi punya jadwal sendiri. Scan di luar rentang aktif akan mengembalikan `OUTSIDE_WINDOW`.
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function renderSessionBadge(session: AttendanceSession | null) {
  if (!session) return <Badge variant="secondary">Belum</Badge>

  return (
    <Badge className="bg-emerald-600">
      <CheckCircle2 className="mr-1 h-3 w-3" />
      {formatScanTime(session.scannedAt)}
    </Badge>
  )
}

function mapApiAttendanceSession(session: ApiAttendanceReportSession, selectedDate: string): AttendanceSession {
  return {
    id: String(session.id),
    employeeId: session.employeeId,
    locationId: session.locationId,
    date: selectedDate,
    sessionType: session.sessionType,
    scannedAt: session.scannedAt,
    scanMethod: session.scanMethod,
    isLate: session.isLate,
    lateMinutes: session.lateMinutes,
    note: session.note ?? undefined,
  }
}
