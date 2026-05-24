-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('CHECK_IN', 'BREAKFAST', 'LUNCH', 'DINNER');

-- CreateEnum
CREATE TYPE "ScanMethod" AS ENUM ('QR', 'RFID', 'MANUAL');

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedules" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "checkInStart" TEXT NOT NULL DEFAULT '07:00',
    "checkInDeadline" TEXT NOT NULL DEFAULT '09:00',
    "breakfastStart" TEXT NOT NULL DEFAULT '06:30',
    "breakfastEnd" TEXT NOT NULL DEFAULT '08:30',
    "lunchStart" TEXT NOT NULL DEFAULT '11:30',
    "lunchEnd" TEXT NOT NULL DEFAULT '13:00',
    "dinnerStart" TEXT NOT NULL DEFAULT '16:30',
    "dinnerEnd" TEXT NOT NULL DEFAULT '18:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "nik" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "departmentId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "qrCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL,
    "scanMethod" "ScanMethod" NOT NULL DEFAULT 'QR',
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_summaries" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "checkInDone" BOOLEAN NOT NULL DEFAULT false,
    "breakfastDone" BOOLEAN NOT NULL DEFAULT false,
    "lunchDone" BOOLEAN NOT NULL DEFAULT false,
    "dinnerDone" BOOLEAN NOT NULL DEFAULT false,
    "allComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "work_schedules_locationId_key" ON "work_schedules"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_nik_key" ON "employees"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "employees_qrCode_key" ON "employees"("qrCode");

-- CreateIndex
CREATE INDEX "employees_departmentId_idx" ON "employees"("departmentId");

-- CreateIndex
CREATE INDEX "employees_locationId_idx" ON "employees"("locationId");

-- CreateIndex
CREATE INDEX "attendance_sessions_date_locationId_idx" ON "attendance_sessions"("date", "locationId");

-- CreateIndex
CREATE INDEX "attendance_sessions_employeeId_date_idx" ON "attendance_sessions"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sessions_employeeId_date_sessionType_key" ON "attendance_sessions"("employeeId", "date", "sessionType");

-- CreateIndex
CREATE INDEX "daily_summaries_date_locationId_idx" ON "daily_summaries"("date", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_summaries_employeeId_date_key" ON "daily_summaries"("employeeId", "date");

-- AddForeignKey
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_summaries" ADD CONSTRAINT "daily_summaries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_summaries" ADD CONSTRAINT "daily_summaries_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
