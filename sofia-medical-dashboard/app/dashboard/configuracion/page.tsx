"use client"

import React, { useEffect, useState, useRef } from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import Swal from 'sweetalert2'
import { AlertCircle, Save, User, Lock, Database, Shield, Zap, Loader2, CheckCircle, KeyRound } from "lucide-react"
import QRCodeStyling from 'qr-code-styling'

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAuth, User as AuthUserInterface } from "@/context/AuthContext"

// Definir tipos para los estados para mejor claridad
interface UserFormState {
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  correo: string;
}

interface SeguridadState {
  sesionAutomatica: boolean
  tiempoSesion: string
}

interface SistemaState {
  temaOscuro: boolean // This will be driven by next-themes
  altaResolucion: boolean
  autoGuardado: boolean
  tiempoAutoGuardado: string
}

// Componente QR Code
const QrCodeComponent = ({ data }: { data: string | null }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme(); // Get current theme

  useEffect(() => {
    if (data && qrRef.current) {
      qrRef.current.innerHTML = ''; // Limpiar QR anterior
      const qrCode = new QRCodeStyling({
        width: 256,
        height: 256,
        data: data,
        image: '/Logo_sofia.png', 
        dotsOptions: { color: '#000000', type: 'rounded' }, // Siempre negro para los puntos
        backgroundOptions: { color: '#FFFFFF' }, // Siempre blanco para el fondo del QR
        imageOptions: { crossOrigin: 'anonymous', margin: 5, imageSize: 0.3 },
        cornersSquareOptions: { color: '#000000', type: 'extra-rounded' }, // Siempre negro para las esquinas
        cornersDotOptions: { color: '#000000', type: 'dot' } // Siempre negro para los puntos de las esquinas
      });
      qrCode.append(qrRef.current);
    }
  }, [data]); // Ya no depende del tema, solo de los datos

  if (!data) return null;
  // El contenedor del QR ya tiene un fondo blanco/gris claro en modo oscuro, lo cual es bueno.
  // Aseguramos que el QR interno sea siempre blanco y negro.
  return <div ref={qrRef} className="mx-auto my-4 p-4 bg-white dark:bg-gray-200 inline-block rounded-lg shadow-md"></div>;
};

export default function ConfiguracionPage() {
  const { user, loading: authLoading, refreshUser } = useAuth(); 
  const { theme, setTheme } = useTheme();

  const [userForm, setUserForm] = useState<UserFormState>({
    primer_nombre: "",
    segundo_nombre: null,
    primer_apellido: "",
    segundo_apellido: null,
    correo: ""
  });

  const [seguridad, setSeguridad] = useState<SeguridadState>({
    sesionAutomatica: true, tiempoSesion: "30",
  });

  const [sistema, setSistema] = useState<SistemaState>({
    temaOscuro: false, // Inicializar en falso y dejar que useEffect lo sincronice
    altaResolucion: true, autoGuardado: true, tiempoAutoGuardado: "5",
  });

  const [usersList, setUsersList] = useState<AuthUserInterface[]>([]); 
  const [pageError, setPageError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [isMfaEnabledForUser, setIsMfaEnabledForUser] = useState<boolean>(false);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isMfaLoading, setIsMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaSuccessMessage, setMfaSuccessMessage] = useState<string | null>(null);
  const [mfaCurrentStep, setMfaCurrentStep] = useState<'initial' | 'showQr' | 'verify'>('initial');

  useEffect(() => {
    if (user) {
      console.log("[ConfiguracionPage] useEffect[user] - User from AuthContext:", user);
      setUserForm(prev => ({
        ...prev,
        primer_nombre: user.primer_nombre || '',
        segundo_nombre: user.segundo_nombre || null,
        primer_apellido: user.primer_apellido || '',
        segundo_apellido: user.segundo_apellido || null,
        correo: user.correo || ''
      }));

      console.log("[ConfiguracionPage] useEffect[user] - Setting isMfaEnabledForUser based on user.mfa_enabled:", user.mfa_enabled);
      const mfaStatusFromContext = !!user.mfa_enabled;
      setIsMfaEnabledForUser(mfaStatusFromContext);
                                            
      if (mfaStatusFromContext) {
        setMfaCurrentStep('initial');
        setOtpauthUrl(null);
        setMfaError(null);
        setManualSecret(null); // Asegura limpiar el secret manual
      } else {
        setMfaCurrentStep('initial');
        setOtpauthUrl(null);
        setManualSecret(null);
      }

      // Inicializar valores del formulario solo una vez al cargar el usuario
      setUserForm({
        primer_nombre: user.primer_nombre || '',
        segundo_nombre: user.segundo_nombre || null,
        primer_apellido: user.primer_apellido || '',
        segundo_apellido: user.segundo_apellido || null,
        correo: user.correo || ''
      });
    } else {
      console.log("[ConfiguracionPage] useEffect[user] - No user from AuthContext.");
      setIsMfaEnabledForUser(false);
      setMfaCurrentStep('initial');
    }
  }, [user]);

  // Sincronizar el estado local 'temaOscuro' con next-themes
  useEffect(() => {
    // Asegurarse de que el estado del switch coincida con el tema actual
    if (theme) {
      setSistema(prev => ({ ...prev, temaOscuro: theme === 'dark' }));
    }
  }, [theme]);


  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === 'segundo_nombre' || id === 'segundo_apellido') {
      setUserForm((prev) => ({
        ...prev,
        [id]: value.trim() === '' ? null : value
      }));
    } else if (id === 'correo') {
      setUserForm((prev) => ({
        ...prev,
        [id]: value.toLowerCase().trim()
      }));
    } else {
      setUserForm((prev) => ({
        ...prev,
        [id]: value.trim()
      }));
    }
  };

  const handleSelectChange = (id: keyof SeguridadState | keyof SistemaState, value: string) => {
    if (id in seguridad) {
      setSeguridad((prev) => ({
        ...prev,
        [id as keyof SeguridadState]: value
      }));
    } else if (id in sistema) {
      setSistema((prev) => ({
        ...prev,
        [id as keyof SistemaState]: value
      }));
    }
  };

  const handleSwitchChange = (
    id: keyof SeguridadState | keyof SistemaState, 
    checked: boolean,
  ) => {
    if (id === 'temaOscuro' && id in sistema) { // Special handling for theme switch
      setTheme(checked ? 'dark' : 'light');
      // The useEffect for 'theme' will update sistema.temaOscuro
    } else if (id in seguridad) {
      setSeguridad((prev) => ({ ...prev, [id as keyof SeguridadState]: checked }));
    } else if (id in sistema) {
      setSistema((prev) => ({ ...prev, [id as keyof SistemaState]: checked }));
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      if (user?.roles?.includes("admin")) {
        try {
          setLoadingUsers(true);
          const response = await fetch("/api/dashboard/users");
          const data = await response.json();
          if (response.ok) {
            setUsersList(data.users || []);
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
        setLoadingUsers(false);
      }
    };
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
      await refreshUser();
    } catch (err: any) {
      setMfaError(err.message);
      console.error("[ConfiguracionPage] Error en handleVerifyAndEnableMfa:", err);
    }
    finally { setIsMfaLoading(false); }
  };

  const handleDisableMfa = async () => {
    if (!user?.firebase_uid) {
      setMfaError("No se pudo obtener la información del usuario.");
      return;
    }
    const confirmDisable = window.confirm("¿Estás seguro de que quieres deshabilitar la Autenticación de Dos Factores? Esta acción reducirá la seguridad de tu cuenta.");
    if (!confirmDisable) return;

    setIsMfaLoading(true); setMfaError(null); setMfaSuccessMessage(null);
    try {
      const response = await fetch('/api/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_uid: user.firebase_uid }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al deshabilitar MFA.");
      
      setMfaSuccessMessage(data.message || "Autenticación de Dos Factores deshabilitada.");
      await refreshUser();
      setMfaCurrentStep('initial');
    } catch (err: any) {
      setMfaError(err.message);
      console.error("[ConfiguracionPage] Error en handleDisableMfa:", err);
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Validar campos requeridos
      if (!userForm.primer_nombre?.trim()) {
        toast.error('El primer nombre es requerido');
        return;
      }
      if (!userForm.primer_apellido?.trim()) {
        toast.error('El primer apellido es requerido');
        return;
      }
      if (!userForm.correo?.trim()) {
        toast.error('El correo electrónico es requerido');
        return;
      }

      // Validar formato de correo
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userForm.correo)) {
        toast.error('El formato del correo electrónico no es válido');
        return;
      }

      const response = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar el perfil');
      }

      // Actualizar el contexto con los nuevos datos
      await refreshUser();

      toast.success('Perfil actualizado exitosamente');
    } catch (error: any) {
      console.error('Error al guardar el perfil:', error);
      toast.error(error.message || 'Error al actualizar el perfil');
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen dark:bg-gray-900"><Loader2 className="h-10 w-10 animate-spin text-teal-600 dark:text-teal-400" /> <p className="ml-3 text-lg dark:text-gray-300">Cargando...</p></div>;
  }
  if (!user) {
    console.log("[ConfiguracionPage] No hay usuario, renderizando mensaje de inicio de sesión.");
    return <div className="text-center py-10 dark:text-gray-300 dark:bg-gray-900">Por favor, inicia sesión para acceder a la configuración.</div>;
  }
  if (user.roles && user.roles.includes('paciente')) {
    return (
      <div className="w-full py-8 px-6 max-w-full overflow-x-hidden dark:bg-gray-900">
        <div className="mb-6"><h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Configuración</h1></div>
        <Alert variant="destructive" className="dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4" /><AlertTitle>Acceso Restringido</AlertTitle>
          <AlertDescription>Los pacientes no tienen acceso a esta sección de configuración.</AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log("[ConfiguracionPage] Renderizando UI de MFA. isMfaEnabledForUser:", isMfaEnabledForUser, "user.mfa_enabled del contexto:", user?.mfa_enabled, "mfaCurrentStep:", mfaCurrentStep);

  return (
    <div className="w-full py-8 px-6 max-w-full overflow-x-hidden bg-slate-50 dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-gray-500 dark:text-gray-400">Gestione las preferencias de su cuenta y del sistema</p>
      </div>

      {(loadingUsers && user?.roles?.includes("admin")) ? (
        <div className="text-center text-gray-600 dark:text-gray-400 py-10"><Loader2 className="h-6 w-6 animate-spin inline mr-2" />Cargando datos de configuración...</div>
      ) : pageError ? (
        <Alert variant="destructive" className="dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4" /> <AlertTitle>Error al Cargar Datos</AlertTitle> <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      ) : (
        <div className="w-full">
          {user?.roles?.includes("admin") && (
            <Card className="border-teal-200 dark:border-teal-700/50 shadow-sm mb-6 bg-white dark:bg-gray-800">
              <CardHeader className="bg-teal-50 dark:bg-teal-800/30 dark:border-b dark:border-teal-700/50">
                <CardTitle className="text-teal-700 dark:text-teal-300">Usuarios del Sistema</CardTitle>
                <CardDescription className="dark:text-gray-400">Lista de usuarios registrados en el sistema</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {usersList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">Nombre</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">Correo</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">Roles</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map((userItem) => (
                          <tr key={userItem.id_usuario} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                            <td className="py-3 px-3 font-medium text-gray-800 dark:text-gray-100">{userItem.primer_nombre} {userItem.primer_apellido}</td>
                            <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{userItem.correo}</td>
                            <td className="py-3 px-3 text-gray-600 dark:text-gray-300 capitalize">{(userItem.roles || []).join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (<p className="text-gray-500 dark:text-gray-400 italic">{loadingUsers ? "Cargando usuarios..." : "No se encontraron usuarios."}</p>)}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="perfil" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
              <TabsTrigger value="perfil" className="flex items-center justify-center gap-2 data-[state=active]:bg-teal-600 dark:data-[state=active]:bg-teal-600 data-[state=active]:text-white dark:data-[state=inactive]:text-gray-300">
                <User className="h-4 w-4" /> <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="seguridad" className="flex items-center justify-center gap-2 data-[state=active]:bg-teal-600 dark:data-[state=active]:bg-teal-600 data-[state=active]:text-white dark:data-[state=inactive]:text-gray-300">
                <Shield className="h-4 w-4" /> <span className="hidden sm:inline">Seguridad</span>
              </TabsTrigger>
              <TabsTrigger value="sistema" className="flex items-center justify-center gap-2 data-[state=active]:bg-teal-600 dark:data-[state=active]:bg-teal-600 data-[state=active]:text-white dark:data-[state=inactive]:text-gray-300">
                <Zap className="h-4 w-4" /> <span className="hidden sm:inline">Sistema</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="w-full mt-0">
              <div className="grid grid-cols-1 gap-6">
                <Card className="border-teal-200 dark:border-teal-700/50 shadow-sm h-full bg-white dark:bg-gray-800">
                  <CardHeader className="bg-teal-50 dark:bg-teal-800/30 dark:border-b dark:border-teal-700/50">
                    <CardTitle className="text-teal-700 dark:text-teal-300">Información Personal</CardTitle>
                    <CardDescription className="dark:text-gray-400">Actualice su información personal y de contacto</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primer_nombre" className="dark:text-gray-300">Primer Nombre</Label>
                        <Input id="primer_nombre" value={userForm.primer_nombre} onChange={handleUserFormChange} className="border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-teal-500 focus:ring-teal-500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="segundo_nombre" className="dark:text-gray-300">Segundo Nombre</Label>
                        <Input id="segundo_nombre" value={userForm.segundo_nombre || ""} onChange={handleUserFormChange} className="border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-teal-500 focus:ring-teal-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primer_apellido" className="dark:text-gray-300">Primer Apellido</Label>
                        <Input id="primer_apellido" value={userForm.primer_apellido} onChange={handleUserFormChange} className="border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-teal-500 focus:ring-teal-500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="segundo_apellido" className="dark:text-gray-300">Segundo Apellido</Label>
                        <Input id="segundo_apellido" value={userForm.segundo_apellido || ""} onChange={handleUserFormChange} className="border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-teal-500 focus:ring-teal-500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="correo" className="dark:text-gray-300">Correo Electrónico</Label>
                      <Input id="correo" type="email" value={userForm.correo} onChange={handleUserFormChange} className="border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-teal-500 focus:ring-teal-500" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-4 bg-gray-50 dark:bg-gray-700/50 dark:border-t dark:border-gray-600">
                    <Button 
                      variant="outline" 
                      className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                      onClick={() => {
                        if (user) {
                          setUserForm({
                            primer_nombre: user.primer_nombre || '',
                            segundo_nombre: user.segundo_nombre || null,
                            primer_apellido: user.primer_apellido || '',
                            segundo_apellido: user.segundo_apellido || null,
                            correo: user.correo || ''
                          });
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSaveProfile} 
                      className="bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-700 dark:hover:bg-teal-600"
                    >
                      <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="seguridad" className="w-full mt-0">
              <Card className="border-teal-200 dark:border-teal-700/50 shadow-sm bg-white dark:bg-gray-800">
                <CardHeader className="bg-teal-50 dark:bg-teal-800/30 dark:border-b dark:border-teal-700/50">
                  <CardTitle className="text-teal-700 dark:text-teal-300">Configuración de Seguridad Avanzada</CardTitle>
                  <CardDescription className="dark:text-gray-400">Gestione la autenticación de dos factores y otras opciones de seguridad.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                  <Alert className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" /> <AlertTitle className="font-bold">Importante</AlertTitle>
                    <AlertDescription>Mantener una configuración de seguridad adecuada es esencial.</AlertDescription>
                  </Alert>

                  <div> 
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">Autenticación de Dos Factores (MFA)</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Añade una capa extra de seguridad a tu cuenta usando una aplicación de autenticación TOTP.</p>
                    <Separator className="mb-6 dark:bg-gray-700" />

                    {mfaError && (<Alert variant="destructive" className="mb-4 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300"><AlertCircle className="h-4 w-4" /><AlertTitle>Error de MFA</AlertTitle><AlertDescription>{mfaError}</AlertDescription></Alert>)}
                    {mfaSuccessMessage && mfaCurrentStep === 'initial' && (<Alert variant="default" className="mb-4 bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300"><CheckCircle className="h-4 w-4" /><AlertTitle>Éxito</AlertTitle><AlertDescription>{mfaSuccessMessage}</AlertDescription></Alert>)}

                    {isMfaEnabledForUser && mfaCurrentStep === 'initial' && (
                      <div className="text-center p-4 border border-green-200 bg-green-50 dark:bg-green-900/30 dark:border-green-700 rounded-md">
                        <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto mb-2" />
                        <p className="font-semibold text-green-700 dark:text-green-300 mb-3">La Autenticación de Dos Factores está HABILITADA.</p>
                        <Button onClick={handleDisableMfa} variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-700/50 dark:hover:text-red-300" disabled={isMfaLoading}>
                          {isMfaLoading && mfaCurrentStep === 'initial' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Deshabilitar MFA
                        </Button>
                      </div>
                    )}

                    {!isMfaEnabledForUser && mfaCurrentStep === 'initial' && (
                      <div className="text-left">
                        <p className="text-gray-600 dark:text-gray-400 mb-3">MFA no está activo para tu cuenta.</p>
                        <Button onClick={handleInitiateMfaSetup} disabled={isMfaLoading} className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600">
                          {isMfaLoading && mfaCurrentStep === 'initial' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />} Habilitar Autenticación de Dos Factores
                        </Button>
                      </div>
                    )}

                    {mfaCurrentStep === 'showQr' && otpauthUrl && (
                      <div className="space-y-4 text-center p-4 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50">
                        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Paso 1: Escanea el Código QR</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">Usa tu aplicación de autenticación para escanear este código.</p>
                        <div className="flex justify-center my-3"><QrCodeComponent data={otpauthUrl} /></div>
                        {manualSecret && (
                          <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
                            <p className="font-medium text-gray-700 dark:text-gray-300">O ingresa manualmente este código en tu app:</p>
                            <p className="font-mono text-teal-700 dark:text-teal-400 break-all bg-white dark:bg-gray-600 p-2 my-1 rounded shadow-sm inline-block">{manualSecret}</p>
                          </div>
                        )}
                        <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
                          <Button variant="outline" onClick={() => { setMfaCurrentStep('initial'); setOtpauthUrl(null); setMfaError(null); setMfaSuccessMessage(null); }} disabled={isMfaLoading} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Cancelar</Button>
                          <Button onClick={() => { setMfaCurrentStep('verify'); setMfaError(null); setMfaSuccessMessage(null); }} className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600" disabled={isMfaLoading}>Siguiente: Verificar Código</Button>
                        </div>
                      </div>
                    )}

                    {mfaCurrentStep === 'verify' && (
                      <form onSubmit={handleVerifyAndEnableMfa} className="space-y-4 p-4 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50 max-w-md mx-auto">
                        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 text-center">Paso 2: Verifica tu Código</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Ingresa el código de 6 dígitos generado por tu aplicación.</p>
                        <div>
                          <Label htmlFor="verificationCode" className="sr-only dark:text-gray-300">Código de Verificación</Label>
                          <Input id="verificationCode" type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\s/g, ''))} placeholder="123 456" maxLength={7} pattern="\d{3}\s?\d{3}|\d{6}" required className="text-center text-2xl tracking-widest font-mono h-14 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" disabled={isMfaLoading} />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                          <Button type="button" variant="outline" onClick={() => { setMfaCurrentStep('showQr'); setMfaError(null); }} disabled={isMfaLoading} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Atrás (Ver QR)</Button>
                          <Button type="submit" disabled={isMfaLoading || verificationCode.replace(/\s/g, '').length !== 6} className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600">
                            {isMfaLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Verificar y Activar MFA
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                  <Separator className="my-8 dark:bg-gray-700" />
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Sesiones</h3><Separator className="mb-6 dark:bg-gray-700" />
                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5"><Label htmlFor="auto-login" className="text-base font-medium dark:text-gray-200">Inicio de Sesión Automático</Label><p className="text-sm text-gray-600 dark:text-gray-400">Mantener la sesión iniciada en este dispositivo.</p></div>
                      <Switch id="auto-login" checked={seguridad.sesionAutomatica} onCheckedChange={(checked) => handleSwitchChange("sesionAutomatica", checked)} className="data-[state=checked]:bg-teal-600 dark:data-[state=checked]:bg-teal-500" />
                    </div> <Separator className="dark:bg-gray-700"/>
                    <div className="space-y-2 py-2">
                      <Label htmlFor="session-timeout" className="text-base font-medium dark:text-gray-200">Tiempo de Inactividad para Cierre de Sesión</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo en minutos antes de cerrar la sesión por inactividad.</p>
                      <Select value={seguridad.tiempoSesion} onValueChange={(value) => handleSelectChange("tiempoSesion", value)}>
                        <SelectTrigger id="session-timeout" className="border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-teal-500 focus:ring-teal-500"><SelectValue placeholder="Seleccionar tiempo" /></SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
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
                <CardFooter className="flex justify-end bg-gray-50 dark:bg-gray-700/50 dark:border-t dark:border-gray-600">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-700 dark:hover:bg-teal-600"><Save className="mr-2 h-4 w-4" /> Guardar Configuración de Seguridad</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="sistema" className="w-full mt-0">
              <Card className="border-teal-200 dark:border-teal-700/50 shadow-sm bg-white dark:bg-gray-800">
                <CardHeader className="bg-teal-50 dark:bg-teal-800/30 dark:border-b dark:border-teal-700/50">
                  <CardTitle className="text-teal-700 dark:text-teal-300">Configuración del Sistema</CardTitle>
                  <CardDescription className="dark:text-gray-400">Personalice la apariencia y el comportamiento del sistema</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Apariencia</h3><Separator className="dark:bg-gray-700"/>
                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5"><Label htmlFor="dark-mode" className="text-base dark:text-gray-200">Tema Oscuro</Label><p className="text-sm text-gray-600 dark:text-gray-400">Cambiar a modo oscuro para reducir la fatiga visual</p></div>
                        <Switch
                          id="dark-mode"
                          checked={sistema.temaOscuro} // This now reflects the theme from next-themes via useEffect
                          onCheckedChange={(checked) => handleSwitchChange("temaOscuro", checked)}
                          className="data-[state=checked]:bg-teal-600 dark:data-[state=checked]:bg-teal-500"
                        />
                      </div> <Separator className="dark:bg-gray-700"/>
                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5"><Label htmlFor="high-res" className="text-base dark:text-gray-200">Alta Resolución de Imágenes</Label><p className="text-sm text-gray-600 dark:text-gray-400">Mostrar imágenes médicas en alta resolución</p></div>
                        <Switch id="high-res" checked={sistema.altaResolucion} onCheckedChange={(checked) => handleSwitchChange("altaResolucion", checked)} className="data-[state=checked]:bg-teal-600 dark:data-[state=checked]:bg-teal-500" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Comportamiento</h3><Separator className="dark:bg-gray-700"/>
                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5"><Label htmlFor="auto-save" className="text-base dark:text-gray-200">Guardado Automático</Label><p className="text-sm text-gray-600 dark:text-gray-400">Guardar automáticamente los diagnósticos en progreso</p></div>
                        <Switch id="auto-save" checked={sistema.autoGuardado} onCheckedChange={(checked) => handleSwitchChange("autoGuardado", checked)} className="data-[state=checked]:bg-teal-600 dark:data-[state=checked]:bg-teal-500" />
                      </div> <Separator className="dark:bg-gray-700"/>
                      <div className="space-y-2 py-2">
                        <Label htmlFor="auto-save-time" className="text-base dark:text-gray-200">Intervalo de Guardado Automático</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo en minutos entre guardados automáticos</p>
                        <Select value={sistema.tiempoAutoGuardado} onValueChange={(value) => handleSelectChange("tiempoAutoGuardado", value)}>
                          <SelectTrigger id="auto-save-time" className="border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-teal-500 focus:ring-teal-500"><SelectValue placeholder="Seleccionar intervalo" /></SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                            <SelectItem value="1">1 minuto</SelectItem>
                            <SelectItem value="3">3 minutos</SelectItem>
                            <SelectItem value="5">5 minutos</SelectItem>
                            <SelectItem value="10">10 minutos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end bg-gray-50 dark:bg-gray-700/50 dark:border-t dark:border-gray-600">
                  <Button
                    className="bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-700 dark:hover:bg-teal-600"
                    onClick={() => {
                      Swal.fire({
                        title: '¡Configuración guardada!',
                        text: 'Los cambios del sistema se han aplicado correctamente',
                        icon: 'success',
                        timer: 5000,
                        timerProgressBar: true,
                        showConfirmButton: true,
                        confirmButtonText: 'Aceptar',
                        confirmButtonColor: '#0d9488',
                        background: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))',
                        customClass: {
                          popup: 'dark:bg-gray-800 dark:text-white border dark:border-gray-700',
                          confirmButton: 'dark:!bg-teal-600 dark:hover:!bg-teal-700'
                        }
                      });
                    }}
                  >
                    <Save className="mr-2 h-4 w-4" /> Guardar Configuración
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
