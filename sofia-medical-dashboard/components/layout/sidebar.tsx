import type React from "react"
import Link from "next/link" // Importar Link
import { useAuth } from "@/context/AuthContext" // Importar useAuth
import { useRouter } from "next/navigation" // Importar useRouter

export function SidebarNav({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth(); // Obtener la función logout del AuthContext
  const router = useRouter(); // Obtener el router

  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // Prevenir la navegación por defecto del enlace
    await logout(); // Llamar a la función de logout del AuthContext
    // La redirección a "/" se maneja dentro de la función logout en AuthContext
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
        {/* Logo and user info */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <img src="/Logo_sofia.png" alt="SOFIA AI" className="h-8" />
            <div>
              <h2 className="font-bold text-teal-800">SOFIA AI</h2>
              <p className="text-xs text-gray-500">Medical Assistant</p>
            </div>
          </div>

          {/* User profile */}
          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-medium">
              DR
            </div>
            <div>
              <div className="font-medium">Dr. Rodriguez</div>
              <div className="text-xs text-gray-500">Médico especialista</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">PRINCIPAL</h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/nuevo-diagnostico"
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Diagnóstico
                </Link>
              </li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">GESTIÓN</h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard/historial"
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Historial
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/pacientes"
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Pacientes
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/configuracion"
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Configuración
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <a
            href="#"
            onClick={handleLogout} // Usar el manejador de logout
            className="flex items-center gap-2 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Cerrar Sesión
          </a>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
