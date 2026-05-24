import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  MilkIcon as Cow,
  PackageCheck,
  QrCode,
  ScanLine,
  ShieldCheck,
  Users,
  Utensils,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  demoAttendanceDate,
  getDailyStatus,
  initialAttendanceSessions,
  summarizeDailyRows,
} from "@/lib/attendance-system"

type MetricCard = {
  label: string
  value: string
  delta: string
  icon: LucideIcon
  accent: string
}

type ModuleCard = {
  title: string
  description: string
  href: string
  icon: LucideIcon
  status: string
  signal: string
  accent: string
  iconClass: string
  stats: Array<{ label: string; value: string }>
}

const attendanceRows = getDailyStatus({
  sessions: initialAttendanceSessions,
  date: demoAttendanceDate,
  locationId: "all",
})
const attendanceSummary = summarizeDailyRows(attendanceRows)
const completionRate = attendanceSummary.totalEmployees
  ? Math.round((attendanceSummary.complete / attendanceSummary.totalEmployees) * 100)
  : 0

const metrics: MetricCard[] = [
  {
    label: "Panitia Terdata",
    value: String(attendanceSummary.totalEmployees),
    delta: `${attendanceSummary.complete} lengkap 6 sesi`,
    icon: Users,
    accent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  {
    label: "Scan Sesi Hari Ini",
    value: String(initialAttendanceSessions.length),
    delta: "CHECK_IN + makan + daging + logistik",
    icon: Utensils,
    accent: "bg-amber-50 text-amber-700 ring-amber-100",
  },
  {
    label: "Hewan Qurban",
    value: "5",
    delta: "1 proses, 1 selesai",
    icon: Cow,
    accent: "bg-sky-50 text-sky-700 ring-sky-100",
  },
  {
    label: "Dokumentasi",
    value: "5",
    delta: "261 views",
    icon: Camera,
    accent: "bg-rose-50 text-rose-700 ring-rose-100",
  },
]

const modules: ModuleCard[] = [
  {
    title: "Kehadiran Panitia",
    description: "Absensi 6 sesi, jadwal lokasi, dan rekap harian.",
    href: "/attendance",
    icon: Calendar,
    status: "Siap",
    signal: "Makan wajib setelah absen datang",
    accent: "border-l-emerald-500",
    iconClass: "bg-emerald-50 text-emerald-700",
    stats: [
      { label: "Check-in", value: String(attendanceSummary.checkedIn) },
      { label: "Lengkap", value: String(attendanceSummary.complete) },
    ],
  },
  {
    title: "Logistik Qurban",
    description: "Hewan, alat, personil, dan paket distribusi.",
    href: "/qurban",
    icon: Cow,
    status: "Prioritas",
    signal: "Timbangan belum tersedia",
    accent: "border-l-sky-500",
    iconClass: "bg-sky-50 text-sky-700",
    stats: [
      { label: "Sapi", value: "3" },
      { label: "Kambing", value: "2" },
    ],
  },
  {
    title: "Dokumentasi",
    description: "Foto, video, dokumen, dan arsip kegiatan.",
    href: "/documentation",
    icon: Camera,
    status: "Aktif",
    signal: "1 draft menunggu publikasi",
    accent: "border-l-rose-500",
    iconClass: "bg-rose-50 text-rose-700",
    stats: [
      { label: "File", value: "5" },
      { label: "Download", value: "91" },
    ],
  },
  {
    title: "Scan QR",
    description: "Validasi nametag untuk absensi cepat.",
    href: "/qr-scanner",
    icon: ScanLine,
    status: "Standby",
    signal: "Scanner kamera siap dipakai",
    accent: "border-l-violet-500",
    iconClass: "bg-violet-50 text-violet-700",
    stats: [
      { label: "Sesi", value: "6" },
      { label: "Aturan", value: "3" },
    ],
  },
  {
    title: "Generate QR",
    description: "QR karyawan dari field Employee.qrCode.",
    href: "/qr-generator",
    icon: QrCode,
    status: "Siap cetak",
    signal: "ID peserta tersinkron dengan scanner",
    accent: "border-l-zinc-500",
    iconClass: "bg-zinc-100 text-zinc-700",
    stats: [
      { label: "Peserta", value: String(attendanceSummary.totalEmployees) },
      { label: "Payload", value: "QR" },
    ],
  },
]

const agenda = [
  { time: "06:30", title: "Window makan pagi dibuka", tag: "BREAKFAST" },
  { time: "07:00", title: "Window absen datang dibuka", tag: "CHECK_IN" },
  { time: "07:30", title: "Penyembelihan Sapi #1", tag: "Qurban" },
  { time: "11:30", title: "Window makan siang dibuka", tag: "LUNCH" },
  { time: "13:00", title: "Window pembagian daging dibuka", tag: "MEAT_DISTRIBUTION" },
  { time: "18:30", title: "Cek kelengkapan logistik ditutup", tag: "LOGISTICS" },
]

const priorities = [
  { title: "Cek sesi belum lengkap", detail: `${attendanceSummary.incomplete} panitia belum lengkap 6 sesi.`, icon: ShieldCheck },
  { title: "Audit scan duplikat", detail: "Scanner menolak sesi yang sudah tercatat.", icon: PackageCheck },
  { title: "Publikasi dokumentasi", detail: "Draft distribusi perlu direview.", icon: CheckCircle2 },
]

export default function DashboardOverview() {
  return (
    <div className="app-page text-zinc-950">
      <div className="page-container">
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.45fr_0.55fr]">
            <div className="space-y-6 p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-zinc-950 text-white hover:bg-zinc-950">Operasional Hari Ini</Badge>
                <Badge variant="outline" className="rounded-md border-emerald-200 bg-emerald-50 text-emerald-700">
                  15 Jan 2024
                </Badge>
              </div>

              <div className="max-w-3xl space-y-3">
                <h1 className="text-3xl font-semibold leading-tight text-zinc-950 sm:text-4xl">
                  Dashboard Operasional Panitia
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
                  Kontrol ringkas untuk kehadiran, logistik qurban, dokumentasi, dan alur QR dalam satu layar kerja.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <div className="text-2xl font-semibold">{completionRate}%</div>
                  <div className="mt-1 text-xs font-medium uppercase text-zinc-500">Kehadiran</div>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <div className="text-2xl font-semibold">{attendanceSummary.checkedIn}</div>
                  <div className="mt-1 text-xs font-medium uppercase text-zinc-500">Check-in</div>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <div className="text-2xl font-semibold">5</div>
                  <div className="mt-1 text-xs font-medium uppercase text-zinc-500">Modul aktif</div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-200 bg-zinc-950 p-5 text-white lg:border-l lg:border-t-0 sm:p-7">
              <div className="flex h-full flex-col justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <Activity className="h-4 w-4 text-emerald-300" />
                    Status Operasi
                  </div>
                  <div>
                    <div className="text-5xl font-semibold tracking-normal">{initialAttendanceSessions.length}</div>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">scan absensi tercatat pada data demo hari ini.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-emerald-300" style={{ width: `${completionRate}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Stabil</span>
                    <span>{completionRate}% selesai</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon

            return (
              <Card key={metric.label} className="rounded-lg border-zinc-200 bg-white shadow-sm">
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">{metric.label}</p>
                    <div className="mt-2 text-3xl font-semibold tracking-normal">{metric.value}</div>
                    <p className="mt-1 text-sm text-zinc-500">{metric.delta}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ring-1 ${metric.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">Modul Kerja</h2>
                <p className="mt-1 text-sm text-zinc-500">Ringkasan status dan pintasan tugas inti.</p>
              </div>
              <Button asChild variant="outline" className="h-9 w-full rounded-md border-zinc-300 bg-white sm:w-auto">
                <Link href="/qr-scanner">
                  <ScanLine className="mr-2 h-4 w-4" />
                  Scan QR
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {modules.map((module) => {
                const Icon = module.icon

                return (
                  <Card
                    key={module.title}
                    className={`group rounded-lg border-l-4 border-y-zinc-200 border-r-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${module.accent}`}
                  >
                    <CardHeader className="space-y-0 p-5 pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`shrink-0 rounded-lg p-2.5 ${module.iconClass}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="truncate text-base font-semibold text-zinc-950">{module.title}</CardTitle>
                            <p className="mt-1 text-sm leading-5 text-zinc-500">{module.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0 rounded-md border-zinc-200 bg-zinc-50 text-zinc-600">
                          {module.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-5 pt-0">
                      <div className="grid grid-cols-2 gap-3">
                        {module.stats.map((item) => (
                          <div key={item.label} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                            <div className="text-lg font-semibold">{item.value}</div>
                            <div className="mt-1 text-xs font-medium text-zinc-500">{item.label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-zinc-600">{module.signal}</p>
                        <Button asChild size="sm" className="h-9 rounded-md bg-zinc-950 text-white hover:bg-zinc-800">
                          <Link href={module.href}>
                            Buka
                            <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          <aside className="space-y-4">
            <Card className="rounded-lg border-zinc-200 bg-white shadow-sm">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base font-semibold">Agenda Hari Ini</CardTitle>
                  <Clock className="h-4 w-4 text-zinc-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1 p-5 pt-0">
                {agenda.map((item) => (
                  <div key={`${item.time}-${item.title}`} className="grid grid-cols-[58px_1fr] gap-3 border-b border-zinc-100 py-3 last:border-b-0">
                    <div className="text-sm font-semibold tabular-nums text-zinc-950">{item.time}</div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">{item.title}</p>
                      <p className="mt-1 text-xs font-medium text-zinc-500">{item.tag}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-zinc-200 bg-white shadow-sm">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-semibold">Prioritas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5 pt-0">
                {priorities.map((item) => {
                  const Icon = item.icon

                  return (
                    <div key={item.title} className="flex gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <div className="mt-0.5 shrink-0 rounded-md bg-white p-2 text-zinc-700 shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-950">{item.title}</p>
                        <p className="mt-1 text-sm leading-5 text-zinc-500">{item.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </div>
  )
}
