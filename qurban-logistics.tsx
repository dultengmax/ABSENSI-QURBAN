"use client"

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  MilkIcon as Cow,
  Scissors,
  Users,
  Package,
  Plus,
  Search,
  Download,
  CheckCircle2,
  Clock,
  Scale,
  AlertCircle,
} from "lucide-react"

type LogisticsStatus = "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | "MAINTENANCE"

type QurbanLogisticsItem = {
  id: number
  name: string
  category?: string | null
  ownerName: string
  ownerContact?: string | null
  quantity: number
  available: number
  unit: string
  status: LogisticsStatus
  storageLocation?: string | null
  notes?: string | null
}

// Sample data for qurban animals
const qurbanAnimals = [
  {
    id: 1,
    type: "Sapi",
    weight: 450,
    owner: "Masjid Al-Ikhlas",
    participants: 7,
    scheduledTime: "07:30",
    status: "completed",
    notes: "Sapi sehat, siap disembelih",
  },
  {
    id: 2,
    type: "Sapi",
    weight: 500,
    owner: "Keluarga Bpk. Ahmad",
    participants: 7,
    scheduledTime: "08:15",
    status: "in-progress",
    notes: "Sapi besar, perlu tambahan personil",
  },
  {
    id: 3,
    type: "Kambing",
    weight: 35,
    owner: "Ibu Siti Aminah",
    participants: 1,
    scheduledTime: "09:00",
    status: "pending",
    notes: "Kambing sehat",
  },
  {
    id: 4,
    type: "Kambing",
    weight: 40,
    owner: "Bpk. Dedi",
    participants: 1,
    scheduledTime: "09:30",
    status: "pending",
    notes: "Kambing sehat",
  },
  {
    id: 5,
    type: "Sapi",
    weight: 475,
    owner: "Komunitas RT 03",
    participants: 7,
    scheduledTime: "10:15",
    status: "pending",
    notes: "Sapi dari peternakan lokal",
  },
]

const fallbackLogisticsEquipment: QurbanLogisticsItem[] = [
  {
    id: 1,
    name: "Pisau Besar",
    category: "Penyembelihan",
    ownerName: "Tim Penyembelih",
    ownerContact: "Ust. Abdul",
    quantity: 5,
    available: 3,
    unit: "buah",
    status: "LIMITED",
    storageLocation: "Meja alat utama",
    notes: "Dua pisau sedang diasah ulang.",
  },
  {
    id: 2,
    name: "Tali Pengikat",
    category: "Penanganan Hewan",
    ownerName: "Tim Logistik",
    ownerContact: "Bpk. Dani",
    quantity: 10,
    available: 8,
    unit: "ikat",
    status: "AVAILABLE",
    storageLocation: "Gudang logistik",
    notes: "Cadangan untuk area sapi dan domba.",
  },
  {
    id: 3,
    name: "Alas Terpal",
    category: "Area Kerja",
    ownerName: "DKM Masjid Al-Ikhlas",
    ownerContact: "Sekretariat DKM",
    quantity: 4,
    available: 2,
    unit: "lembar",
    status: "LIMITED",
    storageLocation: "Sisi area recah",
    notes: "Dua terpal dipakai di area timbang.",
  },
  {
    id: 4,
    name: "Ember Besar",
    category: "Kebersihan",
    ownerName: "Tim Kebersihan",
    ownerContact: "Bpk. Joko",
    quantity: 8,
    available: 8,
    unit: "buah",
    status: "AVAILABLE",
    storageLocation: "Pos kebersihan",
    notes: "Siap pakai untuk alur pembersihan.",
  },
  {
    id: 5,
    name: "Timbangan",
    category: "Packing",
    ownerName: "Tim Timbang dan Packing",
    ownerContact: "Bpk. Rahmat",
    quantity: 2,
    available: 0,
    unit: "unit",
    status: "UNAVAILABLE",
    storageLocation: "Area packing",
    notes: "Menunggu baterai cadangan.",
  },
]

// Sample data for personnel
const personnel = [
  {
    id: 1,
    name: "Ust. Abdul",
    role: "Penyembelih",
    shift: "Pagi",
    status: "active",
    assignments: ["Sapi #1", "Sapi #2"],
  },
  {
    id: 2,
    name: "Bpk. Rahmat",
    role: "Penyembelih",
    shift: "Siang",
    status: "active",
    assignments: ["Sapi #5"],
  },
  {
    id: 3,
    name: "Bpk. Hasan",
    role: "Pemotong",
    shift: "Pagi",
    status: "active",
    assignments: ["Sapi #1", "Kambing #3"],
  },
  {
    id: 4,
    name: "Bpk. Joko",
    role: "Pemotong",
    shift: "Pagi-Siang",
    status: "active",
    assignments: ["Sapi #2", "Kambing #4"],
  },
  {
    id: 5,
    name: "Bpk. Dani",
    role: "Distribusi",
    shift: "Siang",
    status: "standby",
    assignments: [],
  },
]

// Sample data for distribution
const distributionData = [
  {
    id: 1,
    animalId: 1,
    totalMeat: 320,
    packages: 64,
    distributed: 58,
    remaining: 6,
    status: "in-progress",
  },
  {
    id: 2,
    animalId: 2,
    totalMeat: 0,
    packages: 0,
    distributed: 0,
    remaining: 0,
    status: "not-started",
  },
]

const qurbanScheduleSessions = [
  {
    id: "meat-distribution",
    title: "Pembagian Daging",
    time: "13:00 - 16:00",
    owner: "Tim Distribusi",
    status: "in-progress",
    detail: "Validasi paket daging, serah terima penerima, dan sisa distribusi.",
  },
  {
    id: "logistics-completeness",
    title: "Kelengkapan Logistik",
    time: "06:00 - 18:30",
    owner: "Tim Logistik",
    status: "pending",
    detail: "Cek alat, stok pendukung, kebersihan area, dan pengembalian perlengkapan.",
  },
]

export default function QurbanLogistics() {
  const [selectedTab, setSelectedTab] = useState("logistics")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddAnimalDialogOpen, setIsAddAnimalDialogOpen] = useState(false)
  const [isAddEquipmentDialogOpen, setIsAddEquipmentDialogOpen] = useState(false)
  const [logisticsItems, setLogisticsItems] = useState<QurbanLogisticsItem[]>(fallbackLogisticsEquipment)
  const [logisticsError, setLogisticsError] = useState<string | null>(null)
  const [isSavingEquipment, setIsSavingEquipment] = useState(false)
  const equipmentFormRef = useRef<HTMLFormElement>(null)

  // Filter animals based on search and status
  const filteredAnimals = qurbanAnimals.filter((animal) => {
    const matchesSearch =
      animal.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.owner.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || animal.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const totalAnimals = qurbanAnimals.length
  const totalSapi = qurbanAnimals.filter((a) => a.type === "Sapi").length
  const totalKambing = qurbanAnimals.filter((a) => a.type === "Kambing").length
  const completedAnimals = qurbanAnimals.filter((a) => a.status === "completed").length
  const inProgressAnimals = qurbanAnimals.filter((a) => a.status === "in-progress").length
  const pendingAnimals = qurbanAnimals.filter((a) => a.status === "pending").length

  const totalMeatDistributed = distributionData.reduce((sum, item) => sum + item.distributed, 0)
  const totalPackages = distributionData.reduce((sum, item) => sum + item.packages, 0)
  const filteredLogisticsItems = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    return logisticsItems
      .filter((item) => {
        if (filterStatus === "all") return true
        return item.status === normalizeLogisticsStatus(filterStatus)
      })
      .filter((item) => {
        if (!search) return true
        return (
          item.name.toLowerCase().includes(search) ||
          item.ownerName.toLowerCase().includes(search) ||
          (item.category ?? "").toLowerCase().includes(search) ||
          (item.storageLocation ?? "").toLowerCase().includes(search)
        )
      })
  }, [filterStatus, logisticsItems, searchTerm])
  const totalLogisticsItems = logisticsItems.length
  const unavailableLogisticsItems = logisticsItems.filter((item) => item.status === "UNAVAILABLE").length
  const limitedLogisticsItems = logisticsItems.filter((item) => item.status === "LIMITED").length
  const totalAvailableUnits = logisticsItems.reduce((sum, item) => sum + item.available, 0)

  useEffect(() => {
    async function loadLogistics() {
      try {
        const response = await fetch("/api/qurban/logistics", { cache: "no-store" })
        const payload = (await response.json()) as {
          success?: boolean
          data?: QurbanLogisticsItem[]
          message?: string
        }

        if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
          throw new Error(payload.message ?? "Gagal memuat data logistik.")
        }

        setLogisticsItems(payload.data)
        setLogisticsError(null)
      } catch (error) {
        setLogisticsError(error instanceof Error ? error.message : "Gagal memuat data logistik.")
      }
    }

    void loadLogistics()
  }, [])

  const handleCreateEquipment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSavingEquipment(true)
    setLogisticsError(null)

    const formData = new FormData(event.currentTarget)
    const body = Object.fromEntries(formData.entries())

    try {
      const response = await fetch("/api/qurban/logistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const payload = (await response.json()) as {
        success?: boolean
        data?: QurbanLogisticsItem
        message?: string
      }

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message ?? "Gagal menyimpan data logistik.")
      }

      setLogisticsItems((current) => [payload.data!, ...current])
      equipmentFormRef.current?.reset()
      setIsAddEquipmentDialogOpen(false)
    } catch (error) {
      setLogisticsError(error instanceof Error ? error.message : "Gagal menyimpan data logistik.")
    } finally {
      setIsSavingEquipment(false)
    }
  }

  // Status badge renderer
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Selesai
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="default" className="bg-blue-500">
            <Clock className="h-3 w-3 mr-1" /> Proses
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" /> Menunggu
          </Badge>
        )
      case "available":
      case "AVAILABLE":
        return (
          <Badge variant="default" className="bg-green-500">
            Tersedia
          </Badge>
        )
      case "limited":
      case "LIMITED":
        return (
          <Badge variant="default" className="bg-yellow-500">
            Terbatas
          </Badge>
        )
      case "unavailable":
      case "UNAVAILABLE":
        return <Badge variant="destructive">Tidak Tersedia</Badge>
      case "MAINTENANCE":
        return <Badge variant="outline">Perawatan</Badge>
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            Aktif
          </Badge>
        )
      case "standby":
        return <Badge variant="secondary">Standby</Badge>
      case "not-started":
        return <Badge variant="secondary">Belum Dimulai</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="app-page">
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Manajemen Logistik Qurban</h1>
            <p className="page-subtitle">Kelola hewan, peralatan, distribusi daging, dan kelengkapan logistik qurban</p>
          </div>
          <div className="page-actions">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedTab("logistics")
                setIsAddEquipmentDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Data
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {/* <div className="stat-grid">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hewan</CardTitle>
              <Cow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAnimals}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Sapi: {totalSapi}</span>
                <span>|</span>
                <span>Kambing: {totalKambing}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Penyembelihan</CardTitle>
              <Scissors className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Progress value={(completedAnimals / totalAnimals) * 100} className="h-2" />
                <span className="text-xs font-medium">{Math.round((completedAnimals / totalAnimals) * 100)}%</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                  Selesai: {completedAnimals}
                </span>
                <span>|</span>
                <span className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
                  Proses: {inProgressAnimals}
                </span>
                <span>|</span>
                <span className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-gray-300 mr-1"></div>
                  Menunggu: {pendingAnimals}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Personil</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{personnel.length}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Aktif: {personnel.filter((p) => p.status === "active").length}</span>
                <span>|</span>
                <span>Standby: {personnel.filter((p) => p.status === "standby").length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distribusi</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalMeatDistributed} <span className="text-sm font-normal">paket</span>
              </div>
              <p className="text-xs text-muted-foreground">Dari total {totalPackages} paket</p>
            </CardContent>
          </Card>
        </div> */}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex-1">
                <Label htmlFor="search">Cari</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Cari peralatan, pemilik, atau lokasi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex-1">
                <Label htmlFor="status">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="AVAILABLE">Tersedia</SelectItem>
                    <SelectItem value="LIMITED">Terbatas</SelectItem>
                    <SelectItem value="UNAVAILABLE">Tidak Tersedia</SelectItem>
                    <SelectItem value="MAINTENANCE">Perawatan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2">
          {qurbanScheduleSessions.map((session) => (
            <Card key={session.id}>
              <CardHeader className="space-y-0 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{session.title}</CardTitle>
                    <CardDescription>{session.owner}</CardDescription>
                  </div>
                  {getStatusBadge(session.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {session.time}
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{session.detail}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="tabs-responsive grid-cols-2 lg:grid-cols-4">
            {/* <TabsTrigger value="animals">Hewan Qurban</TabsTrigger> */}
            <TabsTrigger value="logistics">Peralatan</TabsTrigger>
            {/* <TabsTrigger value="personnel">Personil</TabsTrigger> */}
            <TabsTrigger value="distribution">Distribusi</TabsTrigger>
          </TabsList>

          {/* Animals Tab */}
          {/* <TabsContent value="animals">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Daftar Hewan Qurban</CardTitle>
                  <CardDescription>Kelola hewan qurban dan jadwal penyembelihan</CardDescription>
                </div>
                <Dialog open={isAddAnimalDialogOpen} onOpenChange={setIsAddAnimalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Hewan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Hewan Qurban</DialogTitle>
                      <DialogDescription>Masukkan data hewan qurban baru</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="animal-type">Jenis Hewan</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih jenis" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sapi">Sapi</SelectItem>
                              <SelectItem value="kambing">Kambing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="animal-weight">Berat (kg)</Label>
                          <Input id="animal-weight" type="number" placeholder="0" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="animal-owner">Pemilik/Shohibul Qurban</Label>
                        <Input id="animal-owner" placeholder="Nama pemilik" />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="animal-participants">Jumlah Peserta</Label>
                          <Input id="animal-participants" type="number" placeholder="1" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="animal-time">Jadwal Penyembelihan</Label>
                          <Input id="animal-time" type="time" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="animal-notes">Catatan</Label>
                        <Textarea id="animal-notes" placeholder="Catatan tambahan..." />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={() => setIsAddAnimalDialogOpen(false)}>
                        Simpan Data
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Berat (kg)</TableHead>
                        <TableHead>Pemilik</TableHead>
                        <TableHead>Peserta</TableHead>
                        <TableHead>Jadwal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAnimals.map((animal) => (
                        <TableRow key={animal.id}>
                          <TableCell className="font-medium">{animal.type}</TableCell>
                          <TableCell>{animal.weight} kg</TableCell>
                          <TableCell>{animal.owner}</TableCell>
                          <TableCell>{animal.participants}</TableCell>
                          <TableCell>{animal.scheduledTime}</TableCell>
                          <TableCell>{getStatusBadge(animal.status)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                              <Button variant="outline" size="sm">
                                Detail
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent> */}

          {/* Logistics Tab */}
          <TabsContent value="logistics">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Peralatan Logistik</CardTitle>
                  <CardDescription>Kelola ketersediaan peralatan, pemilik, dan lokasi simpan.</CardDescription>
                </div>
                <Dialog open={isAddEquipmentDialogOpen} onOpenChange={setIsAddEquipmentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Peralatan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Peralatan</DialogTitle>
                      <DialogDescription>Masukkan data peralatan baru</DialogDescription>
                    </DialogHeader>
                    <form ref={equipmentFormRef} onSubmit={handleCreateEquipment} className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="equipment-name">Nama Peralatan</Label>
                        <Input id="equipment-name" name="name" placeholder="Nama peralatan" required />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="equipment-category">Kategori</Label>
                          <Input id="equipment-category" name="category" placeholder="Packing, kebersihan..." />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="equipment-unit">Satuan</Label>
                          <Input id="equipment-unit" name="unit" placeholder="unit, buah, lembar" defaultValue="unit" />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="equipment-owner">Punya Siapa</Label>
                          <Input id="equipment-owner" name="ownerName" placeholder="Tim / nama pemilik" required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="equipment-owner-contact">Kontak Penanggung Jawab</Label>
                          <Input id="equipment-owner-contact" name="ownerContact" placeholder="Nama / nomor kontak" />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="equipment-quantity">Total Jumlah</Label>
                          <Input id="equipment-quantity" name="quantity" type="number" min="0" placeholder="0" required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="equipment-available">Jumlah Tersedia</Label>
                          <Input id="equipment-available" name="available" type="number" min="0" placeholder="0" required />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="equipment-storage">Lokasi Simpan</Label>
                        <Input id="equipment-storage" name="storageLocation" placeholder="Gudang, meja packing, pos distribusi..." />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="equipment-notes">Catatan</Label>
                        <Textarea id="equipment-notes" name="notes" placeholder="Catatan tambahan..." />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isSavingEquipment}>
                          {isSavingEquipment ? "Menyimpan..." : "Simpan Data"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {logisticsError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-semibold">Data logistik belum sinkron</p>
                        <p>{logisticsError}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mb-4 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Jenis Barang</p>
                    <p className="mt-1 text-2xl font-semibold">{totalLogisticsItems}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Unit Tersedia</p>
                    <p className="mt-1 text-2xl font-semibold">{totalAvailableUnits}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Terbatas</p>
                    <p className="mt-1 text-2xl font-semibold">{limitedLogisticsItems}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Tidak Tersedia</p>
                    <p className="mt-1 text-2xl font-semibold">{unavailableLogisticsItems}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Peralatan</TableHead>
                        <TableHead>Punya Siapa</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Tersedia</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogisticsItems.map((equipment) => (
                        <TableRow key={equipment.id}>
                          <TableCell>
                            <div className="font-medium">{equipment.name}</div>
                            <div className="text-xs text-muted-foreground">{equipment.category ?? "Tanpa kategori"}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{equipment.ownerName}</div>
                            <div className="text-xs text-muted-foreground">{equipment.ownerContact ?? "Kontak belum diisi"}</div>
                          </TableCell>
                          <TableCell>
                            {equipment.quantity} {equipment.unit}
                          </TableCell>
                          <TableCell>
                            {equipment.available} {equipment.unit}
                          </TableCell>
                          <TableCell>{equipment.storageLocation ?? "-"}</TableCell>
                          <TableCell>{getStatusBadge(equipment.status)}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredLogisticsItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            Tidak ada data logistik sesuai filter.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personnel Tab */}
          <TabsContent value="personnel">
            <Card>
              <CardHeader>
                <CardTitle>Personil Penyembelihan</CardTitle>
                <CardDescription>Kelola personil dan penugasan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Peran</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Penugasan</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {personnel.map((person) => (
                        <TableRow key={person.id}>
                          <TableCell className="font-medium">{person.name}</TableCell>
                          <TableCell>{person.role}</TableCell>
                          <TableCell>{person.shift}</TableCell>
                          <TableCell>{getStatusBadge(person.status)}</TableCell>
                          <TableCell>
                            {person.assignments.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {person.assignments.map((assignment, index) => (
                                  <Badge key={index} variant="outline">
                                    {assignment}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Belum ada</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Assign
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Personil
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Ringkasan Distribusi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Daging:</span>
                        <span className="font-bold">
                          {distributionData.reduce((sum, item) => sum + item.totalMeat, 0)} kg
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Paket:</span>
                        <span className="font-bold">
                          {distributionData.reduce((sum, item) => sum + item.packages, 0)} paket
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sudah Didistribusikan:</span>
                        <span className="font-bold">
                          {distributionData.reduce((sum, item) => sum + item.distributed, 0)} paket
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sisa:</span>
                        <span className="font-bold">
                          {distributionData.reduce((sum, item) => sum + item.remaining, 0)} paket
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span>Progress Distribusi</span>
                        <span>
                          {Math.round(
                            (distributionData.reduce((sum, item) => sum + item.distributed, 0) /
                              distributionData.reduce((sum, item) => sum + item.packages, 0)) *
                              100 || 0,
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          (distributionData.reduce((sum, item) => sum + item.distributed, 0) /
                            distributionData.reduce((sum, item) => sum + item.packages, 0)) *
                            100 || 0
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Kategori Penerima
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Fakir Miskin:</span>
                        <span className="font-bold">35 paket</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Panitia:</span>
                        <span className="font-bold">10 paket</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shohibul Qurban:</span>
                        <span className="font-bold">7 paket</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Warga Sekitar:</span>
                        <span className="font-bold">6 paket</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full">
                        Lihat Detail Penerima
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribusi per Hewan</CardTitle>
                <CardDescription>Tracking distribusi daging qurban</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Hewan</TableHead>
                        <TableHead>Total Daging</TableHead>
                        <TableHead>Jumlah Paket</TableHead>
                        <TableHead>Terdistribusi</TableHead>
                        <TableHead>Sisa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {distributionData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {qurbanAnimals.find((a) => a.id === item.animalId)?.type} #{item.animalId}
                          </TableCell>
                          <TableCell>{item.totalMeat} kg</TableCell>
                          <TableCell>{item.packages}</TableCell>
                          <TableCell>{item.distributed}</TableCell>
                          <TableCell>{item.remaining}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Data Distribusi
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function normalizeLogisticsStatus(value: string): LogisticsStatus {
  return value.trim().toUpperCase().replaceAll("-", "_") as LogisticsStatus
}
