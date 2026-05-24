"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Keyboard,
  MapPin,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react"
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode"

import {
  type AttendanceSession,
  type Department,
  type Employee,
  type Location,
  type SessionType,
  combineDateAndTime,
  demoAttendanceDate,
  demoScanTimes,
  departments as initialDepartments,
  employees as initialEmployees,
  formatScanTime,
  getDailyStatus,
  getDepartment,
  getLocation,
  getSessionWindow,
  initialAttendanceSessions,
  locations as initialLocations,
  normalizeEmployeeRecord,
  normalizeLocationRecord,
  sessionMeta,
  sessionOrder,
} from "@/lib/attendance-system"

type RecentScan = {
  id: string
  employeeName: string
  employeeNik: string
  sessionType: SessionType
  time: string
  success: boolean
  message: string
}

type ApiScanEmployee = Employee & {
  department?: Department
  location?: Pick<Location, "id" | "name" | "timezone">
}

type ApiAttendanceSession = {
  id: number | string
  employeeId: number
  locationId: number
  date: string
  sessionType: SessionType
  scannedAt: string
  scanMethod: "QR" | "RFID" | "MANUAL"
  isLate: boolean
  lateMinutes: number
  note?: string | null
  employee?: ApiScanEmployee
}

type ApiScanResponse =
  | {
      success: true
      message: string
      data: ApiAttendanceSession
    }
  | {
      success: false
      code: string
      message: string
      previousScan?: ApiAttendanceSession
      window?: { start: string; end: string }
    }

type ScannerScanNotice =
  | {
      success: true
      message: string
      session: AttendanceSession
    }
  | {
      success: false
      code: string
      message: string
      previousScan?: AttendanceSession
    }

export default function QRScanner() {
  const [departmentList, setDepartmentList] = useState<Department[]>(initialDepartments)
  const [locationList, setLocationList] = useState<Location[]>(initialLocations)
  const [masterDataError, setMasterDataError] = useState<string | null>(null)
  const [employeeList, setEmployeeList] = useState<Employee[]>(initialEmployees)
  const [employeeListError, setEmployeeListError] = useState<string | null>(null)
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(initialAttendanceSessions)
  const [scanDate, setScanDate] = useState(demoAttendanceDate)
  const [selectedLocationId, setSelectedLocationId] = useState(String(initialLocations[0].id))
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>("CHECK_IN")
  const [scanTime, setScanTime] = useState(demoScanTimes.CHECK_IN)
  const [manualQr, setManualQr] = useState("")
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [scanNotice, setScanNotice] = useState<ScannerScanNotice | null>(null)
  const [attendanceInfo, setAttendanceInfo] = useState<Employee | null>(null)
  const [isProcessingScan, setIsProcessingScan] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scannerInitialized, setScannerInitialized] = useState(false)
  const [recentScans, setRecentScans] = useState<RecentScan[]>([])
  const scannerRef = useRef<any>(null)
  const scannerContainerRef = useRef<HTMLDivElement>(null)

  const selectedLocation = locationList.find((location) => location.id === Number(selectedLocationId)) ?? locationList[0] ?? initialLocations[0]
  const selectedWindow = getSessionWindow(selectedLocation, selectedSessionType)

  const activeStatus = useMemo(() => {
    if (!attendanceInfo) return null
    return getDailyStatus({
      sessions: attendanceSessions,
      date: scanDate,
      locationId: "all",
      employees: employeeList,
      departments: departmentList,
      locations: locationList,
    }).find((row) => row.employee.id === attendanceInfo.id)
  }, [attendanceInfo, attendanceSessions, departmentList, employeeList, locationList, scanDate])

  useEffect(() => {
    async function loadData() {
      try {
        const [employeeResponse, departmentResponse, locationResponse] = await Promise.all([
          fetch("/api/employees", { cache: "no-store" }),
          fetch("/api/departments", { cache: "no-store" }),
          fetch("/api/locations", { cache: "no-store" }),
        ])
        const employeePayload = (await employeeResponse.json()) as { success?: boolean; data?: Employee[]; message?: string }
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

        if (!employeeResponse.ok || !employeePayload.success || !Array.isArray(employeePayload.data)) {
          throw new Error(employeePayload.message ?? "Gagal memuat data karyawan.")
        }

        if (!departmentResponse.ok || !departmentPayload.success || !Array.isArray(departmentPayload.data)) {
          throw new Error(departmentPayload.message ?? "Gagal memuat data bagian.")
        }

        if (!locationResponse.ok || !locationPayload.success || !Array.isArray(locationPayload.data)) {
          throw new Error(locationPayload.message ?? "Gagal memuat data lokasi.")
        }

        setEmployeeList(employeePayload.data.map(normalizeEmployeeRecord))
        setDepartmentList(departmentPayload.data)
        setLocationList(locationPayload.data.map(normalizeLocationRecord))
        setEmployeeListError(null)
        setMasterDataError(null)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal memuat data karyawan."
        setEmployeeListError(message)
        setMasterDataError(message)
      }
    }

    void loadData()
  }, [])

  useEffect(() => {
    if (locationList.length === 0) {
      setSelectedLocationId("")
      return
    }

    if (!locationList.some((location) => location.id === Number(selectedLocationId))) {
      setSelectedLocationId(String(locationList[0].id))
    }
  }, [locationList, selectedLocationId])

  useEffect(() => {
    if (isScanning && !scannerInitialized && scannerContainerRef.current) {
      try {
        scannerContainerRef.current.innerHTML = ""
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 12,
            qrbox: { width: 300, height: 220 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.CODE_93,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.ITF,
            ],
          },
          false,
        )
        scannerRef.current.render(onScanSuccess, onScanFailure)
        setScannerInitialized(true)
      } catch (err) {
        console.error("Error initializing scanner:", err)
      }
    }

    return () => {
      if (scannerRef.current && scannerInitialized) {
        try {
          scannerRef.current.clear()
        } catch (err) {
          console.error("Error clearing scanner:", err)
        }
      }
    }
  }, [isScanning, scannerInitialized])

  const startScanner = () => {
    setScanResult(null)
    setScanNotice(null)
    setAttendanceInfo(null)
    setIsScanning(true)
  }

  const stopScanner = () => {
    if (scannerRef.current && scannerInitialized) {
      try {
        scannerRef.current.clear()
        setScannerInitialized(false)
      } catch (err) {
        console.error("Error stopping scanner:", err)
      }
    }
    setIsScanning(false)
  }

  const onScanSuccess = (decodedText: string) => {
    stopScanner()
    processQrPayload(decodedText, "QR")
  }

  const onScanFailure = (error: any) => {
    console.warn(`QR scan error: ${error}`)
  }

  const processQrPayload = async (payload: string, method: "QR" | "MANUAL") => {
    const qrCode = payload.trim()
    if (!qrCode || isProcessingScan) return

    setScanResult(qrCode)
    setScanNotice(null)
    setAttendanceInfo(null)
    setIsProcessingScan(true)

    try {
      const response = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCode,
          locationId: Number(selectedLocationId),
          sessionType: selectedSessionType,
          scannedAt: combineDateAndTime(scanDate, scanTime),
          scanMethod: method,
        }),
      })
      const result = (await response.json()) as ApiScanResponse

      if (result.success) {
        const session = mapApiSession(result.data, scanDate)
        const employee = result.data.employee ? normalizeEmployeeRecord(result.data.employee) : null

        setScanNotice({
          success: true,
          message: result.message,
          session,
        })
        setAttendanceSessions((current) => [session, ...current])

        if (employee) {
          setAttendanceInfo(employee)
          setEmployeeList((current) => upsertEmployee(current, employee))
          addRecentScan(employee.name, employee.nik, selectedSessionType, true, result.message)
        } else {
          addRecentScan("Karyawan", qrCode, selectedSessionType, true, result.message)
        }

        return
      }

      const previousScan = result.previousScan ? mapApiSession(result.previousScan, scanDate) : undefined
      const failedNotice: ScannerScanNotice = {
        success: false,
        code: result.code,
        message: result.code === "INVALID_QR" ? "QR code tidak valid atau tidak ada di database." : result.message,
        previousScan,
      }

      setScanNotice(failedNotice)
      addRecentScan(result.code === "INVALID_QR" ? "QR tidak valid" : "Scan ditolak", qrCode, selectedSessionType, false, failedNotice.message)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengirim scan ke database."
      setScanNotice({
        success: false,
        code: "SERVER_ERROR",
        message,
      })
      addRecentScan("Scan gagal", qrCode, selectedSessionType, false, message)
    } finally {
      setIsProcessingScan(false)
    }
  }

  const addRecentScan = (
    employeeName: string,
    employeeNik: string,
    sessionType: SessionType,
    success: boolean,
    message: string,
  ) => {
    const item: RecentScan = {
      id: `${Date.now()}-${employeeNik}-${sessionType}`,
      employeeName,
      employeeNik,
      sessionType,
      time: scanTime,
      success,
      message,
    }
    setRecentScans((current) => [item, ...current.slice(0, 5)])
  }

  const resetScan = () => {
    setScanResult(null)
    setScanNotice(null)
    setAttendanceInfo(null)
    startScanner()
  }

  const handleSessionChange = (value: SessionType) => {
    setSelectedSessionType(value)
    setScanTime(demoScanTimes[value])
  }

  return (
    <div className="app-page">
      <div className="page-container-narrow">
        <div className="page-header">
          <div>
            <h1 className="page-title">Scanner Absensi QR</h1>
          </div>
        </div>

        {(employeeListError || masterDataError) && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Data belum bisa dimuat</p>
            <p>{employeeListError ?? masterDataError}</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Kontrol Sesi Scan</CardTitle>
            <CardDescription hidden>Window dan lokasi mengikuti jadwal kerja dari dokumen sistem absensi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* <div className="grid gap-2">
                <Label htmlFor="scan-date">Tanggal</Label>
                <Input id="scan-date" type="date" value={scanDate} onChange={(event) => setScanDate(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Lokasi Scan</Label>
                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
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
              </div> */}
              <div className="grid gap-2">
                <Label>Sesi</Label>
                <Select value={selectedSessionType} onValueChange={(value) => handleSessionChange(value as SessionType)}>
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
              {/* <div className="grid gap-2">
                <Label htmlFor="scan-time">Jam Scan</Label>
                <Input id="scan-time" type="time" value={scanTime} onChange={(event) => setScanTime(event.target.value)} />
              </div> */}
            </div>
            {/* <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Window {sessionMeta[selectedSessionType].label}: {selectedWindow.start} - {selectedWindow.end} di {selectedLocation.name}
            </div> */}
            {/* <div className="grid gap-2">
              <Label htmlFor="manual-qr" className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-muted-foreground" />
                Input QR Manual
              </Label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  id="manual-qr"
                  value={manualQr}
                  onChange={(event) => setManualQr(event.target.value)}
                  placeholder="Masukkan kode QR karyawan"
                />
                <Button
                  type="button"
                  onClick={() => processQrPayload(manualQr, "MANUAL")}
                  disabled={!manualQr.trim() || !selectedLocationId || isProcessingScan}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {isProcessingScan ? "Menyimpan..." : "Proses"}
                </Button>
              </div>
            </div> */}
          </CardContent>
        </Card>

        <Tabs defaultValue="scanner" className="space-y-4">
          <TabsList className="tabs-responsive grid-cols-2">
            <TabsTrigger value="scanner">Scanner</TabsTrigger>
            <TabsTrigger value="recent">Riwayat Scan</TabsTrigger>
          </TabsList>

          <TabsContent value="scanner">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5" />
                  Scan Barcode / QR
                </CardTitle>
                <CardDescription>Arahkan kode ke area bidik. Hasil scan akan langsung dicatat ke database.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="min-w-0 truncate">{sessionMeta[selectedSessionType].label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="min-w-0 truncate">{selectedLocation.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{scanTime}</span>
                  </div>
                </div>

                {!isScanning && !scanResult && (
                  <div className="scanner-ready-panel">
                    <div className="scanner-ready-visual" aria-hidden="true">
                      <div className="scanner-ready-frame">
                        <ScanLine className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-2 text-center">
                      <h3 className="text-lg font-semibold text-foreground">Siap memindai kode absensi</h3>
                      <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
                        Pastikan kamera aktif, kode terlihat penuh, dan jarak perangkat stabil agar terbaca lebih cepat.
                      </p>
                    </div>
                    <Button size="lg" onClick={startScanner} disabled={isProcessingScan || !selectedLocationId}>
                      <Camera className="mr-2 h-4 w-4" />
                      Buka Kamera
                    </Button>
                  </div>
                )}

                {isScanning && (
                  <div className="space-y-4">
                    <div className="scanner-camera-shell">
                      <div className="scanner-camera-header">
                        <div>
                          <p className="text-sm font-semibold text-white">Kamera aktif</p>
                          <p className="text-xs text-white/70">Posisikan barcode atau QR di dalam bingkai.</p>
                        </div>
                        <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Live</Badge>
                      </div>
                      <div className="scanner-viewport">
                        <div ref={scannerContainerRef} id="qr-reader" className="scanner-reader"></div>
                        <div className="scanner-frame-overlay" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                      <p className="text-sm text-muted-foreground">
                        Tips: naikkan kecerahan layar kode, hindari pantulan cahaya, lalu tahan 1-2 detik.
                      </p>
                      <Button variant="outline" onClick={stopScanner} className="sm:w-auto">
                        Tutup Kamera
                      </Button>
                    </div>
                  </div>
                )}

                {scanNotice && (
                  <div className="space-y-4">
                    {scanNotice.success ? (
                      <Alert className="border-emerald-200 bg-emerald-50">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <AlertTitle className="text-emerald-800">Scan Berhasil</AlertTitle>
                        <AlertDescription className="text-emerald-700">{scanNotice.message}</AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="border-red-200 bg-red-50">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertTitle className="text-red-800">{scanNotice.code}</AlertTitle>
                        <AlertDescription className="text-red-700">
                          {scanNotice.message}
                          {scanNotice.previousScan && (
                            <span className="mt-1 block">Scan sebelumnya: {formatScanTime(scanNotice.previousScan.scannedAt)}</span>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {attendanceInfo && (
                      <div className="rounded-lg border border-border bg-card p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
                              {attendanceInfo.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold">{attendanceInfo.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {attendanceInfo.nik} - {getDepartment(attendanceInfo.departmentId, departmentList)?.name}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{getLocation(attendanceInfo.locationId, locationList)?.name}</Badge>
                        </div>

                        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{attendanceInfo.position}{attendanceInfo.cabang ? ` - Cabang ${attendanceInfo.cabang}` : ""}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{scanDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedLocation.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{scanTime}</span>
                          </div>
                        </div>

                        {activeStatus && (
                          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {sessionOrder.map((sessionType) => (
                              <div key={sessionType} className="rounded-lg border border-border bg-muted/30 p-3">
                                <p className="text-xs font-medium text-muted-foreground">{sessionMeta[sessionType].shortLabel}</p>
                                <div className="mt-2">
                                  {activeStatus.sessions[sessionType] ? (
                                    <Badge className="bg-emerald-600">{formatScanTime(activeStatus.sessions[sessionType]!.scannedAt)}</Badge>
                                  ) : (
                                    <Badge variant="secondary">Belum</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              {scanNotice && (
                <CardFooter>
                  <Button onClick={resetScan} className="w-full" disabled={isProcessingScan}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Scan QR Lain
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Scan Terakhir</CardTitle>
                <CardDescription>Berisi scan berhasil dan scan yang ditolak oleh aturan bisnis.</CardDescription>
              </CardHeader>
              <CardContent>
                {recentScans.length > 0 ? (
                  <div className="space-y-3">
                    {recentScans.map((scan) => (
                      <div key={scan.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-medium">{scan.employeeName}</p>
                          <p className="text-sm text-muted-foreground">{scan.employeeNik}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{scan.message}</p>
                        </div>
                        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                          <Badge className={scan.success ? "bg-emerald-600" : "bg-red-600"}>
                            {scan.success ? "OK" : "Ditolak"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {sessionMeta[scan.sessionType].shortLabel} - {scan.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-panel">
                    <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p>Belum ada riwayat scan.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={startScanner} className="w-full" disabled={isProcessingScan || !selectedLocationId}>
                  <Camera className="h-4 w-4 mr-2" />
                  Scan QR Baru
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function mapApiSession(session: ApiAttendanceSession, fallbackDate: string): AttendanceSession {
  return {
    id: String(session.id),
    employeeId: session.employeeId,
    locationId: session.locationId,
    date: fallbackDate,
    sessionType: session.sessionType,
    scannedAt: session.scannedAt,
    scanMethod: session.scanMethod,
    isLate: session.isLate,
    lateMinutes: session.lateMinutes,
    note: session.note ?? undefined,
  }
}

function upsertEmployee(employeeList: Employee[], employee: Employee) {
  const exists = employeeList.some((item) => item.id === employee.id)
  if (exists) {
    return employeeList.map((item) => (item.id === employee.id ? employee : item))
  }

  return [...employeeList, employee]
}
