// @/components/layout/sidebar.tsx
"use client"; 

import type React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; 
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';

// Definición de Iconos SVG (mantenidos como en tu código original)
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
  </svg>
);
const NewDiagnosisIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);
const PatientsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
  </svg>
);
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600 dark:text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
  </svg>
);
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
);


export function SidebarNav() { 
  const { user, logout } = useAuth(); 
  const router = useRouter(); 

  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); 
    Swal.fire({
      title: 'Cerrando sesión...',
      text: 'Espera un momento por favor.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: 'dark:bg-gray-800 dark:text-gray-200',
        title: 'dark:text-gray-100',
        htmlContainer: 'dark:text-gray-300',
        confirmButton: 'bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600',
      }
    });
    try {
      await logout(); 
      Swal.close();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cerrar la sesión. Inténtalo de nuevo.',
        customClass: { 
            popup: 'dark:bg-gray-800 dark:text-gray-200',
            title: 'dark:text-red-400', 
            htmlContainer: 'dark:text-gray-300',
            confirmButton: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
        }
      });
    }
  };

  let displayName = "Dr. Usuario";
  let userInitials = "U";
  let userRoleDescription = "Médico";

  if (user) {
    const firstName = user.primer_nombre || "";
    const lastName = user.primer_apellido || "";

    if (lastName) {
      displayName = `Dr. ${lastName}`;
    } else if (firstName) {
      displayName = `Dr. ${firstName}`;
    } else {
      displayName = "Dr. Usuario"; 
    }

    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    
    if (firstInitial && lastInitial) {
      userInitials = `${firstInitial}${lastInitial}`;
    } else if (firstInitial) {
      userInitials = firstInitial;
    } else if (lastInitial) {
      userInitials = lastInitial;
    } else {
      userInitials = "U"; 
    }

    if (user.roles?.includes("medico")) {
      userRoleDescription = "Médico especialista";
    } else if (user.roles?.includes("admin")) {
      userRoleDescription = "Administrador";
    } else if (user.roles?.length > 0) {
      userRoleDescription = user.roles[0].charAt(0).toUpperCase() + user.roles[0].slice(1); 
    } else if (user.rol) { 
        userRoleDescription = user.rol.charAt(0).toUpperCase() + user.rol.slice(1);
    }
  }

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full flex-shrink-0">
      {/* Logo and user info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <img src="/Logo_sofia.png" alt="SOFIA AI" className="h-8" />
          <div>
            <h2 className="font-bold text-teal-600 dark:text-teal-400">SOFIA AI</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Medical Assistant</p>
          </div>
        </div>
        {user && ( 
          <div className="flex items-center gap-3 py-2">
            {/* === CÍRCULO DE INICIALES DEL USUARIO === */}
            {/* Se usan clases estándar de Tailwind para el fondo y texto para asegurar visibilidad. */}
            <div className="w-10 h-10 rounded-full bg-teal-500 dark:bg-teal-600 flex items-center justify-center text-white font-medium text-lg">
              {userInitials} 
            </div>
            {/* === FIN CÍRCULO DE INICIALES === */}
            <div>
              <div className="font-medium text-gray-700 dark:text-gray-200">{displayName}</div> 
              <div className="text-xs text-gray-500 dark:text-gray-400">{userRoleDescription}</div> 
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 dark:placeholder-gray-400"
          />
          <SearchIcon />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">PRINCIPAL</h3>
          <ul className="space-y-1">
            <li>
              <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-150">
                <DashboardIcon /> Dashboard
              </Link>
            </li>
            <li>
              <Link href="/dashboard/nuevo-diagnostico" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-150">
                <NewDiagnosisIcon /> Nuevo Diagnóstico
              </Link>
            </li>
          </ul>
        </div>
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">GESTIÓN</h3>
          <ul className="space-y-1">
            <li>
              <Link href="/dashboard/historial" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-150">
                <HistoryIcon /> Historial
              </Link>
            </li>
            <li>
              <Link href="/dashboard/pacientes" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-150">
                <PatientsIcon /> Pacientes
              </Link>
            </li>
            <li>
              <Link href="/dashboard/configuracion" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-150">
                <SettingsIcon /> Configuración
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <a href="#" onClick={handleLogout} className="group flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-red-100 dark:hover:bg-red-700/50 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150">
          <LogoutIcon /> Cerrar Sesión
        </a>
      </div>
    </div>
  )
}
