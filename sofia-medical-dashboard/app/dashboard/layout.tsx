"use client"; // Añadir la directiva "use client"

import type React from "react";
import { SidebarNav } from "@/components/layout/sidebar";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { redirect } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; // Importar useAuth

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebaseUser, firebaseLoading, firebaseError] = useAuthState(auth);
  const { user: authContextUser, loading: authContextLoading } = useAuth(); // Obtener estado del AuthContext

  console.log('DashboardLayout Firebase Auth State:', { firebaseUser, firebaseLoading, firebaseError }); // Log para depurar Firebase state
  console.log('DashboardLayout AuthContext State:', { authContextUser, authContextLoading }); // Log para depurar AuthContext state


  // Si Firebase está cargando o el AuthContext está cargando, mostrar loading
  if (firebaseLoading || authContextLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        Loading...
      </div>
    );
  }

  // Si hay un error en Firebase Auth, mostrar error
  if (firebaseError) {
    return <div>Error: {firebaseError.message}</div>;
  }

  // Si no hay usuario en AuthContext Y la carga ha terminado, redirigir a login
  // Dependemos principalmente del estado de nuestro AuthContext después del login de backend exitoso
  if (!authContextUser && !authContextLoading) {
    redirect("/login");
  }

  // Si hay usuario en AuthContext, renderizar el contenido
  return <SidebarNav>{children}</SidebarNav>;
}
