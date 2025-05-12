"use client"

import React, { useEffect, useState, useRef } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useAuth, User as AuthUserInterface } from "@/context/AuthContext" // Renombrado para claridad
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Save, User, Lock, Bell, Database, Shield, Zap, Loader2, CheckCircle, KeyRound } from "lucide-react"
import QRCodeStyling from 'qr-code-styling';

// Definir tipos para los estados para mejor claridad
interface UserFormState {
  nombre: string
  email: string
  especialidad: string
  hospital: string
  telefono: string
}

interface NotificacionesState {
  email: boolean
  sistema: boolean
  nuevasFunciones: boolean
  reportesSemanal: boolean
  reportesMensual: boolean
}

interface SeguridadState {
  sesionAutomatica: boolean
  tiempoSesion: string
}

interface SistemaState {
  temaOscuro: boolean
  altaResolucion: boolean
  autoGuardado: boolean
  tiempoAutoGuardado: string
}

// Componente QR Code
const QrCodeComponent = ({ data }: { data: string | null }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data && qrRef.current) {
      qrRef.current.innerHTML = ''; // Limpiar QR anterior
      const qrCode = new QRCodeStyling({
        width: 256,
        height: 256,
        data: data,
        image: '/Logo_sofia.png', // Asegúrate que esta imagen exista en tu carpeta public
        dotsOptions: { color: '#0d9488', type: 'rounded' },
        backgroundOptions: { color: '#ffffff' },
        imageOptions: { crossOrigin: 'anonymous', margin: 5, imageSize: 0.3 },
        cornersSquareOptions: { color: '#0f766e', type: 'extra-rounded' },
        cornersDotOptions: { color: '#115e59', type: 'dot' }
      });
      qrCode.append(qrRef.current);
    }
  }, [data]);

  if (!data) return null;
  return <div ref={qrRef} className="mx-auto my-4 p-4 bg-white inline-block rounded-lg shadow-md"></div>;
};

export default function ConfiguracionPage() {
  const { user, loading: authLoading, refreshUser } = useAuth(); // Obtener refreshUser del contexto

  const [userForm, setUserForm] = useState<UserFormState>({
    nombre: "",
    email: "",
    especialidad: "radiologia",
    hospital: "Hospital Central",
    telefono: "+1234567890",
  });

  const [notificaciones, setNotificaciones] = useState<NotificacionesState>({
    email: true, sistema: true, nuevasFunciones: true, reportesSemanal: false, reportesMensual: true,
  });

  const [seguridad, setSeguridad] = useState<SeguridadState>({
    sesionAutomatica: true, tiempoSesion: "30",
  });

  const [sistema, setSistema] = useState<SistemaState>({
    temaOscuro: false, altaResolucion: true, autoGuardado: true, tiempoAutoGuardado: "5",
  });

  const [usersList, setUsersList] = useState<AuthUserInterface[]>([]); // Usar la interfaz importada
  const [pageError, setPageError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Estados para MFA
  const [isMfaEnabledForUser, setIsMfaEnabledForUser] = useState<boolean>(false);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isMfaLoading, setIsMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaSuccessMessage, setMfaSuccessMessage] = useState<string | null>(null);
  const [mfaCurrentStep, setMfaCurrentStep] = useState<'initial' | 'showQr' | 'verify'>('initial');

  // Efecto para inicializar datos del usuario y estado MFA
  useEffect(() => {
    if (user) {
      console.log("[ConfiguracionPage] useEffect[user] - User from AuthContext:", user);
      setUserForm(prev => ({
        ...prev,
        nombre: `${user.primer_nombre || ''} ${user.primer_apellido || ''}`.trim(),
        email: user.correo || '',
        // Aquí podrías inicializar más campos del formulario de perfil si los tienes en el objeto 'user'
      }));

      // Establecer el estado de MFA basado en user.mfa_enabled del AuthContext
      console.log("[ConfiguracionPage] useEffect[user] - Setting isMfaEnabledForUser based on user.mfa_enabled:", user.mfa_enabled);
      const mfaStatusFromContext = !!user.mfa_enabled;
      setIsMfaEnabledForUser(mfaStatusFromContext);
                                                  
      if (mfaStatusFromContext) {
        // Si MFA ya está habilitado al cargar la página (viene del contexto),
        // asegurarse de que el flujo de UI esté en el estado inicial.
        setMfaCurrentStep('initial');
        setOtpauthUrl(null); // No mostrar QR si ya está habilitado
        setMfaError(null);
        // No limpiar mfaSuccessMessage aquí, podría ser útil si acaba de habilitarlo.
      } else {
        // Si MFA no está habilitado según el contexto, asegurar estado inicial para habilitación.
        setMfaCurrentStep('initial');
        setOtpauthUrl(null);
      }

    } else {
      console.log("[ConfiguracionPage] useEffect[user] - No user from AuthContext.");
      setIsMfaEnabledForUser(false); // Si no hay usuario, MFA no está habilitado
      setMfaCurrentStep('initial');
    }
  }, [user]); // Se ejecuta cada vez que el objeto 'user' del AuthContext cambia


  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setUserForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof UserFormState | keyof SeguridadState | keyof SistemaState, value: string) => {
    if (id in userForm) setUserForm((prev) => ({ ...prev, [id as keyof UserFormState]: value }));
    else if (id in seguridad) setSeguridad((prev) => ({ ...prev, [id as keyof SeguridadState]: value }));
    else if (id in sistema) setSistema((prev) => ({ ...prev, [id as keyof SistemaState]: value }));
  };

  const handleSwitchChange = (
    id: keyof NotificacionesState | keyof SeguridadState | keyof SistemaState,
    checked: boolean,
  ) => {
    if (id in notificaciones) setNotificaciones((prev) => ({ ...prev, [id as keyof NotificacionesState]: checked }));
    else if (id in seguridad) setSeguridad((prev) => ({ ...prev, [id as keyof SeguridadState]: checked }));
    else if (id in sistema) setSistema((prev) => ({ ...prev, [id as keyof SistemaState]: checked }));
  };

  useEffect(() => {
    const fetchUsers = async () => {
      if (user?.roles?.includes("admin")) {
        try {
          setLoadingUsers(true);
          const response = await fetch("/api/dashboard/users"); // Llama sin UID para obtener todos los usuarios
          const data = await response.json();
          if (response.ok) {
            setUsersList(data.users || []); // Usar setUsersList
          } else {
            setPageError(data.error || "Error fetching users");
          }
        } catch (err) {
          console.error("Error fetching users:", err);
          setPageError("Error de red al obtener usuarios.");
        } finally {
          setLoadingUsers(false);
        }
      } else {
        setLoadingUsers(false); // No es admin, no cargar lista de usuarios
      }
    };
    // Solo llamar si el usuario del contexto ya cargó y es admin
    if (!authLoading && user) {
        fetchUsers();
    }
  }, [user, authLoading]);

  const handleInitiateMfaSetup = async () => {
    if (!user?.firebase_uid) {
      setMfaError("No se pudo obtener la información del usuario. Intenta recargar la página.");
      return;
    }
    setIsMfaLoading(true); setMfaError(null); setMfaSuccessMessage(null); setOtpauthUrl(null); setManualSecret(null);
    try {
      const response = await fetch('/api/mfa/setup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_uid: user.firebase_uid }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al iniciar la configuración de MFA.');
      setOtpauthUrl(data.otpauthUrl);
      if (data.secretForManualEntry) setManualSecret(data.secretForManualEntry);
      setMfaCurrentStep('showQr');
      setMfaSuccessMessage("Escanea el código QR con tu aplicación de autenticación.");
    } catch (err: any) { setMfaError(err.message); }
    finally { setIsMfaLoading(false); }
  };

  const handleVerifyAndEnableMfa = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!user?.firebase_uid || !verificationCode) {
      setMfaError("Se requiere el código de verificación."); return;
    }
    setIsMfaLoading(true); setMfaError(null); setMfaSuccessMessage(null);
    try {
      const response = await fetch('/api/mfa/verify-setup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_uid: user.firebase_uid, token: verificationCode.replace(/\s/g, '') }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al verificar el código MFA.');
      
      setMfaSuccessMessage(data.message || "¡Autenticación de Dos Factores habilitada exitosamente!");
      setMfaCurrentStep('initial'); 
      setOtpauthUrl(null); 
      setManualSecret(null); 
      setVerificationCode('');
      
      console.log("[ConfiguracionPage] MFA verificado exitosamente. Llamando a refreshUser().");
      await refreshUser(); // Actualizar el estado global del usuario en AuthContext
      // El useEffect[user] se disparará y actualizará isMfaEnabledForUser
    } catch (err: any) { 
      setMfaError(err.message); 
      console.error("[ConfiguracionPage] Error en handleVerifyAndEnableMfa:", err);
    }
    finally { setIsMfaLoading(false); }
  };

  const handleDisableMfa = async () => {
    // TODO: Implementar la lógica de deshabilitación
    // Esto requerirá un nuevo endpoint en el backend (ej. /api/mfa/disable)
    // y actualizar el estado local y global.
    if (!user?.firebase_uid) {
      setMfaError("No se pudo obtener la información del usuario.");
      return;
    }
    const confirmDisable = window.confirm("¿Estás seguro de que quieres deshabilitar la Autenticación de Dos Factores? Esta acción reducirá la seguridad de tu cuenta.");
    if (!confirmDisable) return;

    setIsMfaLoading(true); setMfaError(null); setMfaSuccessMessage(null);
    try {
      // Asumiendo que tienes un endpoint /api/mfa/disable
      const response = await fetch('/api/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_uid: user.firebase_uid }), // Podrías necesitar verificar identidad aquí (ej. contraseña)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al deshabilitar MFA.");
      
      setMfaSuccessMessage(data.message || "Autenticación de Dos Factores deshabilitada.");
      await refreshUser(); // Refrescar el contexto, el useEffect actualizará isMfaEnabledForUser
      setMfaCurrentStep('initial');
    } catch (err: any) {
      setMfaError(err.message);
      console.error("[ConfiguracionPage] Error en handleDisableMfa:", err);
    } finally {
      setIsMfaLoading(false);
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-teal-600" /> <p className="ml-3 text-lg">Cargando...</p></div>;
  }
  if (!user) {
    console.log("[ConfiguracionPage] No hay usuario, renderizando mensaje de inicio de sesión.");
    return <div className="text-center py-10">Por favor, inicia sesión para acceder a la configuración.</div>;
  }
  if (user.roles && user.roles.includes('paciente')) {
    return (
      <div className="w-full py-8 px-6 max-w-full overflow-x-hidden">
        <div className="mb-6"><h1 className="text-3xl font-bold tracking-tight text-gray-900">Configuración</h1></div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" /><AlertTitle>Acceso Restringido</AlertTitle>
          <AlertDescription>Los pacientes no tienen acceso a esta sección de configuración.</AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log("[ConfiguracionPage] Renderizando UI de MFA. isMfaEnabledForUser:", isMfaEnabledForUser, "user.mfa_enabled del contexto:", user?.mfa_enabled, "mfaCurrentStep:", mfaCurrentStep);

  return (
    <div className="w-full py-8 px-6 max-w-full overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configuración</h1>
        <p className="text-gray-500">Gestione las preferencias de su cuenta y del sistema</p>
      </div>

      {(loadingUsers && user?.roles?.includes("admin")) ? (
        <div className="text-center text-gray-600 py-10"><Loader2 className="h-6 w-6 animate-spin inline mr-2" />Cargando datos de configuración...</div>
      ) : pageError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" /> <AlertTitle>Error al Cargar Datos</AlertTitle> <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      ) : (
        <div className="w-full">
          {user?.roles?.includes("admin") && (
            <Card className="border-teal-200 shadow-sm mb-6">
              <CardHeader className="bg-teal-50">
                <CardTitle className="text-teal-700">Usuarios del Sistema</CardTitle>
                <CardDescription>Lista de usuarios registrados en el sistema</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {usersList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Nombre</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Correo</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Roles</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map((userItem) => (
                          <tr key={userItem.id_usuario} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-3 font-medium text-gray-800">{userItem.primer_nombre} {userItem.primer_apellido}</td>
                            <td className="py-3 px-3 text-gray-600">{userItem.correo}</td>
                            <td className="py-3 px-3 text-gray-600 capitalize">{(userItem.roles || []).join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (<p className="text-gray-500 italic">{loadingUsers ? "Cargando usuarios..." : "No se encontraron usuarios."}</p>)}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="perfil" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
              <TabsTrigger value="perfil" className="flex items-center justify-center gap-2 data-[state=active]:bg-teal-500 data-[state=active]:text-white">
                <User className="h-4 w-4" /> <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="notificaciones" className="flex items-center justify-center gap-2 data-[state=active]:bg-teal-500 data-[state=active]:text-white">
                <Bell className="h-4 w-4" /> <span className="hidden sm:inline">Notificaciones</span>
              </TabsTrigger>
              <TabsTrigger value="seguridad" className="flex items-center justify-center gap-2 data-[state=active]:bg-teal-500 data-[state=active]:text-white">
                <Shield className="h-4 w-4" /> <span className="hidden sm:inline">Seguridad</span>
              </TabsTrigger>
              <TabsTrigger value="sistema" className="flex items-center justify-center gap-2 data-[state=active]:bg-teal-500 data-[state=active]:text-white">
                <Zap className="h-4 w-4" /> <span className="hidden sm:inline">Sistema</span>
              </TabsTrigger>
            </TabsList>

            {/* === PESTAÑA PERFIL === */}
            <TabsContent value="perfil" className="w-full mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-teal-200 shadow-sm h-full">
                  <CardHeader className="bg-teal-50">
                    <CardTitle className="text-teal-700">Información Personal</CardTitle>
                    <CardDescription>Actualice su información personal y de contacto</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre Completo</Label>
                        <Input id="nombre" value={userForm.nombre} onChange={handleUserFormChange} className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" value={userForm.email} onChange={handleUserFormChange} className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="especialidad">Especialidad</Label>
                        <Select value={userForm.especialidad} onValueChange={(value) => handleSelectChange("especialidad", value)}>
                          <SelectTrigger id="especialidad" className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"><SelectValue placeholder="Seleccione su especialidad" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="radiologia">Radiología</SelectItem>
                            <SelectItem value="cardiologia">Cardiología</SelectItem>
                            {/* ... más especialidades ... */}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hospital">Hospital/Clínica</Label>
                        <Input id="hospital" value={userForm.hospital} onChange={handleUserFormChange} className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input id="telefono" value={userForm.telefono} onChange={handleUserFormChange} className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-4 bg-gray-50">
                    <Button variant="outline">Cancelar</Button>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white"><Save className="mr-2 h-4 w-4" /> Guardar Cambios</Button>
                  </CardFooter>
                </Card>
                <Card className="border-teal-200 shadow-sm h-full">
                  <CardHeader className="bg-teal-50">
                    <CardTitle className="text-teal-700">Cambiar Contraseña</CardTitle>
                    <CardDescription>Actualice su contraseña para mantener la seguridad de su cuenta</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Contraseña Actual</Label>
                      <Input id="currentPassword" type="password" className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nueva Contraseña</Label>
                      <Input id="newPassword" type="password" className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                      <Input id="confirmPassword" type="password" className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-4 bg-gray-50">
                    <Button variant="outline">Cancelar</Button>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white"><Lock className="mr-2 h-4 w-4" /> Actualizar Contraseña</Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            {/* === PESTAÑA NOTIFICACIONES === */}
            <TabsContent value="notificaciones" className="w-full mt-0">
              <Card className="border-teal-200 shadow-sm">
                <CardHeader className="bg-teal-50">
                  <CardTitle className="text-teal-700">Preferencias de Notificaciones</CardTitle>
                  <CardDescription>Configure cómo y cuándo recibir notificaciones</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Canales de Notificación</h3><Separator />
                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5"><Label htmlFor="email-notifications" className="text-base">Notificaciones por Email</Label><p className="text-sm text-gray-600">Recibir notificaciones importantes por correo electrónico</p></div>
                        <Switch id="email-notifications" checked={notificaciones.email} onCheckedChange={(checked) => handleSwitchChange("email", checked)} className="data-[state=checked]:bg-teal-500" />
                      </div> <Separator />
                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5"><Label htmlFor="system-notifications" className="text-base">Notificaciones del Sistema</Label><p className="text-sm text-gray-600">Recibir notificaciones dentro de la aplicación</p></div>
                        <Switch id="system-notifications" checked={notificaciones.sistema} onCheckedChange={(checked) => handleSwitchChange("sistema", checked)} className="data-[state=checked]:bg-teal-500" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Tipos de Notificaciones</h3><Separator />
                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5"><Label htmlFor="new-features" className="text-base">Nuevas Funcionalidades</Label><p className="text-sm text-gray-600">Notificaciones sobre nuevas características del sistema</p></div>
                        <Switch id="new-features" checked={notificaciones.nuevasFunciones} onCheckedChange={(checked) => handleSwitchChange("nuevasFunciones", checked)} className="data-[state=checked]:bg-teal-500" />
                      </div> <Separator />
                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5"><Label htmlFor="weekly-reports" className="text-base">Reportes Semanales</Label><p className="text-sm text-gray-600">Recibir resumen semanal de actividad</p></div>
                        <Switch id="weekly-reports" checked={notificaciones.reportesSemanal} onCheckedChange={(checked) => handleSwitchChange("reportesSemanal", checked)} className="data-[state=checked]:bg-teal-500" />
                      </div> <Separator />
                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5"><Label htmlFor="monthly-reports" className="text-base">Reportes Mensuales</Label><p className="text-sm text-gray-600">Recibir resumen mensual de actividad</p></div>
                        <Switch id="monthly-reports" checked={notificaciones.reportesMensual} onCheckedChange={(checked) => handleSwitchChange("reportesMensual", checked)} className="data-[state=checked]:bg-teal-500" />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end bg-gray-50">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white"><Save className="mr-2 h-4 w-4" /> Guardar Preferencias</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* === PESTAÑA SEGURIDAD (CON MFA) === */}
            <TabsContent value="seguridad" className="w-full mt-0">
              <Card className="border-teal-200 shadow-sm">
                <CardHeader className="bg-teal-50">
                  <CardTitle className="text-teal-700">Configuración de Seguridad Avanzada</CardTitle>
                  <CardDescription>Gestione la autenticación de dos factores y otras opciones de seguridad.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                  <Alert className="border-amber-300 bg-amber-50 text-amber-800">
                    <AlertCircle className="h-5 w-5 text-amber-600" /> <AlertTitle className="font-bold">Importante</AlertTitle>
                    <AlertDescription>Mantener una configuración de seguridad adecuada es esencial.</AlertDescription>
                  </Alert>

                  <div> {/* Contenedor para la sección MFA */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">Autenticación de Dos Factores (MFA)</h3>
                    <p className="text-sm text-gray-500 mb-4">Añade una capa extra de seguridad a tu cuenta usando una aplicación de autenticación TOTP.</p>
                    <Separator className="mb-6" />

                    {mfaError && (<Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Error de MFA</AlertTitle><AlertDescription>{mfaError}</AlertDescription></Alert>)}
                    {mfaSuccessMessage && mfaCurrentStep === 'initial' && (<Alert variant="default" className="mb-4 bg-green-50 border-green-300 text-green-700"><CheckCircle className="h-4 w-4" /><AlertTitle>Éxito</AlertTitle><AlertDescription>{mfaSuccessMessage}</AlertDescription></Alert>)}

                    {/* Lógica de renderizado basada en isMfaEnabledForUser y mfaCurrentStep */}
                    {isMfaEnabledForUser && mfaCurrentStep === 'initial' && (
                      <div className="text-center p-4 border border-green-200 bg-green-50 rounded-md">
                        <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-2" />
                        <p className="font-semibold text-green-700 mb-3">La Autenticación de Dos Factores está HABILITADA.</p>
                        <Button onClick={handleDisableMfa} variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" disabled={isMfaLoading}>
                          {isMfaLoading && mfaCurrentStep === 'initial' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Deshabilitar MFA
                        </Button>
                      </div>
                    )}

                    {!isMfaEnabledForUser && mfaCurrentStep === 'initial' && (
                      <div className="text-left">
                        <p className="text-gray-600 mb-3">MFA no está activo para tu cuenta.</p>
                        <Button onClick={handleInitiateMfaSetup} disabled={isMfaLoading} className="bg-teal-600 hover:bg-teal-700">
                          {isMfaLoading && mfaCurrentStep === 'initial' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />} Habilitar Autenticación de Dos Factores
                        </Button>
                      </div>
                    )}

                    {mfaCurrentStep === 'showQr' && otpauthUrl && (
                      <div className="space-y-4 text-center p-4 border rounded-md bg-gray-50">
                        <h4 className="text-lg font-semibold text-gray-700">Paso 1: Escanea el Código QR</h4>
                        <p className="text-sm text-gray-600 max-w-md mx-auto">Usa tu aplicación de autenticación para escanear este código.</p>
                        <div className="flex justify-center my-3"><QrCodeComponent data={otpauthUrl} /></div>
                        {manualSecret && (
                          <div className="mt-3 p-3 bg-gray-100 rounded-md text-sm">
                            <p className="font-medium text-gray-700">O ingresa manualmente este código en tu app:</p>
                            <p className="font-mono text-teal-700 break-all bg-white p-2 my-1 rounded shadow-sm inline-block">{manualSecret}</p>
                          </div>
                        )}
                        <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
                          <Button variant="outline" onClick={() => { setMfaCurrentStep('initial'); setOtpauthUrl(null); setMfaError(null); setMfaSuccessMessage(null); }} disabled={isMfaLoading}>Cancelar</Button>
                          <Button onClick={() => { setMfaCurrentStep('verify'); setMfaError(null); setMfaSuccessMessage(null); }} className="bg-teal-600 hover:bg-teal-700" disabled={isMfaLoading}>Siguiente: Verificar Código</Button>
                        </div>
                      </div>
                    )}

                    {mfaCurrentStep === 'verify' && (
                      <form onSubmit={handleVerifyAndEnableMfa} className="space-y-4 p-4 border rounded-md bg-gray-50 max-w-md mx-auto">
                        <h4 className="text-lg font-semibold text-gray-700 text-center">Paso 2: Verifica tu Código</h4>
                        <p className="text-sm text-gray-600 text-center">Ingresa el código de 6 dígitos generado por tu aplicación.</p>
                        <div>
                          <Label htmlFor="verificationCode" className="sr-only">Código de Verificación</Label>
                          <Input id="verificationCode" type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\s/g, ''))} placeholder="123 456" maxLength={7} pattern="\d{3}\s?\d{3}|\d{6}" required className="text-center text-2xl tracking-widest font-mono h-14 rounded-md" disabled={isMfaLoading} />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                          <Button type="button" variant="outline" onClick={() => { setMfaCurrentStep('showQr'); setMfaError(null); }} disabled={isMfaLoading}>Atrás (Ver QR)</Button>
                          <Button type="submit" disabled={isMfaLoading || verificationCode.replace(/\s/g, '').length !== 6} className="bg-teal-600 hover:bg-teal-700">
                            {isMfaLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Verificar y Activar MFA
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                  <Separator className="my-8" />
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Sesiones</h3><Separator className="mb-6" />
                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5"><Label htmlFor="auto-login" className="text-base font-medium">Inicio de Sesión Automático</Label><p className="text-sm text-gray-600">Mantener la sesión iniciada en este dispositivo.</p></div>
                      <Switch id="auto-login" checked={seguridad.sesionAutomatica} onCheckedChange={(checked) => handleSwitchChange("sesionAutomatica", checked)} className="data-[state=checked]:bg-teal-500" />
                    </div> <Separator />
                    <div className="space-y-2 py-2">
                      <Label htmlFor="session-timeout" className="text-base font-medium">Tiempo de Inactividad para Cierre de Sesión</Label>
                      <p className="text-sm text-gray-600">Tiempo en minutos antes de cerrar la sesión por inactividad.</p>
                      <Select value={seguridad.tiempoSesion} onValueChange={(value) => handleSelectChange("tiempoSesion", value)}>
                        <SelectTrigger id="session-timeout" className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"><SelectValue placeholder="Seleccionar tiempo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 minutos</SelectItem>
                          <SelectItem value="15">15 minutos</SelectItem>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="60">60 minutos</SelectItem>
                          <SelectItem value="never">Nunca</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end bg-gray-50">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white"><Save className="mr-2 h-4 w-4" /> Guardar Configuración de Seguridad</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* === PESTAÑA SISTEMA === */}
            <TabsContent value="sistema" className="w-full mt-0">
              <Card className="border-teal-200 shadow-sm">
                <CardHeader className="bg-teal-50">
                  <CardTitle className="text-teal-700">Configuración del Sistema</CardTitle>
                  <CardDescription>Personalice la apariencia y el comportamiento del sistema</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Apariencia</h3><Separator />
                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5"><Label htmlFor="dark-mode" className="text-base">Tema Oscuro</Label><p className="text-sm text-gray-600">Cambiar a modo oscuro para reducir la fatiga visual</p></div>
                        <Switch id="dark-mode" checked={sistema.temaOscuro} onCheckedChange={(checked) => handleSwitchChange("temaOscuro", checked)} className="data-[state=checked]:bg-teal-500" />
                      </div> <Separator />
                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5"><Label htmlFor="high-res" className="text-base">Alta Resolución de Imágenes</Label><p className="text-sm text-gray-600">Mostrar imágenes médicas en alta resolución</p></div>
                        <Switch id="high-res" checked={sistema.altaResolucion} onCheckedChange={(checked) => handleSwitchChange("altaResolucion", checked)} className="data-[state=checked]:bg-teal-500" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Comportamiento</h3><Separator />
                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5"><Label htmlFor="auto-save" className="text-base">Guardado Automático</Label><p className="text-sm text-gray-600">Guardar automáticamente los diagnósticos en progreso</p></div>
                        <Switch id="auto-save" checked={sistema.autoGuardado} onCheckedChange={(checked) => handleSwitchChange("autoGuardado", checked)} className="data-[state=checked]:bg-teal-500" />
                      </div> <Separator />
                      <div className="space-y-2 py-2">
                        <Label htmlFor="auto-save-time" className="text-base">Intervalo de Guardado Automático</Label>
                        <p className="text-sm text-gray-600">Tiempo en minutos entre guardados automáticos</p>
                        <Select value={sistema.tiempoAutoGuardado} onValueChange={(value) => handleSelectChange("tiempoAutoGuardado", value)}>
                          <SelectTrigger id="auto-save-time" className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"><SelectValue placeholder="Seleccionar intervalo" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 minuto</SelectItem>
                            <SelectItem value="3">3 minutos</SelectItem>
                            <SelectItem value="5">5 minutos</SelectItem>
                            <SelectItem value="10">10 minutos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-semibold text-gray-800">Almacenamiento</h3><Separator />
                    <div className="space-y-2 py-2">
                      <Label className="text-base">Uso de Almacenamiento</Label>
                      <div className="rounded-md border border-gray-200 p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3"><Database className="h-5 w-5 text-teal-600" /><span className="font-medium text-gray-800">Espacio Utilizado</span></div>
                          <span className="font-semibold text-gray-800">1.2 GB / 5 GB</span> {/* Ejemplo de datos */}
                        </div>
                        <div className="mt-3 h-2 w-full rounded-full bg-gray-300"><div className="h-2 w-[24%] rounded-full bg-teal-600"></div></div> {/* Ejemplo de barra */}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end bg-gray-50">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white"><Save className="mr-2 h-4 w-4" /> Guardar Configuración</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
