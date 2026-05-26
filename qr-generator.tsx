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

const NAMETAG_BACKGROUND_URL = "/background.png"

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")

const sanitizeFileName = (value: string) => value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })

const drawWrappedCenteredText = (
  context: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2,
) => {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (context.measureText(candidate).width <= maxWidth || !currentLine) {
      currentLine = candidate
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  const visibleLines = lines.slice(0, maxLines)
  if (lines.length > maxLines) {
    visibleLines[maxLines - 1] = `${visibleLines[maxLines - 1].replace(/\s+\S*$/, "")}...`
  }

  visibleLines.forEach((line, index) => {
    context.fillText(line, centerX, y + index * lineHeight)
  })

  return y + visibleLines.length * lineHeight
}

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
      const fileNik = sanitizeFileName(selectedEmployee?.nik || "custom") || "custom"
      downloadLink.href = pngUrl
      downloadLink.download = `qrcode-${fileNik}.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
  }

  const handleDownloadNametag = async () => {
    if (!qrValue) {
      return
    }

    const qrCanvas = document.getElementById("nametag-qr-canvas") ?? document.getElementById("qr-code-canvas")
    if (!(qrCanvas instanceof HTMLCanvasElement)) {
      return
    }

    const positionName = selectedEmployee ? selectedEmployee.position : customDepartment || "Jabatan"
    const employeeName = selectedEmployee?.name || customName || "Nama Karyawan"
    const employeeNik = selectedEmployee?.nik || "CUSTOM"
    const fileNik = sanitizeFileName(employeeNik) || "custom"
    const background = await loadImage(NAMETAG_BACKGROUND_URL)

    const canvas = document.createElement("canvas")
    canvas.width = 591
    canvas.height = 1004
    const context = canvas.getContext("2d")
    if (!context) {
      return
    }

    context.drawImage(background, 0, 0, canvas.width, canvas.height)
    context.textAlign = "center"
    context.textBaseline = "top"

    context.fillStyle = "#ffffff"
    context.font = "800 48px Georgia, Times New Roman, serif"
    context.shadowColor = "rgba(0, 0, 0, 0.26)"
    context.shadowBlur = 12
    context.shadowOffsetY = 3
    const afterNameY = drawWrappedCenteredText(context, employeeName.toUpperCase(), canvas.width / 2, 372, 462, 52, 2)
    context.shadowColor = "transparent"
    context.shadowBlur = 0
    context.shadowOffsetY = 0

    const ruleY = Math.max(afterNameY + 16, 500)
    const gradient = context.createLinearGradient(236, ruleY, 355, ruleY)
    gradient.addColorStop(0, "rgba(248, 215, 107, 0)")
    gradient.addColorStop(0.5, "#f8d76b")
    gradient.addColorStop(1, "rgba(248, 215, 107, 0)")
    context.fillStyle = gradient
    context.fillRect(236, ruleY, 119, 4)

    context.fillStyle = "#f4f7ed"
    context.font = "700 24px Trebuchet MS, Arial, sans-serif"
    drawWrappedCenteredText(context, positionName || "Jabatan", canvas.width / 2, ruleY + 22, 462, 30, 2)

    const qrX = 163
    const qrY = 636
    context.shadowColor = "rgba(0, 0, 0, 0.28)"
    context.shadowBlur = 34
    context.shadowOffsetY = 16
    context.fillStyle = "rgba(255, 255, 255, 0.96)"
    context.fillRect(qrX, qrY, 266, 266)
    context.shadowColor = "transparent"
    context.shadowBlur = 0
    context.shadowOffsetY = 0
    context.strokeStyle = "#dfb635"
    context.lineWidth = 3
    context.strokeRect(qrX + 1.5, qrY + 1.5, 263, 263)
    context.drawImage(qrCanvas, qrX + 18, qrY + 18, 230, 230)

    context.fillStyle = "#f3d05c"
    context.font = "900 18px Trebuchet MS, Arial, sans-serif"
    context.fillText(`NIK ${employeeNik}`, canvas.width / 2, 918)

    const downloadLink = document.createElement("a")
    downloadLink.href = canvas.toDataURL("image/png")
    downloadLink.download = `nametag-${fileNik}.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  const handlePrintNametag = () => {
    const qrCanvas = document.getElementById("nametag-qr-canvas") ?? document.getElementById("qr-code-canvas")
    const qrImage = qrCanvas instanceof HTMLCanvasElement ? qrCanvas.toDataURL() : ""
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const positionName = selectedEmployee ? selectedEmployee.position : customDepartment || "Jabatan"
      const employeeName = escapeHtml(selectedEmployee?.name || customName || "Nama Karyawan")
      const employeeNik = escapeHtml(selectedEmployee?.nik || "CUSTOM")
      const employeePosition = escapeHtml(positionName || "Jabatan")
      const qrPayload = escapeHtml(qrValue)

      printWindow.document.write(`
        <html>
          <head>
            <title>Print Nametag</title>
            <style>
              @page { size: 59.1mm 100.4mm; margin: 0; }
              * { box-sizing: border-box; }
              html, body { margin: 0; min-height: 100%; }
              body {
                display: grid;
                place-items: center;
                background: #eef2ee;
                font-family: "Trebuchet MS", Arial, sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .nametag {
                position: relative;
                width: 591px;
                height: 1004px;
                overflow: hidden;
                background: #003f2d;
                color: #fff;
                text-align: center;
                box-shadow: 0 24px 70px rgba(2, 26, 19, .28);
              }
              .background {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
              .content {
                position: absolute;
                inset: 356px 64px 142px;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .name {
                width: 100%;
                color: #ffffff;
                font-family: Georgia, "Times New Roman", serif;
                font-size: 48px;
                font-weight: 800;
                line-height: 1.02;
                overflow-wrap: anywhere;
                text-transform: uppercase;
                text-shadow: 0 3px 12px rgba(0, 0, 0, .22);
              }
              .rule {
                width: 108px;
                height: 4px;
                margin: 22px 0 18px;
                border-radius: 999px;
                background: linear-gradient(90deg, transparent, #f8d76b, transparent);
              }
              .meta {
                max-width: 100%;
                color: #f4f7ed;
                font-size: 24px;
                font-weight: 700;
                line-height: 1.22;
                overflow-wrap: anywhere;
              }
              .qr-card {
                margin-top: auto;
                width: 266px;
                padding: 15px;
                border: 3px solid #dfb635;
                border-radius: 18px;
                background: rgba(255, 255, 255, .96);
                box-shadow: 0 16px 34px rgba(0, 0, 0, .28);
              }
              .qr-card img {
                display: block;
                width: 230px;
                height: 230px;
              }
              .nik {
                margin-top: 10px;
                color: #f3d05c;
                font-size: 18px;
                font-weight: 900;
                letter-spacing: .1em;
              }
              @media print {
                body { background: transparent; }
                .nametag {
                  width: 59.1mm;
                  height: 100.4mm;
                  box-shadow: none;
                }
                .content { inset: 35.6mm 6.4mm 14.2mm; }
                .name { font-size: 4.8mm; }
                .rule { width: 10.8mm; height: .4mm; margin: 2.2mm 0 1.8mm; }
                .meta { font-size: 2.4mm; }
                .qr-card {
                  width: 26.6mm;
                  padding: 1.5mm;
                  border-width: .3mm;
                  border-radius: 1.8mm;
                  box-shadow: none;
                }
                .qr-card img { width: 23mm; height: 23mm; }
                .nik { margin-top: 1mm; font-size: 1.8mm; }
              }
            </style>
          </head>
          <body>
            <div class="nametag">
              <img class="background" src="${NAMETAG_BACKGROUND_URL}" alt="" />
              <div class="content">
                <div class="name">${employeeName}</div>
                <div class="rule"></div>
                <div class="meta">${employeePosition}</div>
                <div class="qr-card">
                  <img src="${qrImage}" alt="QR ${qrPayload}" />
                </div>
                <div class="nik">NIK ${employeeNik}</div>
              </div>
            </div>
            <script>
              const background = document.querySelector(".background");
              const printNametag = () => {
                window.focus();
                window.print();
              };
              if (background && !background.complete) {
                background.addEventListener("load", () => setTimeout(printNametag, 120), { once: true });
              } else {
                setTimeout(printNametag, 120);
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <div className="app-page">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Generator QR Karyawan</h1>
            <p className="page-subtitle">Buat QR dari field `Employee.qrCode` untuk alur absensi 6 sesi.</p>
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
                    <Label htmlFor="custom-department">Jabatan</Label>
                    <Input
                      id="custom-department"
                      placeholder="Jabatan"
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
                    <div
                      id="nametag-print-area"
                      className="mx-auto aspect-[591/1004] w-full max-w-[300px] overflow-hidden rounded-xl border border-emerald-950/20 bg-emerald-950 shadow-xl"
                    >
                      {qrValue ? (
                        <div
                          className="relative h-full w-full bg-cover bg-center text-center text-white"
                          style={{ backgroundImage: `url(${NAMETAG_BACKGROUND_URL})` }}
                        >
                          <div className="absolute inset-x-[10.8%] bottom-[14.1%] top-[35.5%] flex flex-col items-center">
                            <div className="w-full break-words font-serif text-[clamp(20px,8vw,31px)] font-extrabold uppercase leading-none text-white drop-shadow-md">
                              {selectedEmployee?.name || customName || "Nama Karyawan"}
                            </div>
                            <div className="my-3 h-0.5 w-16 rounded-full bg-gradient-to-r from-transparent via-[#f8d76b] to-transparent" />
                            <div className="w-full break-words text-sm font-bold leading-tight text-[#f4f7ed]">
                              {selectedEmployee ? selectedEmployee.position : customDepartment || "Jabatan"}
                            </div>
                            <div className="mt-auto rounded-lg border-2 border-[#dfb635] bg-white/95 p-2.5 shadow-lg">
                              <QRCodeSVG value={qrValue} size={116} includeMargin={true} level="H" />
                            </div>
                            <div className="mt-2 text-[11px] font-black tracking-widest text-[#f3d05c]">
                              NIK {selectedEmployee?.nik || "CUSTOM"}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="empty-panel h-full">
                          <p>Pilih karyawan untuk melihat preview nametag.</p>
                        </div>
                      )}
                    </div>

                    {qrValue && (
                      <div className="mt-4 flex flex-col gap-2">
                        <div className="sr-only">
                          <QRCodeCanvas id="nametag-qr-canvas" value={qrValue} size={280} includeMargin={true} level="H" />
                        </div>
                        <Button onClick={handleDownloadNametag}>
                          <Download className="h-4 w-4 mr-2" />
                          Download Nametag
                        </Button>
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
