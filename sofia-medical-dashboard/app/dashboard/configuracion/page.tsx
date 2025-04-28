"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardBody } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useAuthContext } from "@/context/AuthContext"
import { getUsers } from "@/lib/db"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Save, User, Lock, Bell, Database, Shield, Zap } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ConfiguracionPage() {
  const [userForm, setUserForm] = useState({
    nombre: "Dr. Usuario",
    email: "doctor@sofia.ai",
    especialidad: "radiologia",
    hospital: "Hospital Central",
    telefono: "+1234567890",
  })

  const [notificaciones, setNotificaciones] = useState({
    email: true,
    sistema: true,
    nuevasFunciones: true,
    reportesSemanal: false,
    reportesMensual: true,
  })

  const [seguridad, setSeguridad] = useState({
    autenticacionDoble: false,
    sesionAutomatica: true,
    tiempoSesion: "30",
  })

  const [sistema, setSistema] = useState({
    temaOscuro: false,
    altaResolucion: true,
    autoGuardado: true,
    tiempoAutoGuardado: "5",
  })

  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setUserForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setUserForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleNotificacionesChange = (id: string, checked: boolean) => {
    setNotificaciones((prev) => ({ ...prev, [id]: checked }))
  }

  const handleSeguridadChange = (id: string, value: string | boolean) => {
    setSeguridad((prev) => ({ ...prev, [id]: value }))
  }

  const handleSistemaChange = (id: string, value: string | boolean) => {
    setSistema((prev) => ({ ...prev, [id]: value }))
  }

  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        setError("Error fetching users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configuración</h1>
        <p className="text-gray-500">Gestione las preferencias de su cuenta y del sistema</p>
      </div>

       {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        user?.role !== "admin" ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No tienes permisos</AlertTitle>
            <AlertDescription>No tienes permisos para ver esta información</AlertDescription>
          </Alert>
        ) : (
 <Tabs defaultValue="perfil" className="space-y-4">
         
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="perfil" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="notificaciones" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="seguridad" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Seguridad</span>
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>Sistema</span>
          </TabsTrigger>
        </TabsList>

        <Card className="border-teal-100">
        <CardHeader>
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>Lista de Usuarios</CardDescription>
            </CardHeader>
            <CardBody>
            <ul>
            {users.map((user: any) => ( <li key={user.id_usuario}>{user.primer_nombre} - {user.correo}</li> ))}
            </ul>
            </CardBody>
        </Card>

        <TabsContent value="perfil" className="space-y-4">
          <Card className="border-teal-100">
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Actualice su información personal y de contacto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo</Label>
                  <Input id="nombre" value={userForm.nombre} onChange={handleUserFormChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" type="email" value={userForm.email} onChange={handleUserFormChange} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="especialidad">Especialidad</Label>
                  <Select
                    value={userForm.especialidad}
                    onValueChange={(value) => handleSelectChange("especialidad", value)}
                  >
                    <SelectTrigger id="especialidad">
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
                  <Input id="hospital" value={userForm.hospital} onChange={handleUserFormChange} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" value={userForm.telefono} onChange={handleUserFormChange} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancelar</Button>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-teal-100">
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>Actualice su contraseña para mantener la seguridad de su cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input id="confirmPassword" type="password" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancelar</Button>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Lock className="mr-2 h-4 w-4" />
                Actualizar Contraseña
               </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notificaciones" className="space-y-4">
          <Card className="border-teal-100">
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <CardDescription>Configure cómo y cuándo recibir notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Canales de Notificación</h3>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                    <p className="text-sm text-gray-500">Recibir notificaciones por correo electrónico</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notificaciones.email}
                    onCheckedChange={(checked) => handleNotificacionesChange("email", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="system-notifications">Notificaciones del Sistema</Label>
                    <p className="text-sm text-gray-500">Recibir notificaciones dentro de la aplicación</p>
                  </div>
                  <Switch
                    id="system-notifications"
                    checked={notificaciones.sistema}
                    onCheckedChange={(checked) => handleNotificacionesChange("sistema", checked)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Tipos de Notificaciones</h3>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="new-features">Nuevas Funcionalidades</Label>
                    <p className="text-sm text-gray-500">Notificaciones sobre nuevas características del sistema</p>
                  </div>
                  <Switch
                    id="new-features"
                    checked={notificaciones.nuevasFunciones}
                    onCheckedChange={(checked) => handleNotificacionesChange("nuevasFunciones", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-reports">Reportes Semanales</Label>
                    <p className="text-sm text-gray-500">Recibir resumen semanal de actividad</p>
                  </div>
                  <Switch
                    id="weekly-reports"
                    checked={notificaciones.reportesSemanal}
                    onCheckedChange={(checked) => handleNotificacionesChange("reportesSemanal", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="monthly-reports">Reportes Mensuales</Label>
                    <p className="text-sm text-gray-500">Recibir resumen mensual de actividad</p>
                  </div>
                  <Switch
                    id="monthly-reports"
                    checked={notificaciones.reportesMensual}
                    onCheckedChange={(checked) => handleNotificacionesChange("reportesMensual", checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto bg-teal-600 hover:bg-teal-700">
                <Save className="mr-2 h-4 w-4" />
                Guardar Preferencias
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="seguridad" className="space-y-4">
          <Card className="border-teal-100">
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
              <CardDescription>Gestione la seguridad de su cuenta y sesiones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="warning" className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Importante</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Mantener una configuración de seguridad adecuada es esencial para proteger la información médica
                  sensible.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Autenticación</h3>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="two-factor">Autenticación de Dos Factores</Label>
                    <p className="text-sm text-gray-500">Añade una capa adicional de seguridad a tu cuenta</p>
                  </div>
                  <Switch
                    id="two-factor"
                    checked={seguridad.autenticacionDoble}
                    onCheckedChange={(checked) => handleSeguridadChange("autenticacionDoble", checked)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Sesiones</h3>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-login">Inicio de Sesión Automático</Label>
                    <p className="text-sm text-gray-500">Mantener la sesión iniciada en este dispositivo</p>
                  </div>
                  <Switch
                    id="auto-login"
                    checked={seguridad.sesionAutomatica}
                    onCheckedChange={(checked) => handleSeguridadChange("sesionAutomatica", checked)}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Tiempo de Inactividad para Cierre de Sesión</Label>
                  <p className="text-sm text-gray-500">Tiempo en minutos antes de cerrar la sesión por inactividad</p>
                  <Select
                    value={seguridad.tiempoSesion}
                    onValueChange={(value) => handleSeguridadChange("tiempoSesion", value)}
                  >
                    <SelectTrigger id="session-timeout">
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
            </CardContent>
            <CardFooter>
              <Button className="ml-auto bg-teal-600 hover:bg-teal-700">
                <Save className="mr-2 h-4 w-4" />
                Guardar Configuración
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="sistema" className="space-y-4">
          <Card className="border-teal-100">
            <CardHeader>
              <CardTitle>Configuración del Sistema</CardTitle>
              <CardDescription>Personalice la apariencia y el comportamiento del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Apariencia</h3>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Tema Oscuro</Label>
                    <p className="text-sm text-gray-500">Cambiar a modo oscuro para reducir la fatiga visual</p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={sistema.temaOscuro}
                    onCheckedChange={(checked) => handleSistemaChange("temaOscuro", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="high-res">Alta Resolución de Imágenes</Label>
                    <p className="text-sm text-gray-500">
                      Mostrar imágenes médicas en alta resolución (puede afectar el rendimiento)
                    </p>
                  </div>
                  <Switch
                    id="high-res"
                    checked={sistema.altaResolucion}
                    onCheckedChange={(checked) => handleSistemaChange("altaResolucion", checked)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Comportamiento</h3>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-save">Guardado Automático</Label>
                    <p className="text-sm text-gray-500">Guardar automáticamente los diagnósticos en progreso</p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={sistema.autoGuardado}
                    onCheckedChange={(checked) => handleSistemaChange("autoGuardado", checked)}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="auto-save-time">Intervalo de Guardado Automático</Label>
                  <p className="text-sm text-gray-500">Tiempo en minutos entre guardados automáticos</p>
                  <Select
                    value={sistema.tiempoAutoGuardado}
                    onValueChange={(value) => handleSistemaChange("tiempoAutoGuardado", value)}
                  >
                    <SelectTrigger id="auto-save-time">
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

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Almacenamiento</h3>
                <Separator />
                <div className="space-y-2">
                  <Label>Uso de Almacenamiento</Label>
                  <div className="rounded-md border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-teal-600" />
                        <span className="font-medium">Espacio Utilizado</span>
                      </div>
                      <span className="font-medium">1.2 GB / 5 GB</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                      <div className="h-2 w-[24%] rounded-full bg-teal-600"></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto bg-teal-600 hover:bg-teal-700">
                <Save className="mr-2 h-4 w-4" />
                Guardar Configuración
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>)
  )}
    </div>
  )
}
