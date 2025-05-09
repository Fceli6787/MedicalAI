"use client" 

import type React from "react"
import { SidebarNav } from "@/components/layout/sidebar" // Importa el componente SidebarNav modificado
import { auth } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { redirect } from "next/navigation"
import { useAuth } from "@/context/AuthContext" 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [firebaseUser, firebaseLoading, firebaseError] = useAuthState(auth)
  const { user: authContextUser, loading: authContextLoading } = useAuth() 

  console.log("DashboardLayout Firebase Auth State:", { firebaseUser, firebaseLoading, firebaseError }) 
  console.log("DashboardLayout AuthContext State:", { authContextUser, authContextLoading }) 

  if (firebaseLoading || authContextLoading) {
    console.log("Mostrando loading:", { firebaseLoading, authContextLoading });
    return <div className="flex items-center justify-center w-full h-screen">Cargando sesión...</div> 
  }

  if (firebaseError) {
    console.error("Error de Firebase Auth:", firebaseError);
    return <div>Error de autenticación: {firebaseError.message}</div> 
  }

  console.log("Evaluando redirección en DashboardLayout:", { firebaseLoading, authContextLoading, authContextUser });

  if (!firebaseLoading && !authContextLoading && !authContextUser) {
    console.log("Carga finalizada y no hay usuario autenticado en AuthContext, redirigiendo a login.");
    redirect("/login");
    return null; 
  }

  console.log("Usuario autenticado, renderizando contenido:", authContextUser);
  return (
    // *** CORRECCIÓN: Renderizar SidebarNav y main como hermanos ***
    <div className="flex h-screen overflow-hidden bg-gray-100/50"> 
      {/* Renderiza solo la barra lateral */}
      <SidebarNav /> 
      
      {/* Renderiza el contenido principal al lado */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto w-full"> 
        {children} 
      </main>
    </div>
  )
}
