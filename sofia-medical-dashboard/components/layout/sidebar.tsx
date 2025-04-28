"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, PlusCircle, History, Users, Settings, HelpCircle, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface SidebarNavProps {
  children: React.ReactNode
}

export function SidebarNav({ children }: SidebarNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(true)

  const handleLogout = () => {
    // Simulación de cierre de sesión
    localStorage.removeItem("auth-token")
    router.push("/login")
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Nuevo Diagnóstico",
      href: "/dashboard/nuevo-diagnostico",
      icon: PlusCircle,
    },
    {
      title: "Historial",
      href: "/dashboard/historial",
      icon: History,
    },
    {
      title: "Pacientes",
      href: "/dashboard/pacientes",
      icon: Users,
    },
    {
      title: "Configuración",
      href: "/dashboard/configuracion",
      icon: Settings,
    },
  ]

  return (
    <SidebarProvider defaultOpen={open} onOpenChange={setOpen}>
      <div className="flex h-screen">
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="h-32 border-b border-gray-200 flex items-center justify-center p-0">
            <div className="flex items-center justify-center w-full">
              <img 
                src="/Logo_sofia.png" 
                alt="SOFIA AI" 
                className="h-28 w-auto max-w-full object-contain" 
              />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link href={item.href} className="flex items-center">
                      <item.icon className="mr-2 h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t border-gray-200">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Ayuda">
                  <Link href="/dashboard/ayuda" className="flex items-center">
                    <HelpCircle className="mr-2 h-5 w-5" />
                    <span>Ayuda</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} tooltip="Cerrar Sesión">
                  <LogOut className="mr-2 h-5 w-5" />
                  <span>Cerrar Sesión</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
            <div className="flex items-center md:hidden">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-medium text-teal-700">
                  DR
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-gray-50 p-4">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}