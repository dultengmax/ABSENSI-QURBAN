"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Calendar, Camera, Home, MilkIcon as Cow, QrCode, ScanLine, User } from "lucide-react"

const navigation = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/attendance", label: "Kehadiran Panitia", icon: Calendar },
  { href: "/qurban", label: "Logistik Qurban", icon: Cow },
  { href: "/documentation", label: "Dokumentasi", icon: Camera },
  { href: "/qr-scanner", label: "Scan QR", icon: ScanLine },
  { href: "/qr-generator", label: "Generate QR", icon: QrCode },
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentPage = navigation.find((item) => item.href === pathname) ?? navigation[0]

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-sidebar-border/80">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-500 text-sm font-bold text-white shadow-sm shadow-emerald-900/20">
              P
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">Panitia App</p>
              <p className="truncate text-xs text-sidebar-foreground/60">Operasi Qurban</p>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-3 py-2">
          <SidebarMenu className="gap-1.5">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={isActive}
                    className="h-11 rounded-lg px-3 text-sidebar-foreground/80 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-11 rounded-lg px-3 text-sidebar-foreground/75">
                <User className="h-4 w-4" />
                <span>Profil Panitia</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarRail />
      <SidebarInset className="min-w-0 bg-transparent">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <SidebarTrigger className="h-9 w-9 rounded-lg border border-border bg-card shadow-sm" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Sistem Manajemen Panitia</p>
              <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">{currentPage.label}</h1>
            </div>
            <div className="ml-auto hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Mode operasional
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
