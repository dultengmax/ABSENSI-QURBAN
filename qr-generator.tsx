"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react"
import { Badge } from "@/components/ui/badge"
import { Download, Plus, Printer, QrCode, Search, Share2 } from "lucide-react"

import {
  type Department,
  type Employee,
  type Location,
  departments as initialDepartments,
  employees as initialEmployees,
  getDepartment,
  getLocation,
  locations as initialLocations,
  normalizeEmployeeRecord,
  normalizeLocationRecord,
} from "@/lib/attendance-system"

export default function QRGenerator() {
  const [departmentList, setDepartmentList] = useState<Department[]>(initialDepartments)
  const [locationList, setLocationList] = useState<Location[]>(initialLocations)
  const [employeeList, setEmployeeList] = useState<Employee[]>(initialEmployees)
  const [employeeListError, setEmployeeListError] = useState<string | null>(null)
  const [masterDataError, setMasterDataError] = useState<string | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [qrValue, setQrValue] = useState("")
  const [qrSize, setQrSize] = useState(200)
  const [customQrCode, setCustomQrCode] = useState("")
  const [customName, setCustomName] = useState("")
  const [customDepartment, setCustomDepartment] = useState("")

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

  const filteredEmployees = employeeList.filter((employee) => {
    const department = getDepartment(employee.departmentId, departmentList)
    const location = getLocation(employee.locationId, locationList)
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      employee.name.toLowerCase().includes(search) ||
      employee.nik.toLowerCase().includes(search) ||
      employee.qrCode.toLowerCase().includes(search) ||
      (employee.cabang ?? "").toLowerCase().includes(search)
    const matchesDepartment = selectedDepartment === "all" || employee.departmentId === Number(selectedDepartment)
    const matchesLocation = selectedLocation === "all" || employee.locationId === Number(selectedLocation)

    return matchesSearch && matchesDepartment && matchesLocation && department && location
  })

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setQrValue(employee.qrCode)
  }

  const handleGenerateCustomQR = () => {
    if (customQrCode) {
      setQrValue(customQrCode)
      setSelectedEmployee(null)
    }
  }

  const handleDownloadQR = () => {
    const canvas = document.getElementById("qr-code-canvas")
    if (canvas instanceof HTMLCanvasElement) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")
      const downloadLink = document.createElement("a")
      downloadLink.href = pngUrl
      downloadLink.download = `qrcode-${selectedEmployee?.nik || "custom"}.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
  }

  const handlePrintNametag = () => {
    const qrCanvas = document.getElementById("qr-code-canvas")
    const qrImage = qrCanvas instanceof HTMLCanvasElement ? qrCanvas.toDataURL() : ""
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const departmentName = selectedEmployee
        ? getDepartment(selectedEmployee.departmentId, departmentList)?.name
        : customDepartment || "Bagian"
      const locationName = selectedEmployee ? getLocation(selectedEmployee.locationId, locationList)?.name : "Lokasi"
      const employeeName = selectedEmployee?.name || customName || "Nama Karyawan"
      const employeeNik = selectedEmployee?.nik || "CUSTOM"

      printWindow.document.write(`
        <html>
          <head>
            <title>Print Nametag</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .nametag { width: 350px; border: 1px solid #ccc; padding: 20px; margin: 0 auto; text-align: center; }
              .nametag-header { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
              .nametag-name { font-size: 24px; font-weight: bold; margin: 15px 0; }
              .nametag-meta { font-size: 14px; margin-bottom: 8px; color: #444; }
              .qr-code { margin: 12px auto 0; width: 150px; height: 150px; }
            </style>
          </head>
          <body>
            <div class="nametag">
              <div class="nametag-header">ABSENSI PANITIA</div>
              <div class="nametag-name">${employeeName}</div>
              <div class="nametag-meta">${departmentName} - ${locationName}</div>
              <div class="nametag-meta">NIK: ${employeeNik}</div>
              <div class="qr-code">
                <img src="${qrImage}" width="150" height="150" />
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  return (
    <div className="app-page">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Generator QR Karyawan</h1>
            <p className="page-subtitle">Buat QR dari field `Employee.qrCode` untuk alur absensi 4 sesi.</p>
          </div>
        </div>

        {(employeeListError || masterDataError) && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Data belum bisa dimuat</p>
            <p>{employeeListError ?? masterDataError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filter Karyawan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="search">Cari</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Nama, NIK, QR..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="pl-8"
                      />
                    </div>
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daftar Karyawan</CardTitle>
                <CardDescription>Pilih karyawan untuk membuat QR absensi.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIK</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Bagian</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>{employee.nik}</TableCell>
                          <TableCell>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {employee.position}
                            {employee.cabang ? ` - Cabang ${employee.cabang}` : ""}
                          </div>
                          </TableCell>
                          <TableCell>{getDepartment(employee.departmentId, departmentList)?.name}</TableCell>
                          <TableCell>{getLocation(employee.locationId, locationList)?.name}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleSelectEmployee(employee)}>
                              <QrCode className="h-3 w-3 mr-1" />
                              Generate
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          Belum ada karyawan. Tambahkan data karyawan dari dashboard absensi.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                  <Link href="/attendance">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Karyawan
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom QR Payload</CardTitle>
                <CardDescription>Untuk testing payload QR sebelum data karyawan masuk database.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="custom-qr">QR Payload</Label>
                    <Input
                      id="custom-qr"
                      placeholder="QR-EMP-999-CUSTOM"
                      value={customQrCode}
                      onChange={(event) => setCustomQrCode(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="custom-name">Nama</Label>
                    <Input
                      id="custom-name"
                      placeholder="Nama karyawan"
                      value={customName}
                      onChange={(event) => setCustomName(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="custom-department">Bagian</Label>
                    <Input
                      id="custom-department"
                      placeholder="Bagian"
                      value={customDepartment}
                      onChange={(event) => setCustomDepartment(event.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleGenerateCustomQR} disabled={!customQrCode} className="w-full sm:w-auto">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate Custom
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div>
            <Card className="lg:sticky lg:top-20">
              <CardHeader>
                <CardTitle>Preview QR Absensi</CardTitle>
                <CardDescription>Payload ini dibaca oleh scanner sebagai identitas karyawan.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="qr" className="space-y-4">
                  <TabsList className="tabs-responsive grid-cols-2">
                    <TabsTrigger value="qr">QR Code</TabsTrigger>
                    <TabsTrigger value="nametag">Nametag</TabsTrigger>
                  </TabsList>

                  <TabsContent value="qr" className="space-y-4">
                    <div className="flex min-h-[260px] flex-col items-center justify-center overflow-auto rounded-lg border border-border bg-muted/30 p-4">
                      {qrValue ? (
                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <QRCodeCanvas id="qr-code-canvas" value={qrValue} size={qrSize} includeMargin={true} level="H" />
                          </div>
                          <div className="space-y-1 text-center">
                            <p className="font-medium">{selectedEmployee?.name || customName || "Custom QR"}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedEmployee
                                ? `${getDepartment(selectedEmployee.departmentId, departmentList)?.name} - ${getLocation(selectedEmployee.locationId, locationList)?.name}`
                                : customDepartment || "Payload custom"}
                            </p>
                            <Badge variant="outline" className="max-w-full break-all">
                              {qrValue}
                            </Badge>
                          </div>
                          <div className="flex justify-center">
                            <Label htmlFor="qr-size" className="text-sm">
                              Ukuran: {qrSize}px
                            </Label>
                          </div>
                          <Input
                            id="qr-size"
                            type="range"
                            min="100"
                            max="300"
                            step="10"
                            value={qrSize}
                            onChange={(event) => setQrSize(Number.parseInt(event.target.value))}
                            className="accent-primary"
                          />
                        </div>
                      ) : (
                        <div className="empty-panel w-full">
                          <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <p>Pilih karyawan atau buat payload custom.</p>
                        </div>
                      )}
                    </div>

                    {qrValue && (
                      <div className="flex flex-col gap-2">
                        <Button onClick={handleDownloadQR}>
                          <Download className="h-4 w-4 mr-2" />
                          Download QR
                        </Button>
                        <Button variant="outline">
                          <Share2 className="h-4 w-4 mr-2" />
                          Bagikan QR
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="nametag">
                    <div id="nametag-print-area" className="space-y-4 rounded-lg border border-border bg-white p-5 text-center">
                      {qrValue ? (
                        <>
                          <div className="text-lg font-bold">ABSENSI PANITIA</div>
                          <div className="text-2xl font-bold">{selectedEmployee?.name || customName || "Nama Karyawan"}</div>
                          <div className="text-base text-muted-foreground">
                            {selectedEmployee ? getDepartment(selectedEmployee.departmentId, departmentList)?.name : customDepartment || "Bagian"}
                          </div>
                          <div className="text-sm text-muted-foreground">NIK: {selectedEmployee?.nik || "CUSTOM"}</div>
                          <div className="flex justify-center py-2">
                            <QRCodeSVG value={qrValue} size={150} includeMargin={true} level="H" />
                          </div>
                        </>
                      ) : (
                        <div className="empty-panel">
                          <p>Pilih karyawan untuk melihat preview nametag.</p>
                        </div>
                      )}
                    </div>

                    {qrValue && (
                      <div className="mt-4 flex flex-col gap-2">
                        <Button onClick={handlePrintNametag}>
                          <Printer className="h-4 w-4 mr-2" />
                          Print Nametag
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
