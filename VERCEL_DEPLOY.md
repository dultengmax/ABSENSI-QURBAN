# Deploy ke Vercel

## Environment Variables

Tambahkan env berikut di Vercel Project Settings:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DEFAULT_TIMEZONE="Asia/Jakarta"
```

`DATABASE_URL` harus mengarah ke PostgreSQL yang bisa diakses dari Vercel.

## Build

Project ini sudah men-generate Prisma Client saat install/build:

```bash
npm run build
```

## Database

Jalankan migration ke database production sebelum dipakai:

```bash
npx prisma migrate deploy
```

Jangan menjalankan `npm run db:seed` di production jika sudah ada data employee, karena seed project ini mengosongkan employee dan riwayat scan sebelum membuat master data.

## Master Departemen

Data departemen terbaru sudah ada di `prisma/seed.ts`. Kalau perlu sinkronisasi manual, pastikan tidak menghapus employee yang masih mereferensikan departemen.
