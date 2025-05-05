"use client" // Añadir la directiva "use client"

import type React from "react"
import { SidebarNav } from "@/components/layout/sidebar"
import { auth } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { redirect } from "next/navigation"
import { useAuth } from "@/context/AuthContext" // Importar useAuth

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [firebaseUser, firebaseLoading, firebaseError] = useAuthState(auth)
  const { user: authContextUser, loading: authContextLoading } = useAuth() // Obtener estado del AuthContext

  console.log("DashboardLayout Firebase Auth State:", { firebaseUser, firebaseLoading, firebaseError }) // Log para depurar Firebase state
  console.log("DashboardLayout AuthContext State:", { authContextUser, authContextLoading }) // Log para depurar AuthContext state

  // Si AuthContext está cargando, mostrar loading. También consideramos firebaseLoading para la carga inicial.
  if (firebaseLoading || authContextLoading) {
    console.log("Mostrando loading:", { firebaseLoading, authContextLoading });
    return <div className="flex items-center justify-center w-full h-screen">Loading...</div>
  }

  // Si hay un error en Firebase Auth, mostrar error
  if (firebaseError) {
    console.error("Error de Firebase Auth:", firebaseError);
    return <div>Error: {firebaseError.message}</div>
  }

  // Log adicional antes de la condición de redirección
  console.log("Evaluando redirección en DashboardLayout:", { firebaseLoading, authContextLoading, authContextUser });

  // Si la carga ha terminado (ambos loading son false) Y no hay usuario en AuthContext, redirigir a login
  // authContextUser es la fuente de verdad para la sesión después del login exitoso
  if (!firebaseLoading && !authContextLoading && !authContextUser) {
    console.log("Carga finalizada y no hay usuario autenticado en AuthContext, redirigiendo a login.");
    redirect("/login");
  }

  // Si hay usuario en AuthContext, renderizar el contenido
  console.log("Usuario autenticado, renderizando contenido:", authContextUser);
  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav>
      <div className="flex-1 overflow-auto">{children}</div>
      </SidebarNav>
    </div>
  )
}
