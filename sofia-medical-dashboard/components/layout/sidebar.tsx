"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Users, 
  Settings, 
  HelpCircle, 
  LogOut,
  Bell,
  Search,
  Menu,
  ChevronRight,
  User
} from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface SidebarNavProps {
  children: React.ReactNode
}

export function SidebarNav({ children }: SidebarNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [userName, setUserName] = useState("Dr. Rodriguez")
  const [userEmail, setUserEmail] = useState("dr.rodriguez@sofiamedical.com")
  const [userRole, setUserRole] = useState("Médico especialista")
  
  // Simulación de obtención de datos de usuario
  useEffect(() => {
    // Aquí se conectaría con una API para obtener datos del usuario
    // Por ahora, usamos valores estáticos
  }, [])

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
      description: "Resumen general",
    },
    {
      title: "Nuevo Diagnóstico",
      href: "/dashboard/nuevo-diagnostico",
      icon: PlusCircle,
      description: "Analizar imagen médica",
    },
    {
      title: "Historial",
      href: "/dashboard/historial",
      icon: History,
      description: "Diagnósticos anteriores",
    },
    {
      title: "Pacientes",
      href: "/dashboard/pacientes",
      icon: Users,
      description: "Gestión de pacientes",
    },
    {
      title: "Configuración",
      href: "/dashboard/configuracion",
      icon: Settings,
      description: "Ajustes del sistema",
    },
  ]

  return (
    <SidebarProvider defaultOpen={open} onOpenChange={setOpen}>
      <div className="flex h-screen">
        <Sidebar className="border-r border-gray-200 bg-white shadow-sm w-72">
          <SidebarHeader className="h-20 border-b border-gray-200 flex items-center p-4">
            <div className="flex items-center gap-2">
              <div className="relative h-10 w-10">
                <Image
                  src="/Logo_sofia.png"
                  alt="SOFIA AI"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-teal-700">SOFIA AI</h1>
                <p className="text-xs text-gray-500">Medical Assistant</p>
              </div>
            </div>
          </SidebarHeader>
          
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 bg-teal-50 rounded-lg p-3 mb-2">
              <Avatar className="h-12 w-12 border-2 border-teal-200">
                <AvatarImage src="/avatar-placeholder.png" alt={userName} />
                <AvatarFallback className="bg-teal-700 text-white">DR</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="font-medium text-teal-800 truncate">{userName}</p>
                <p className="text-xs text-teal-600 truncate">{userRole}</p>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-2">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar..." 
                className="pl-9 py-2 h-9 bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500" 
              />
            </div>
          </div>
          
          <SidebarContent className="px-2">
            <div className="py-1">
              <p className="px-3 py-1 text-xs uppercase font-semibold text-gray-500">Principal</p>
            </div>
            <SidebarMenu>
              {navItems.slice(0, 2).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} className={`px-3 py-2 rounded-lg flex flex-col items-start ${pathname === item.href ? 'bg-teal-50 text-teal-700' : 'hover:bg-gray-50'}`}>
                    <Link href={item.href} className="w-full">
                      <div className="flex items-center mb-1">
                        <item.icon className="mr-3 h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                        {pathname === item.href && <ChevronRight className="ml-auto h-4 w-4" />}
                      </div>
                      <p className="text-xs text-gray-500 pl-8">{item.description}</p>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            
            <div className="py-1 mt-3">
              <p className="px-3 py-1 text-xs uppercase font-semibold text-gray-500">Gestión</p>
            </div>
            <SidebarMenu>
              {navItems.slice(2).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} className={`px-3 py-2 rounded-lg flex flex-col items-start ${pathname === item.href ? 'bg-teal-50 text-teal-700' : 'hover:bg-gray-50'}`}>
                    <Link href={item.href} className="w-full">
                      <div className="flex items-center mb-1">
                        <item.icon className="mr-3 h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                        {pathname === item.href && <ChevronRight className="ml-auto h-4 w-4" />}
                      </div>
                      <p className="text-xs text-gray-500 pl-8">{item.description}</p>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter className="border-t border-gray-200 mt-auto p-4">
            <div className="space-y-3">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="px-3 py-2 rounded-lg hover:bg-gray-50 w-full">
                    <Link href="/dashboard/ayuda" className="flex items-center">
                      <HelpCircle className="mr-3 h-5 w-5 text-gray-500" />
                      <span>Centro de ayuda</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-teal-200 text-teal-700 hover:bg-teal-50 justify-start"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Añadido min-w-0 para asegurar que el contenedor flex pueda encogerse correctamente */}
        <div className="flex flex-1 flex-col min-w-0">
          <main className="flex-1 overflow-auto bg-gray-50 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
