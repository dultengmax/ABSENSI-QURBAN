import { ScanMethod, SessionType } from "@prisma/client"
import { z } from "zod"

import { cleanOptionalString, coerceOptionalBoolean } from "@/lib/server-action-utils"

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam harus HH:mm.")
const optionalString = z.preprocess(cleanOptionalString, z.string().trim().optional())
const optionalBoolean = z.preprocess(coerceOptionalBoolean, z.boolean().optional())
const cabangSchema = z.preprocess(cleanOptionalString, z.enum(["1", "2", "3", "4"]).optional())

export const idSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const departmentCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama bagian wajib diisi."),
  code: z.string().trim().min(1, "Kode bagian wajib diisi.").transform((value) => value.toUpperCase()),
})

export const departmentUpdateSchema = idSchema.extend({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).transform((value) => value.toUpperCase()).optional(),
})

export const locationCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama lokasi wajib diisi."),
  address: optionalString,
  timezone: z.string().trim().min(1).default("Asia/Jakarta"),
})

export const locationUpdateSchema = idSchema.extend({
  name: z.string().trim().min(1).optional(),
  address: optionalString,
  timezone: z.string().trim().min(1).optional(),
})

export const workScheduleCreateSchema = z.object({
  locationId: z.coerce.number().int().positive(),
  checkInStart: timeSchema.default("07:00"),
  checkInDeadline: timeSchema.default("09:00"),
  breakfastStart: timeSchema.default("06:30"),
  breakfastEnd: timeSchema.default("08:30"),
  lunchStart: timeSchema.default("11:30"),
  lunchEnd: timeSchema.default("13:00"),
  dinnerStart: timeSchema.default("16:30"),
  dinnerEnd: timeSchema.default("18:00"),
})

export const workScheduleUpdateSchema = idSchema.extend({
  locationId: z.coerce.number().int().positive().optional(),
  checkInStart: timeSchema.optional(),
  checkInDeadline: timeSchema.optional(),
  breakfastStart: timeSchema.optional(),
  breakfastEnd: timeSchema.optional(),
  lunchStart: timeSchema.optional(),
  lunchEnd: timeSchema.optional(),
  dinnerStart: timeSchema.optional(),
  dinnerEnd: timeSchema.optional(),
})

export const employeeCreateSchema = z.object({
  nik: z.string().trim().min(1, "NIK wajib diisi."),
  name: z.string().trim().min(1, "Nama karyawan wajib diisi."),
  position: optionalString,
  phone: optionalString,
  cabang: cabangSchema,
  isActive: optionalBoolean.default(true),
  departmentId: z.coerce.number().int().positive(),
  locationId: z.coerce.number().int().positive(),
  qrCode: optionalString,
})

export const employeeUpdateSchema = idSchema.extend({
  nik: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  position: optionalString,
  phone: optionalString,
  cabang: cabangSchema,
  isActive: optionalBoolean,
  departmentId: z.coerce.number().int().positive().optional(),
  locationId: z.coerce.number().int().positive().optional(),
  qrCode: optionalString,
})

export const attendanceSessionCreateSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  locationId: z.coerce.number().int().positive(),
  date: z.coerce.date(),
  sessionType: z.nativeEnum(SessionType),
  scannedAt: z.coerce.date(),
  scanMethod: z.nativeEnum(ScanMethod).default("QR"),
  isLate: optionalBoolean.default(false),
  lateMinutes: z.coerce.number().int().min(0).default(0),
  note: optionalString,
})

export const attendanceSessionUpdateSchema = idSchema.extend({
  employeeId: z.coerce.number().int().positive().optional(),
  locationId: z.coerce.number().int().positive().optional(),
  date: z.coerce.date().optional(),
  sessionType: z.nativeEnum(SessionType).optional(),
  scannedAt: z.coerce.date().optional(),
  scanMethod: z.nativeEnum(ScanMethod).optional(),
  isLate: optionalBoolean,
  lateMinutes: z.coerce.number().int().min(0).optional(),
  note: optionalString,
})

export const dailySummaryCreateSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  locationId: z.coerce.number().int().positive(),
  date: z.coerce.date(),
  checkInDone: optionalBoolean.default(false),
  breakfastDone: optionalBoolean.default(false),
  lunchDone: optionalBoolean.default(false),
  dinnerDone: optionalBoolean.default(false),
  allComplete: optionalBoolean.default(false),
})

export const dailySummaryUpdateSchema = idSchema.extend({
  employeeId: z.coerce.number().int().positive().optional(),
  locationId: z.coerce.number().int().positive().optional(),
  date: z.coerce.date().optional(),
  checkInDone: optionalBoolean,
  breakfastDone: optionalBoolean,
  lunchDone: optionalBoolean,
  dinnerDone: optionalBoolean,
  allComplete: optionalBoolean,
})
