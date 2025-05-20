"use client" 

import type React from "react"
import { useEffect, useState } from "react";
import { SidebarNav } from "@/components/layout/sidebar"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. LLAMAR A TODOS LOS HOOKS INCONDICIONALMENTE EN LA PARTE SUPERIOR
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // 2. Efecto para manejar el estado de montaje
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // 3. Efecto para manejar la autenticación y redirección
  useEffect(() => {
    if (!isMounted || loading) return;

    console.log("[DashboardLayout Effect] Verificando estado de autenticación...");
    
    if (!user) {
      console.log("[DashboardLayout Effect] Usuario no autenticado. Redirigiendo a login...");
      router.push("/login");
      return;
    }

    console.log("[DashboardLayout Effect] Usuario autenticado. Permaneciendo en dashboard.");
  }, [isMounted, user, loading, router]);


  // 4. LÓGICA DE RENDERIZADO

  // Antes de que el componente se monte en el cliente, renderizar un loader básico y consistente
  // para evitar el mismatch de hidratación. El servidor no renderizará el contenido dinámico complejo.
  if (!isMounted) {
    console.log("[DashboardLayout Render] No montado aún (SSR o primer render cliente). Renderizando loader de inicialización.");
    return (
        <div className="flex items-center justify-center w-full h-screen bg-background text-foreground">
            Inicializando aplicación...
        </div>
    );
  }

  // Mostrar loader si está cargando
  if (loading) {
    console.log("[DashboardLayout Render] Mostrando estado de carga...");
    return (
      <div className="flex items-center justify-center w-full h-screen bg-background text-foreground">
        Cargando sesión, por favor espera...
      </div>
    );
  }

  // Si no hay usuario, mostrar loader de redirección
  if (!user) {
    console.log("[DashboardLayout Render] No hay usuario. Mostrando loader de redirección.");
    return (
      <div className="flex items-center justify-center w-full h-screen bg-background text-foreground">
        Redirigiendo a login...
      </div>
    );
  }

  // Si todo está bien, renderizar el dashboard
  console.log("[DashboardLayout Render] Usuario autenticado. Renderizando contenido del dashboard para:", user.correo);
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarNav />
      <main className="flex-1 overflow-x-hidden overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
