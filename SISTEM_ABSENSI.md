# Sistem Absensi 4 Sesi

Dokumentasi teknis lengkap untuk implementasi backend sistem absensi karyawan dengan 4 sesi wajib harian: **absen datang**, **makan pagi**, **makan siang**, dan **makan sore**.

---

## Daftar Isi

1. [Gambaran Sistem](#1-gambaran-sistem)
2. [Tech Stack](#2-tech-stack)
3. [Struktur Folder](#3-struktur-folder)
4. [Database Schema (Prisma)](#4-database-schema-prisma)
5. [Aturan Bisnis](#5-aturan-bisnis)
6. [API Endpoints](#6-api-endpoints)
7. [Implementasi NestJS](#7-implementasi-nestjs)
8. [Konfigurasi & Environment](#8-konfigurasi--environment)
9. [Migrasi Database](#9-migrasi-database)
10. [Testing Skenario](#10-testing-skenario)

---

## 1. Gambaran Sistem

Sistem ini mengelola absensi karyawan dengan **4 sesi wajib per hari**:

| Sesi | Kode Enum | Window Waktu Default |
|------|-----------|----------------------|
| Absen Datang | `CHECK_IN` | 07:00 – 09:00 |
| Makan Pagi | `BREAKFAST` | 06:30 – 08:30 |
| Makan Siang | `LUNCH` | 11:30 – 13:00 |
| Makan Sore | `DINNER` | 16:30 – 18:00 |

### Prinsip utama

- Satu karyawan **hanya bisa scan satu kali per sesi per hari** — dijamin oleh unique constraint database
- Scan makan manapun **wajib absen datang dulu**
- Setiap sesi hanya bisa di-scan dalam **window waktu** yang ditentukan per lokasi
- Window waktu **berbeda per lokasi** — dikonfigurasi di tabel `work_schedules`

---

## 2. Tech Stack

```
Runtime     : Node.js 20+
Framework   : NestJS 10+
ORM         : Prisma 5+
Database    : PostgreSQL 15+
Language    : TypeScript 5+
Validation  : class-validator + class-transformer
```

### Install dependencies

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express
npm install @prisma/client prisma
npm install class-validator class-transformer
npm install date-fns
npm install @nestjs/config
npm install @nestjs/swagger swagger-ui-express

npm install -D @types/node typescript ts-node
```

---

## 3. Struktur Folder

```
src/
├── app.module.ts
├── main.ts
│
├── prisma/
│   └── prisma.service.ts
│
├── attendance/
│   ├── attendance.module.ts
│   ├── attendance.controller.ts
│   ├── attendance.service.ts
│   └── dto/
│       ├── scan.dto.ts
│       └── report-filter.dto.ts
│
├── employee/
│   ├── employee.module.ts
│   ├── employee.controller.ts
│   ├── employee.service.ts
│   └── dto/
│       ├── create-employee.dto.ts
│       └── update-employee.dto.ts
│
├── location/
│   ├── location.module.ts
│   ├── location.controller.ts
│   ├── location.service.ts
│   └── dto/
│       └── create-location.dto.ts
│
└── department/
    ├── department.module.ts
    ├── department.controller.ts
    ├── department.service.ts
    └── dto/
        └── create-department.dto.ts
```

---

## 4. Database Schema (Prisma)

Buat file `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enum ────────────────────────────────────────────────────────────────────

enum SessionType {
  CHECK_IN
  BREAKFAST
  LUNCH
  DINNER
}

enum ScanMethod {
  QR
  RFID
  MANUAL
}

// ─── Master Data ─────────────────────────────────────────────────────────────

model Department {
  id        Int        @id @default(autoincrement())
  name      String
  code      String     @unique
  employees Employee[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Location {
  id                Int                  @id @default(autoincrement())
  name              String
  address           String?
  timezone          String               @default("Asia/Jakarta")
  employees         Employee[]
  attendanceSessions AttendanceSession[]
  workSchedule      WorkSchedule?
  dailySummaries    DailySummary[]
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
}

model WorkSchedule {
  id             Int      @id @default(autoincrement())
  location       Location @relation(fields: [locationId], references: [id])
  locationId     Int      @unique
  // Absen datang
  checkInStart   String   @default("07:00")  // jam mulai boleh scan
  checkInDeadline String  @default("09:00")  // batas tidak terlambat
  // Makan pagi
  breakfastStart String   @default("06:30")
  breakfastEnd   String   @default("08:30")
  // Makan siang
  lunchStart     String   @default("11:30")
  lunchEnd       String   @default("13:00")
  // Makan sore
  dinnerStart    String   @default("16:30")
  dinnerEnd      String   @default("18:00")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

// ─── Karyawan ─────────────────────────────────────────────────────────────────

model Employee {
  id                 Int                  @id @default(autoincrement())
  nik                String               @unique
  name               String
  position           String?
  isActive           Boolean              @default(true)
  department         Department           @relation(fields: [departmentId], references: [id])
  departmentId       Int
  location           Location             @relation(fields: [locationId], references: [id])
  locationId         Int
  qrCode             String               @unique @default(uuid()) // untuk scan QR
  attendanceSessions AttendanceSession[]
  dailySummaries     DailySummary[]
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt
}

// ─── Sesi Absensi (tabel utama) ───────────────────────────────────────────────

model AttendanceSession {
  id          Int         @id @default(autoincrement())
  employee    Employee    @relation(fields: [employeeId], references: [id])
  employeeId  Int
  location    Location    @relation(fields: [locationId], references: [id])
  locationId  Int
  date        DateTime    @db.Date
  sessionType SessionType
  scannedAt   DateTime
  scanMethod  ScanMethod  @default(QR)
  isLate      Boolean     @default(false)
  lateMinutes Int         @default(0)
  note        String?
  createdAt   DateTime    @default(now())

  // KUNCI UTAMA — cegah duplikat scan per sesi per hari
  @@unique([employeeId, date, sessionType])
  @@index([date, locationId])
  @@index([employeeId, date])
}

// ─── Rekap Harian (untuk performa query laporan) ──────────────────────────────

model DailySummary {
  id             Int      @id @default(autoincrement())
  employee       Employee @relation(fields: [employeeId], references: [id])
  employeeId     Int
  location       Location @relation(fields: [locationId], references: [id])
  locationId     Int
  date           DateTime @db.Date
  checkInDone    Boolean  @default(false)
  breakfastDone  Boolean  @default(false)
  lunchDone      Boolean  @default(false)
  dinnerDone     Boolean  @default(false)
  allComplete    Boolean  @default(false) // true jika semua 4 sesi done
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([employeeId, date])
  @@index([date, locationId])
}
```

---

## 5. Aturan Bisnis

### 5.1 Urutan wajib

```
Absen datang → [Makan Pagi] → [Makan Siang] → [Makan Sore]
```

- Scan makan apapun sebelum absen datang → **tolak `400 NOT_CHECKED_IN`**
- Urutan makan pagi/siang/sore tidak harus berurutan, tapi semua memerlukan absen datang

### 5.2 Anti duplikat

Perlindungan berlapis dua:
1. **Aplikasi**: query cek sebelum insert
2. **Database**: `@@unique([employeeId, date, sessionType])` — menolak insert duplikat di level database (error Prisma `P2002`)

### 5.3 Validasi window waktu

Setiap sesi punya window waktu. Scan di luar window → **tolak `400 OUTSIDE_WINDOW`**

```
CHECK_IN  : checkInStart  s/d checkInDeadline  (terlambat dihitung dari checkInDeadline)
BREAKFAST : breakfastStart s/d breakfastEnd
LUNCH     : lunchStart     s/d lunchEnd
DINNER    : dinnerStart    s/d dinnerEnd
```

### 5.4 Validasi lokasi

`employee.locationId` harus sama dengan `locationId` yang dikirim saat scan.
Karyawan tidak bisa absen di lokasi yang bukan tempatnya terdaftar.

### 5.5 Status keterlambatan

Hanya berlaku untuk `CHECK_IN`:
```
lateMinutes = max(0, scannedAt - checkInDeadline) dalam menit
isLate      = lateMinutes > 0
```

---

## 6. API Endpoints

### Attendance

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/attendance/scan` | Scan semua sesi (datang/makan) |
| `GET` | `/attendance/daily` | Status harian semua karyawan per lokasi |
| `GET` | `/attendance/report` | Laporan dengan filter tanggal, bagian, lokasi |
| `GET` | `/attendance/employee/:id/summary` | Rekap bulanan per karyawan |

### Employee

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/employees` | List karyawan + filter |
| `GET` | `/employees/:id` | Detail karyawan |
| `POST` | `/employees` | Tambah karyawan baru |
| `PUT` | `/employees/:id` | Update data karyawan |
| `DELETE` | `/employees/:id` | Nonaktifkan karyawan |

### Master Data

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/departments` | List semua bagian |
| `POST` | `/departments` | Tambah bagian |
| `GET` | `/locations` | List semua lokasi |
| `POST` | `/locations` | Tambah lokasi + jadwal |
| `PUT` | `/locations/:id/schedule` | Update jadwal makan lokasi |

---

## 7. Implementasi NestJS

### 7.1 Prisma Service

`src/prisma/prisma.service.ts`

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
```

### 7.2 Scan DTO

`src/attendance/dto/scan.dto.ts`

```typescript
import { IsInt, IsEnum, IsDateString, IsOptional, IsString } from 'class-validator'
import { SessionType, ScanMethod } from '@prisma/client'

export class ScanDto {
  @IsInt()
  employeeId: number

  @IsInt()
  locationId: number

  @IsEnum(SessionType)
  sessionType: SessionType

  @IsDateString()
  scannedAt: string  // ISO 8601: "2025-05-22T08:14:00Z"

  @IsOptional()
  @IsEnum(ScanMethod)
  scanMethod?: ScanMethod

  @IsOptional()
  @IsString()
  note?: string
}
```

### 7.3 Attendance Service

`src/attendance/attendance.service.ts`

```typescript
import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ScanDto } from './dto/scan.dto'
import { SessionType, ScanMethod } from '@prisma/client'
import { startOfDay, parse, isAfter, isBefore, differenceInMinutes } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Scan utama — semua sesi pakai endpoint ini ──────────────────────────────
  async scan(dto: ScanDto) {
    const { employeeId, locationId, sessionType, scanMethod, note } = dto
    const scannedAt = new Date(dto.scannedAt)

    // 1. Validasi karyawan
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true, location: true },
    })
    if (!employee) throw new NotFoundException('EMPLOYEE_NOT_FOUND')
    if (!employee.isActive) throw new ForbiddenException('INACTIVE_EMPLOYEE')
    if (employee.locationId !== locationId)
      throw new BadRequestException('WRONG_LOCATION')

    // 2. Ambil jadwal lokasi
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { locationId },
    })
    if (!schedule) throw new NotFoundException('SCHEDULE_NOT_FOUND')

    // 3. Hitung tanggal hari ini di timezone lokasi
    const tz = employee.location.timezone
    const zonedNow = toZonedTime(scannedAt, tz)
    const today = startOfDay(zonedNow)

    // 4. Validasi window waktu
    const window = this.getWindow(schedule, sessionType)
    const windowStart = this.parseTime(today, window.start, tz)
    const windowEnd   = this.parseTime(today, window.end, tz)

    if (isBefore(scannedAt, windowStart) || isAfter(scannedAt, windowEnd)) {
      throw new BadRequestException({
        code: 'OUTSIDE_WINDOW',
        message: `Sesi ${sessionType} hanya bisa di-scan antara ${window.start} - ${window.end}`,
        window,
      })
    }

    // 5. Cek wajib absen datang dulu (untuk sesi makan)
    if (sessionType !== SessionType.CHECK_IN) {
      const checkedIn = await this.prisma.attendanceSession.findUnique({
        where: {
          employeeId_date_sessionType: {
            employeeId,
            date: today,
            sessionType: SessionType.CHECK_IN,
          },
        },
      })
      if (!checkedIn) {
        throw new BadRequestException({
          code: 'NOT_CHECKED_IN',
          message: 'Anda harus absen datang terlebih dahulu',
        })
      }
    }

    // 6. Hitung keterlambatan (hanya untuk CHECK_IN)
    let isLate = false
    let lateMinutes = 0
    if (sessionType === SessionType.CHECK_IN) {
      const deadline = this.parseTime(today, schedule.checkInDeadline, tz)
      lateMinutes = Math.max(0, differenceInMinutes(scannedAt, deadline))
      isLate = lateMinutes > 0
    }

    // 7. Insert — unique constraint database sebagai safety net terakhir
    try {
      const session = await this.prisma.attendanceSession.create({
        data: {
          employeeId,
          locationId,
          date: today,
          sessionType,
          scannedAt,
          scanMethod: scanMethod ?? ScanMethod.QR,
          isLate,
          lateMinutes,
          note,
        },
        include: {
          employee: {
            select: { name: true, nik: true, department: { select: { name: true } } },
          },
        },
      })

      // 8. Update daily summary
      await this.updateDailySummary(employeeId, locationId, today, sessionType)

      return {
        success: true,
        message: this.successMessage(sessionType, isLate, lateMinutes),
        data: session,
      }

    } catch (err: any) {
      // P2002 = Prisma unique constraint violation
      if (err.code === 'P2002') {
        // Ambil data scan sebelumnya untuk ditampilkan
        const existing = await this.prisma.attendanceSession.findUnique({
          where: {
            employeeId_date_sessionType: { employeeId, date: today, sessionType },
          },
        })
        throw new ConflictException({
          code: 'ALREADY_SCANNED',
          message: `Anda sudah scan ${this.sessionLabel(sessionType)} hari ini`,
          previousScan: existing?.scannedAt,
        })
      }
      throw err
    }
  }

  // ── Status harian semua karyawan per lokasi ──────────────────────────────────
  async getDailyStatus(locationId: number, date: string) {
    const targetDate = new Date(date)

    const employees = await this.prisma.employee.findMany({
      where: { locationId, isActive: true },
      include: { department: true },
    })

    const summaries = await this.prisma.dailySummary.findMany({
      where: { locationId, date: targetDate },
    })

    const summaryMap = new Map(summaries.map(s => [s.employeeId, s]))

    return employees.map(emp => {
      const summary = summaryMap.get(emp.id)
      return {
        employeeId: emp.id,
        nik: emp.nik,
        name: emp.name,
        department: emp.department.name,
        sessions: {
          checkIn:   summary?.checkInDone   ?? false,
          breakfast: summary?.breakfastDone ?? false,
          lunch:     summary?.lunchDone     ?? false,
          dinner:    summary?.dinnerDone    ?? false,
        },
        allComplete: summary?.allComplete ?? false,
      }
    })
  }

  // ── Laporan dengan filter ─────────────────────────────────────────────────────
  async getReport(filter: {
    dateFrom: string
    dateTo: string
    locationId?: number
    departmentId?: number
    employeeId?: number
  }) {
    const sessions = await this.prisma.attendanceSession.findMany({
      where: {
        date: {
          gte: new Date(filter.dateFrom),
          lte: new Date(filter.dateTo),
        },
        ...(filter.locationId && { locationId: filter.locationId }),
        ...(filter.employeeId && { employeeId: filter.employeeId }),
        ...(filter.departmentId && {
          employee: { departmentId: filter.departmentId },
        }),
      },
      include: {
        employee: {
          select: {
            name: true,
            nik: true,
            department: { select: { name: true } },
            location: { select: { name: true } },
          },
        },
      },
      orderBy: [{ date: 'desc' }, { scannedAt: 'asc' }],
    })

    return sessions
  }

  // ── Rekap bulanan per karyawan ────────────────────────────────────────────────
  async getMonthlySummary(employeeId: number, year: number, month: number) {
    const dateFrom = new Date(year, month - 1, 1)
    const dateTo   = new Date(year, month, 0)  // hari terakhir bulan

    const summaries = await this.prisma.dailySummary.findMany({
      where: { employeeId, date: { gte: dateFrom, lte: dateTo } },
      orderBy: { date: 'asc' },
    })

    const totalDays    = summaries.length
    const completeDays = summaries.filter(s => s.allComplete).length
    const checkInCount = summaries.filter(s => s.checkInDone).length
    const breakfastCount = summaries.filter(s => s.breakfastDone).length
    const lunchCount   = summaries.filter(s => s.lunchDone).length
    const dinnerCount  = summaries.filter(s => s.dinnerDone).length

    return {
      employeeId,
      period: { year, month },
      stats: {
        totalWorkDays:   totalDays,
        completeDays,
        incompleteDays:  totalDays - completeDays,
        checkIn:         checkInCount,
        breakfast:       breakfastCount,
        lunch:           lunchCount,
        dinner:          dinnerCount,
      },
      daily: summaries,
    }
  }

  // ── Helper: update daily summary setelah setiap scan ─────────────────────────
  private async updateDailySummary(
    employeeId: number,
    locationId: number,
    date: Date,
    sessionType: SessionType,
  ) {
    const fieldMap: Record<SessionType, string> = {
      CHECK_IN:  'checkInDone',
      BREAKFAST: 'breakfastDone',
      LUNCH:     'lunchDone',
      DINNER:    'dinnerDone',
    }

    // Upsert daily summary
    const current = await this.prisma.dailySummary.upsert({
      where: { employeeId_date: { employeeId, date } },
      create: {
        employeeId,
        locationId,
        date,
        [fieldMap[sessionType]]: true,
      },
      update: {
        [fieldMap[sessionType]]: true,
      },
    })

    // Cek apakah semua 4 sesi sudah done
    const allComplete =
      current.checkInDone &&
      current.breakfastDone &&
      current.lunchDone &&
      current.dinnerDone

    if (allComplete && !current.allComplete) {
      await this.prisma.dailySummary.update({
        where: { id: current.id },
        data: { allComplete: true },
      })
    }
  }

  // ── Helper: ambil window waktu berdasarkan session type ──────────────────────
  private getWindow(
    schedule: any,
    sessionType: SessionType,
  ): { start: string; end: string } {
    const map: Record<SessionType, { start: string; end: string }> = {
      CHECK_IN:  { start: schedule.checkInStart,   end: schedule.checkInDeadline },
      BREAKFAST: { start: schedule.breakfastStart, end: schedule.breakfastEnd },
      LUNCH:     { start: schedule.lunchStart,     end: schedule.lunchEnd },
      DINNER:    { start: schedule.dinnerStart,    end: schedule.dinnerEnd },
    }
    return map[sessionType]
  }

  // ── Helper: parse "HH:mm" ke Date object ─────────────────────────────────────
  private parseTime(baseDate: Date, timeStr: string, tz: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const d = new Date(baseDate)
    d.setHours(hours, minutes, 0, 0)
    return d
  }

  // ── Helper: pesan sukses ──────────────────────────────────────────────────────
  private successMessage(
    sessionType: SessionType,
    isLate: boolean,
    lateMinutes: number,
  ): string {
    const label = this.sessionLabel(sessionType)
    if (sessionType === SessionType.CHECK_IN && isLate)
      return `Absen datang berhasil — terlambat ${lateMinutes} menit`
    return `${label} berhasil dicatat`
  }

  private sessionLabel(sessionType: SessionType): string {
    const labels: Record<SessionType, string> = {
      CHECK_IN:  'Absen datang',
      BREAKFAST: 'Makan pagi',
      LUNCH:     'Makan siang',
      DINNER:    'Makan sore',
    }
    return labels[sessionType]
  }
}
```

### 7.4 Attendance Controller

`src/attendance/attendance.controller.ts`

```typescript
import { Controller, Post, Get, Body, Query, Param, ParseIntPipe } from '@nestjs/common'
import { AttendanceService } from './attendance.service'
import { ScanDto } from './dto/scan.dto'
import { ApiTags, ApiOperation } from '@nestjs/swagger'

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('scan')
  @ApiOperation({ summary: 'Scan semua sesi: datang, makan pagi, siang, sore' })
  scan(@Body() dto: ScanDto) {
    return this.service.scan(dto)
  }

  @Get('daily')
  @ApiOperation({ summary: 'Status harian semua karyawan per lokasi' })
  getDailyStatus(
    @Query('location_id', ParseIntPipe) locationId: number,
    @Query('date') date: string,
  ) {
    return this.service.getDailyStatus(locationId, date)
  }

  @Get('report')
  @ApiOperation({ summary: 'Laporan absensi dengan filter' })
  getReport(
    @Query('date_from') dateFrom: string,
    @Query('date_to')   dateTo: string,
    @Query('location_id') locationId?: string,
    @Query('department_id') departmentId?: string,
    @Query('employee_id') employeeId?: string,
  ) {
    return this.service.getReport({
      dateFrom,
      dateTo,
      locationId:   locationId   ? parseInt(locationId)   : undefined,
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      employeeId:   employeeId   ? parseInt(employeeId)   : undefined,
    })
  }

  @Get('employee/:id/summary')
  @ApiOperation({ summary: 'Rekap bulanan per karyawan' })
  getMonthlySummary(
    @Param('id', ParseIntPipe) id: number,
    @Query('year')  year:  string,
    @Query('month') month: string,
  ) {
    return this.service.getMonthlySummary(id, parseInt(year), parseInt(month))
  }
}
```

### 7.5 Attendance Module

`src/attendance/attendance.module.ts`

```typescript
import { Module } from '@nestjs/common'
import { AttendanceController } from './attendance.controller'
import { AttendanceService } from './attendance.service'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService, PrismaService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
```

---

## 8. Konfigurasi & Environment

Buat file `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/absensi_db"

# App
PORT=3000
NODE_ENV=development

# Timezone default
DEFAULT_TIMEZONE=Asia/Jakarta
```

Buat file `.env.example` untuk dokumentasi:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=3000
NODE_ENV=development
DEFAULT_TIMEZONE=Asia/Jakarta
```

---

## 9. Migrasi Database

```bash
# Install Prisma CLI
npm install -D prisma

# Inisialisasi Prisma (jika belum)
npx prisma init

# Buat migrasi pertama
npx prisma migrate dev --name init_absensi

# Generate Prisma Client
npx prisma generate

# Seed data awal (opsional)
npx prisma db seed
```

### Seed data awal

Buat file `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Buat department
  const produksi = await prisma.department.upsert({
    where: { code: 'PROD' },
    update: {},
    create: { name: 'Produksi', code: 'PROD' },
  })

  const admin = await prisma.department.upsert({
    where: { code: 'ADM' },
    update: {},
    create: { name: 'Administrasi', code: 'ADM' },
  })

  // Buat lokasi
  const kantor = await prisma.location.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Kantor Pusat',
      address: 'Jl. Contoh No. 1, Bandung',
      timezone: 'Asia/Jakarta',
    },
  })

  // Buat jadwal untuk lokasi
  await prisma.workSchedule.upsert({
    where: { locationId: kantor.id },
    update: {},
    create: {
      locationId: kantor.id,
      checkInStart:    '07:00',
      checkInDeadline: '08:00',
      breakfastStart:  '06:30',
      breakfastEnd:    '08:30',
      lunchStart:      '11:30',
      lunchEnd:        '13:00',
      dinnerStart:     '16:30',
      dinnerEnd:       '18:00',
    },
  })

  // Buat karyawan contoh
  await prisma.employee.upsert({
    where: { nik: 'EMP-001' },
    update: {},
    create: {
      nik:          'EMP-001',
      name:         'Budi Santoso',
      position:     'Staff Produksi',
      departmentId: produksi.id,
      locationId:   kantor.id,
    },
  })

  console.log('Seed selesai.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Tambahkan ke `package.json`:

```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

---

## 10. Testing Skenario

### Skenario normal — karyawan lengkap semua sesi

```bash
# 1. Absen datang (07:45)
curl -X POST http://localhost:3000/attendance/scan \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": 1,
    "locationId": 1,
    "sessionType": "CHECK_IN",
    "scannedAt": "2025-05-22T00:45:00Z"
  }'
# Response 201: { success: true, message: "Absen datang berhasil dicatat" }

# 2. Makan pagi (07:50)
curl -X POST http://localhost:3000/attendance/scan \
  -d '{ "employeeId": 1, "locationId": 1, "sessionType": "BREAKFAST", "scannedAt": "2025-05-22T00:50:00Z" }'
# Response 201: { success: true, message: "Makan pagi berhasil dicatat" }

# 3. Coba makan pagi lagi (duplikat) — harus ditolak
curl -X POST http://localhost:3000/attendance/scan \
  -d '{ "employeeId": 1, "locationId": 1, "sessionType": "BREAKFAST", "scannedAt": "2025-05-22T00:55:00Z" }'
# Response 409: { code: "ALREADY_SCANNED", message: "Anda sudah scan Makan pagi hari ini" }

# 4. Makan siang (12:10)
curl -X POST http://localhost:3000/attendance/scan \
  -d '{ "employeeId": 1, "locationId": 1, "sessionType": "LUNCH", "scannedAt": "2025-05-22T05:10:00Z" }'
# Response 201: OK

# 5. Makan sore (17:15)
curl -X POST http://localhost:3000/attendance/scan \
  -d '{ "employeeId": 1, "locationId": 1, "sessionType": "DINNER", "scannedAt": "2025-05-22T10:15:00Z" }'
# Response 201: OK
```

### Skenario error — makan sebelum absen datang

```bash
curl -X POST http://localhost:3000/attendance/scan \
  -d '{ "employeeId": 2, "locationId": 1, "sessionType": "LUNCH", "scannedAt": "2025-05-22T05:00:00Z" }'
# Response 400: { code: "NOT_CHECKED_IN", message: "Anda harus absen datang terlebih dahulu" }
```

### Skenario error — scan di luar window waktu

```bash
curl -X POST http://localhost:3000/attendance/scan \
  -d '{ "employeeId": 1, "locationId": 1, "sessionType": "BREAKFAST", "scannedAt": "2025-05-22T03:00:00Z" }'
# Response 400: { code: "OUTSIDE_WINDOW", message: "Sesi BREAKFAST hanya bisa di-scan antara 06:30 - 08:30" }
```

### Cek status harian

```bash
curl "http://localhost:3000/attendance/daily?location_id=1&date=2025-05-22"
# Response: array status semua karyawan di lokasi 1 hari ini
```

### Laporan bulanan karyawan

```bash
curl "http://localhost:3000/attendance/employee/1/summary?year=2025&month=5"
# Response: rekap semua sesi selama Mei 2025 untuk karyawan ID 1
```

---

## Catatan Implementasi

- Install tambahan untuk timezone: `npm install date-fns-tz`
- Untuk production: tambahkan JWT auth guard di semua endpoint
- QR code karyawan (`qrCode` field) bisa di-generate dengan library `qrcode`
- Swagger tersedia di `http://localhost:3000/api` setelah setup `SwaggerModule`
- Tambahkan rate limiting di endpoint `/attendance/scan` untuk mencegah spam request