"use client" 

import type React from "react"
import { useEffect, useState } from "react"; // Importar useState
import { SidebarNav } from "@/components/layout/sidebar"
import { auth } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext" 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. LLAMAR A TODOS LOS HOOKS INCONDICIONALMENTE EN LA PARTE SUPERIOR
  const [firebaseUser, firebaseLoading, firebaseError] = useAuthState(auth);
  const { user: authContextUser, loading: authContextLoading } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false); // Nuevo estado para controlar el montaje en cliente

  // 2. EFECTO PARA ESTABLECER isMounted A TRUE SOLO EN EL CLIENTE
  useEffect(() => {
    setIsMounted(true);
  }, []); // Este efecto se ejecuta solo una vez en el cliente después del montaje inicial

  // 3. EFECTO PARA MANEJAR LA REDIRECCIÓN (se ejecuta solo en el cliente después del montaje)
  useEffect(() => {
    // No hacer nada hasta que el componente esté montado en el cliente
    if (!isMounted) {
      console.log("[DashboardLayout useEffect Redirection] No montado aún, esperando.");
      return; 
    }

    // Logs para depuración del estado de autenticación cuando cambian las dependencias
    console.log("[DashboardLayout useEffect Redirection] Dependencias cambiadas. Firebase State:", { firebaseUserLoading: firebaseLoading, firebaseUserExists: !!firebaseUser, firebaseError });
    console.log("[DashboardLayout useEffect Redirection] AuthContext State:", { authContextUserLoading: authContextLoading, authContextUserExists: !!authContextUser });

    // Solo actuar cuando ambos estados de carga hayan finalizado
    if (!firebaseLoading && !authContextLoading) {
      if (firebaseError) {
        console.error("[DashboardLayout useEffect Redirection] Error de autenticación de Firebase:", firebaseError);
        // Considera redirigir a una página de error o a login.
        // Ejemplo: router.push('/login?error=firebase_auth_failed');
        return; // No continuar si hay error de Firebase
      }

      if (!authContextUser) {
        // Si después de cargar todo, no hay usuario en nuestro AuthContext, redirigir a login.
        console.log("[DashboardLayout useEffect Redirection] Carga finalizada, sin usuario en AuthContext. Redirigiendo a /login.");
        router.push("/login");
      } else {
        // Usuario autenticado y datos cargados, no hacer nada, permitir renderizado.
        console.log("[DashboardLayout useEffect Redirection] Usuario autenticado y datos cargados. Permitiendo renderizado del dashboard.");
      }
    } else {
      console.log("[DashboardLayout useEffect Redirection] Aún cargando (firebaseLoading || authContextLoading). Esperando...");
    }
  }, [isMounted, firebaseUser, firebaseLoading, firebaseError, authContextUser, authContextLoading, router]);


  // 4. LÓGICA DE RENDERIZADO
  
  // Antes de que el componente se monte en el cliente, renderizar un loader básico y consistente
  // para evitar el mismatch de hidratación. El servidor no renderizará el contenido dinámico complejo.
  if (!isMounted) {
    console.log("[DashboardLayout Render] No montado aún (SSR o primer render cliente). Renderizando loader de inicialización.");
    return (
        <div className="flex items-center justify-center w-full h-screen bg-gray-100 text-gray-700">
            Inicializando aplicación...
        </div>
    );
  }

  // Una vez montado, la lógica de carga y error se aplica
  if (firebaseLoading || authContextLoading) {
    console.log("[DashboardLayout Render] Montado. Mostrando estado de carga global (firebaseLoading || authContextLoading)...");
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-100 text-gray-700">
        Cargando sesión, por favor espera...
      </div>
    );
  }

  if (firebaseError) {
    console.error("[DashboardLayout Render] Montado. Mostrando error de Firebase Auth:", firebaseError);
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-red-50 text-red-700 p-4">
        <h2 className="text-xl font-semibold mb-2">Error de Autenticación</h2>
        <p>Ocurrió un problema al verificar tu sesión con Firebase.</p>
        <p className="text-sm mt-1">Detalle: {firebaseError.message}</p>
        <button 
          onClick={() => router.push('/login')} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Ir a Login
        </button>
      </div>
    );
  }

  // Si hemos llegado aquí, y el useEffect aún no ha redirigido (o no necesita hacerlo),
  // pero authContextUser es null (lo cual el useEffect debería haber capturado y manejado).
  if (!authContextUser) {
    console.log("[DashboardLayout Render] Montado. No hay usuario en AuthContext (useEffect debería haber redirigido). Mostrando loader de redirección.");
    // El useEffect ya debería haber iniciado la redirección.
    // Devolver el loader evita un flash de contenido vacío antes de la redirección.
    return (
        <div className="flex items-center justify-center w-full h-screen bg-gray-100 text-gray-700">
            Redirigiendo a login...
        </div>
    );
  }

  // Si todo está bien (montado, no cargando, sin errores, y hay usuario en AuthContext), renderizar el dashboard.
  console.log("[DashboardLayout Render] Montado. Usuario autenticado. Renderizando contenido del dashboard para:", authContextUser.correo);
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100/50"> 
      <SidebarNav /> 
      <main className="flex-1 overflow-x-hidden overflow-y-auto w-full"> 
        {children} 
      </main>
    </div>
  );
}
