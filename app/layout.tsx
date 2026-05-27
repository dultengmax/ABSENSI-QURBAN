import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./clientLayout"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata: Metadata = {
  title: "Panitia App | Manajemen Qurban",
  description: "Sistem manajemen panitia untuk kehadiran, logistik qurban, dokumentasi, dan QR.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>
        <ClientLayout>{children}</ClientLayout>
        <Toaster />
      </body>
    </html>
  )
}
