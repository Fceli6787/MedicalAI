"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Save, User, Lock, Bell, Database, Shield, Zap } from "lucide-react";

// Definir tipos para los estados para mejor claridad
interface UserFormState {
  nombre: string;
  email: string;
  especialidad: string;
  hospital: string;
  telefono: string;
}

interface NotificacionesState {
  email: boolean;
  sistema: boolean;
  nuevasFunciones: boolean;
  reportesSemanal: boolean;
  reportesMensual: boolean;
}

interface SeguridadState {
  autenticacionDoble: boolean;
  sesionAutomatica: boolean;
  tiempoSesion: string;
}

interface SistemaState {
  temaOscuro: boolean;
  altaResolucion: boolean;
  autoGuardado: boolean;
  tiempoAutoGuardado: string;
}

// Definir tipo para el usuario (ajustar según la estructura real de tu API/contexto)
interface AppUser {
  id_usuario: string;
  primer_nombre: string;
  correo: string;
  rol: string; // 'admin', 'doctor', 'paciente', etc.
  // ... otras propiedades del usuario
}

export default function ConfiguracionPage() {
  // Estados para los formularios de configuración
  const [userForm, setUserForm] = useState<UserFormState>({
    nombre: "Dr. Usuario", // Placeholder data
    email: "doctor@sofia.ai", // Placeholder data
    especialidad: "radiologia", // Placeholder data
    hospital: "Hospital Central", // Placeholder data
    telefono: "+1234567890", // Placeholder data
  });

  const [notificaciones, setNotificaciones] = useState<NotificacionesState>({
    email: true,
    sistema: true,
    nuevasFunciones: true,
    reportesSemanal: false,
    reportesMensual: true,
  });

  const [seguridad, setSeguridad] = useState<SeguridadState>({
    autenticacionDoble: false,
    sesionAutomatica: true,
    tiempoSesion: "30", // Valor por defecto en minutos
  });

  const [sistema, setSistema] = useState<SistemaState>({
    temaOscuro: false,
    altaResolucion: true,
    autoGuardado: true,
    tiempoAutoGuardado: "5", // Valor por defecto en minutos
  });

  // Estados para la gestión de usuarios (solo para admin)
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth(); // Obtener usuario y estado de carga del contexto de autenticación
  const [loadingUsers, setLoadingUsers] = useState(true); // Estado de carga específico para la lista de usuarios

  // Manejadores de cambio para los formularios
  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setUserForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof UserFormState | keyof SeguridadState | keyof SistemaState, value: string) => {
    // Determinar a qué estado pertenece el select y actualizarlo
    if (id in userForm) {
      setUserForm((prev) => ({ ...prev, [id as keyof UserFormState]: value }));
    } else if (id in seguridad) {
      setSeguridad((prev) => ({ ...prev, [id as keyof SeguridadState]: value }));
    } else if (id in sistema) {
      setSistema((prev) => ({ ...prev, [id as keyof SistemaState]: value }));
    }
  };

  const handleSwitchChange = (id: keyof NotificacionesState | keyof SeguridadState | keyof SistemaState, checked: boolean) => {
    // Determinar a qué estado pertenece el switch y actualizarlo
    if (id in notificaciones) {
      setNotificaciones((prev) => ({ ...prev, [id as keyof NotificacionesState]: checked }));
    } else if (id in seguridad) {
      setSeguridad((prev) => ({ ...prev, [id as keyof SeguridadState]: checked }));
    } else if (id in sistema) {
      setSistema((prev) => ({ ...prev, [id as keyof SistemaState]: checked }));
    }
  };

  // Efecto para cargar la lista de usuarios si el usuario es admin
  useEffect(() => {
    const fetchUsers = async () => {
      // Solo intentar obtener usuarios si el usuario actual existe y tiene rol 'admin'
      if (user?.rol === "admin") {
        try {
          const response = await fetch('/api/dashboard/users'); // Usar la ruta API correcta
          const data = await response.json();
          if (response.ok) {
            setUsers(data.users); // Asumiendo que la API devuelve { users: [...] }
          } else {
            // Manejar errores de la API
            setError(data.error || "Error fetching users");
          }
        } catch (err) {
          // Manejar errores de red o de la petición
          console.error("Error fetching users:", err);
          setError("Error fetching users");
        } finally {
          // Finalizar el estado de carga de usuarios
          setLoadingUsers(false);
        }
      } else {
        // Si no es admin, no hay usuarios que cargar, finalizar carga inmediatamente
        setLoadingUsers(false);
      }
    };

    // Esperar a que el contexto de autenticación termine de cargar antes de intentar obtener el usuario
    if (!authLoading) {
      fetchUsers();
    }
  }, [user, authLoading]); // Dependencias: re-ejecutar si el usuario o el estado de carga de auth cambian

  return (
    <div className="w-full min-w-0 py-8 px-4 sm:px-6 lg:px-8 xl:px-12 overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configuración</h1>
        <p className="text-gray-500">Gestione las preferencias de su cuenta y del sistema</p>
      </div>

      {authLoading || loadingUsers ? (
        <div className="text-center text-gray-600">Cargando configuración...</div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al cargar datos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !user || user?.rol === "paciente" ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acceso Restringido</AlertTitle>
          <AlertDescription>No tiene permisos para acceder a esta sección de configuración.</AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 gap-2">
            <TabsTrigger value="perfil" className="flex items-center justify-center gap-2 data-[state=active]:bg-teal-500 data-[state=active]:text-white w-full">
              <User className="h-4 w-4" />
              <span>Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="notificaciones" className="flex items-center justify-center gap-2 data-[state=active]:bg-teal-500 data-[state=active]:text-white w-full">
              <Bell className="h-4 w-4" />
              <span>Notificaciones</span>
            </TabsTrigger>
            <TabsTrigger value="seguridad" className="flex items-center justify-center gap-2 data-[state=active]:bg-teal-500 data-[state=active]:text-white w-full">
              <Shield className="h-4 w-4" />
              <span>Seguridad</span>
            </TabsTrigger>
            <TabsTrigger value="sistema" className="flex items-center justify-center gap-2 data-[state=active]:bg-teal-500 data-[state=active]:text-white w-full">
              <Zap className="h-4 w-4" />
              <span>Sistema</span>
            </TabsTrigger>
          </TabsList>

          {user?.rol === "admin" && (
            <Card className="border-teal-200 shadow-sm w-full">
              <CardHeader>
                <CardTitle className="text-teal-700">Usuarios del Sistema</CardTitle>
                <CardDescription>Lista de usuarios registrados en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                {users.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {users.map((userItem) => (
                      <li key={userItem.id_usuario} className="py-3 flex justify-between items-center">
                        <span className="font-medium text-gray-800">{userItem.primer_nombre}</span>
                        <span className="text-sm text-gray-600">{userItem.correo}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No se encontraron usuarios.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contenido de las pestañas - todas con el mismo ancho */}
          <TabsContent value="perfil" className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              <Card className="border-teal-200 shadow-sm w-full h-full">
                <CardHeader>
                  <CardTitle className="text-teal-700">Información Personal</CardTitle>
                  <CardDescription>Actualice su información personal y de contacto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre Completo</Label>
                      <Input id="nombre" value={userForm.nombre} onChange={handleUserFormChange} className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input id="email" type="email" value={userForm.email} onChange={handleUserFormChange} className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 w-full" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="especialidad">Especialidad</Label>
                      <Select value={userForm.especialidad} onValueChange={(value) => handleSelectChange("especialidad", value)}>
                        <SelectTrigger id="especialidad" className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 w-full">
                          <SelectValue placeholder="Seleccione su especialidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="radiologia">Radiología</SelectItem>
                          <SelectItem value="cardiologia">Cardiología</SelectItem>
                          <SelectItem value="neurologia">Neurología</SelectItem>
                          <SelectItem value="oncologia">Oncología</SelectItem>
                          <SelectItem value="pediatria">Pediatría</SelectItem>
                          <SelectItem value="otro">Otra especialidad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hospital">Hospital/Clínica</Label>
                      <Input id="hospital" value={userForm.hospital} onChange={handleUserFormChange} className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 w-full" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input id="telefono" value={userForm.telefono} onChange={handleUserFormChange} className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 w-full" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-4">
                  <Button variant="outline">Cancelar</Button>
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-teal-200 shadow-sm w-full h-full">
                <CardHeader>
                  <CardTitle className="text-teal-700">Cambiar Contraseña</CardTitle>
                  <CardDescription>Actualice su contraseña para mantener la seguridad de su cuenta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Contraseña Actual</Label>
                    <Input id="currentPassword" type="password" className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input id="newPassword" type="password" className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                    <Input id="confirmPassword" type="password" className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 w-full" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-4">
                  <Button variant="outline">Cancelar</Button>
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                    <Lock className="mr-2 h-4 w-4" />
                    Actualizar Contraseña
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notificaciones" className="w-full">
            <Card className="border-teal-200 shadow-sm w-full">
              <CardHeader>
                <CardTitle className="text-teal-700">Preferencias de Notificaciones</CardTitle>
                <CardDescription>Configure cómo y cuándo recibir notificaciones</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4 w-full">
                  <h3 className="text-lg font-semibold text-gray-800">Canales de Notificación</h3>
                  <Separator />
                  <div className="flex items-center justify-between py-2 w-full">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications" className="text-base">Notificaciones por Email</Label>
                      <p className="text-sm text-gray-600">Recibir notificaciones importantes por correo electrónico</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notificaciones.email}
                      onCheckedChange={(checked) => handleSwitchChange("email", checked)}
                      className="data-[state=checked]:bg-teal-500"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2 w-full">
                    <div className="space-y-0.5">
                      <Label htmlFor="system-notifications" className="text-base">Notificaciones del Sistema</Label>
                      <p className="text-sm text-gray-600">Recibir notificaciones dentro de la aplicación</p>
                    </div>
                    <Switch
                      id="system-notifications"
                      checked={notificaciones.sistema}
                      onCheckedChange={(checked) => handleSwitchChange("sistema", checked)}
                      className="data-[state=checked]:bg-teal-500"
                    />
                  </div>
                </div>
                <div className="space-y-4 w-full">
                  <h3 className="text-lg font-semibold text-gray-800">Tipos de Notificaciones</h3>
                  <Separator />
                  <div className="flex items-center justify-between py-2 w-full">
                    <div className="space-y-0.5">
                      <Label htmlFor="new-features" className="text-base">Nuevas Funcionalidades</Label>
                      <p className="text-sm text-gray-600">Notificaciones sobre nuevas características del sistema</p>
                    </div>
                    <Switch
                      id="new-features"
                      checked={notificaciones.nuevasFunciones}
                      onCheckedChange={(checked) => handleSwitchChange("nuevasFunciones", checked)}
                      className="data-[state=checked]:bg-teal-500"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2 w-full">
                    <div className="space-y-0.5">
                      <Label htmlFor="weekly-reports" className="text-base">Reportes Semanales</Label>
                      <p className="text-sm text-gray-600">Recibir resumen semanal de actividad</p>
                    </div>
                    <Switch
                      id="weekly-reports"
                      checked={notificaciones.reportesSemanal}
                      onCheckedChange={(checked) => handleSwitchChange("reportesSemanal", checked)}
                      className="data-[state=checked]:bg-teal-500"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2 w-full">
                    <div className="space-y-0.5">
                      <Label htmlFor="monthly-reports" className="text-base">Reportes Mensuales</Label>
                      <p className="text-sm text-gray-600">Recibir resumen mensual de actividad</p>
                    </div>
                    <Switch
                      id="monthly-reports"
                      checked={notificaciones.reportesMensual}
                      onCheckedChange={(checked) => handleSwitchChange("reportesMensual", checked)}
                      className="data-[state=checked]:bg-teal-500"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Preferencias
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="seguridad" className="w-full">
            <Card className="border-teal-200 shadow-sm w-full">
              <CardHeader>
                <CardTitle className="text-teal-700">Configuración de Seguridad</CardTitle>
                <CardDescription>Gestione la seguridad de su cuenta y sesiones</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="border-amber-300 bg-amber-100 text-amber-800 w-full">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <AlertTitle className="font-bold">Importante</AlertTitle>
                  <AlertDescription>
                    Mantener una configuración de seguridad adecuada es esencial para proteger la información médica
                    sensible.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
                  <div className="space-y-4 w-full">
                    <h3 className="text-lg font-semibold text-gray-800">Autenticación</h3>
                    <Separator />
                    <div className="flex items-center justify-between py-2 w-full">
                      <div className="space-y-0.5">
                        <Label htmlFor="two-factor" className="text-base">Autenticación de Dos Factores</Label>
                        <p className="text-sm text-gray-600">Añade una capa adicional de seguridad a tu cuenta</p>
                      </div>
                      <Switch
                        id="two-factor"
                        checked={seguridad.autenticacionDoble}
                        onCheckedChange={(checked) => handleSwitchChange("autenticacionDoble", checked)}
                        className="data-[state=checked]:bg-teal-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 w-full">
                    <h3 className="text-lg font-semibold text-gray-800">Sesiones</h3>
                    <Separator />
                    <div className="flex items-center justify-between py-2 w-full">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-login" className="text-base">Inicio de Sesión Automático</Label>
                        <p className="text-sm text-gray-600">Mantener la sesión iniciada en este dispositivo</p>
                      </div>
                      <Switch
                        id="auto-login"
                        checked={seguridad.sesionAutomatica}
                        onCheckedChange={(checked) => handleSwitchChange("sesionAutomatica", checked)}
                        className="data-[state=checked]:bg-teal-500"
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2 py-2 w-full">
                      <Label htmlFor="session-timeout" className="text-base">Tiempo de Inactividad para Cierre de Sesión</Label>
                      <p className="text-sm text-gray-600">Tiempo en minutos antes de cerrar la sesión por inactividad</p>
                      <Select
                        value={seguridad.tiempoSesion}
                        onValueChange={(value) => handleSelectChange("tiempoSesion", value)}
                      >
                        <SelectTrigger id="session-timeout" className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 w-full">
                          <SelectValue placeholder="Seleccionar tiempo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 minutos</SelectItem>
                          <SelectItem value="15">15 minutos</SelectItem>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="60">1 hora</SelectItem>
                          <SelectItem value="120">2 horas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Configuración
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="sistema" className="w-full">
            <Card className="border-teal-200 shadow-sm w-full">
              <CardHeader>
                <CardTitle className="text-teal-700">Configuración del Sistema</CardTitle>
                <CardDescription>Personalice la apariencia y el comportamiento del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4 w-full">
                    <h3 className="text-lg font-semibold text-gray-800">Apariencia</h3>
                    <Separator />
                    <div className="flex items-center justify-between py-2 w-full">
                      <div className="space-y-0.5">
                        <Label htmlFor="dark-mode" className="text-base">Tema Oscuro</Label>
                        <p className="text-sm text-gray-600">Cambiar a modo oscuro para reducir la fatiga visual</p>
                      </div>
                      <Switch
                        id="dark-mode"
                        checked={sistema.temaOscuro}
                        onCheckedChange={(checked) => handleSwitchChange("temaOscuro", checked)}
                        className="data-[state=checked]:bg-teal-500"
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-2 w-full">
                      <div className="space-y-0.5">
                        <Label htmlFor="high-res" className="text-base">Alta Resolución de Imágenes</Label>
                        <p className="text-sm text-gray-600">
                          Mostrar imágenes médicas en alta resolución (puede afectar el rendimiento)
                        </p>
                      </div>
                      <Switch
                        id="high-res"
                        checked={sistema.altaResolucion}
                        onCheckedChange={(checked) => handleSwitchChange("altaResolucion", checked)}
                        className="data-[state=checked]:bg-teal-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 w-full">
                    <h3 className="text-lg font-semibold text-gray-800">Comportamiento</h3>
                    <Separator />
                    <div className="flex items-center justify-between py-2 w-full">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-save" className="text-base">Guardado Automático</Label>
                        <p className="text-sm text-gray-600">Guardar automáticamente los diagnósticos en progreso</p>
                      </div>
                      <Switch
                        id="auto-save"
                        checked={sistema.autoGuardado}
                        onCheckedChange={(checked) => handleSwitchChange("autoGuardado", checked)}
                        className="data-[state=checked]:bg-teal-500"
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2 py-2 w-full">
                      <Label htmlFor="auto-save-time" className="text-base">Intervalo de Guardado Automático</Label>
                      <p className="text-sm text-gray-600">Tiempo en minutos entre guardados automáticos</p>
                      <Select
                        value={sistema.tiempoAutoGuardado}
                        onValueChange={(value) => handleSelectChange("tiempoAutoGuardado", value)}
                      >
                        <SelectTrigger id="auto-save-time" className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 w-full">
                          <SelectValue placeholder="Seleccionar intervalo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 minuto</SelectItem>
                          <SelectItem value="5">5 minutos</SelectItem>
                          <SelectItem value="10">10 minutos</SelectItem>
                          <SelectItem value="15">15 minutos</SelectItem>
                          <SelectItem value="30">30 minutos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 w-full mt-8">
                  <h3 className="text-lg font-semibold text-gray-800">Almacenamiento</h3>
                  <Separator />
                  <div className="space-y-2 py-2 w-full">
                    <Label className="text-base">Uso de Almacenamiento</Label>
                    <div className="rounded-md border border-gray-200 p-4 bg-gray-50 w-full">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <Database className="h-5 w-5 text-teal-600" />
                          <span className="font-medium text-gray-800">Espacio Utilizado</span>
                        </div>
                        <span className="font-semibold text-gray-800">1.2 GB / 5 GB</span>
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-gray-300">
                        <div className="h-2 w-[24%] rounded-full bg-teal-600"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Configuración
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}