import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await clearEmployeeData()
  await seedDepartments()
  await seedLocations()
  await seedQurbanLogistics()

  console.log("Seed master absensi dan logistik qurban selesai. Employee dan riwayat scan dikosongkan.")
}

async function clearEmployeeData() {
  await prisma.dailySummary.deleteMany()
  await prisma.attendanceSession.deleteMany()
  await prisma.employee.deleteMany()
}

async function seedDepartments() {
  await prisma.department.deleteMany()

  await prisma.department.createMany({
    data: departments,
  })
}

const departments = [
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

async function seedLocations() {
  const kantor = await prisma.location.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Kantor Panitia",
      address: "Area Masjid Al-Ikhlas",
      timezone: "Asia/Jakarta",
    },
  })

  const distribusi = await prisma.location.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: "Pos Distribusi",
      address: "Gerbang distribusi warga",
      timezone: "Asia/Jakarta",
    },
  })

  await prisma.workSchedule.upsert({
    where: { locationId: kantor.id },
    update: {},
    create: {
      locationId: kantor.id,
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
  })

  await prisma.workSchedule.upsert({
    where: { locationId: distribusi.id },
    update: {},
    create: {
      locationId: distribusi.id,
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
  })

  return { kantor, distribusi }
}

async function seedQurbanLogistics() {
  for (const item of qurbanLogisticsItems) {
    await prisma.qurbanLogisticsItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  }
}

const qurbanLogisticsItems = [
  {
    id: 1,
    name: "Pisau Besar",
    category: "Penyembelihan",
    ownerName: "Tim Penyembelih",
    ownerContact: "Ust. Abdul",
    qrCode: "QLOG-PISEMBELIH-001",
    quantity: 5,
    available: 3,
    unit: "buah",
    status: "LIMITED" as const,
    storageLocation: "Meja alat utama",
    notes: "Dua pisau sedang diasah ulang.",
  },
  {
    id: 2,
    name: "Tali Pengikat",
    category: "Penanganan Hewan",
    ownerName: "Tim Logistik",
    ownerContact: "Bpk. Dani",
    qrCode: "QLOG-TALI-002",
    quantity: 10,
    available: 8,
    unit: "ikat",
    status: "AVAILABLE" as const,
    storageLocation: "Gudang logistik",
    notes: "Cadangan untuk area sapi dan domba.",
  },
  {
    id: 3,
    name: "Alas Terpal",
    category: "Area Kerja",
    ownerName: "DKM Masjid Al-Ikhlas",
    ownerContact: "Sekretariat DKM",
    qrCode: "QLOG-TERPAL-003",
    quantity: 4,
    available: 2,
    unit: "lembar",
    status: "LIMITED" as const,
    storageLocation: "Sisi area recah",
    notes: "Dua terpal dipakai di area timbang.",
  },
  {
    id: 4,
    name: "Ember Besar",
    category: "Kebersihan",
    ownerName: "Tim Kebersihan",
    ownerContact: "Bpk. Joko",
    qrCode: "QLOG-EMBER-004",
    quantity: 8,
    available: 8,
    unit: "buah",
    status: "AVAILABLE" as const,
    storageLocation: "Pos kebersihan",
    notes: "Siap pakai untuk alur pembersihan.",
  },
  {
    id: 5,
    name: "Timbangan",
    category: "Packing",
    ownerName: "Tim Timbang dan Packing",
    ownerContact: "Bpk. Rahmat",
    qrCode: "QLOG-TIMBANGAN-005",
    quantity: 2,
    available: 0,
    unit: "unit",
    status: "UNAVAILABLE" as const,
    storageLocation: "Area packing",
    notes: "Menunggu baterai cadangan.",
  },
]

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
