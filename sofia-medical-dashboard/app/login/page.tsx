"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EyeIcon, EyeOffIcon, FileText, UserCircle, Award, Mail, AlertCircle, CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth, User as AuthUserType } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth, sendPasswordResetEmail, AuthError } from "firebase/auth";
import { app } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const { login, user: contextUser, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");
  const [resetErrorMessage, setResetErrorMessage] = useState("");

  const [showMfaStep, setShowMfaStep] = useState(false);
  const [mfaUserUid, setMfaUserUid] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);
  const [totpError, setTotpError] = useState("");

  const authInstance = getAuth(app);

  useEffect(() => {
    if (!authLoading && contextUser && !showMfaStep) {
      router.push("/dashboard");
    }
  }, [contextUser, authLoading, router, showMfaStep]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setTotpError("");
    setShowMfaStep(false);

    try {
      const loggedInUser = await login(email, password);

      if (loggedInUser) {
        console.log("[LoginPage] Login de contraseña exitoso. Usuario:", loggedInUser);
        if (loggedInUser.mfa_enabled) {
          console.log("[LoginPage] MFA está habilitado para el usuario. Mostrando paso de TOTP.");
          setMfaUserUid(loggedInUser.firebase_uid);
          setShowMfaStep(true);
        } else {
          console.log("[LoginPage] MFA NO está habilitado. Redirigiendo al dashboard.");
          router.push("/dashboard");
        }
      } else {
        if (!error) { // Solo setea el error si login() no lo hizo ya (ej. a través de Swal)
            setError("Fallo el inicio de sesión. Por favor, verifica tus credenciales.");
        }
      }
    } catch (err: any) {
      console.error("Error inesperado en handleSubmit de LoginPage:", err);
      setError(err.message || "Ocurrió un error inesperado durante el inicio de sesión.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotpVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validación mejorada de los datos
    if (!mfaUserUid) {
      console.error("[LoginPage] Error: firebase_uid no disponible para verificación MFA");
      setTotpError("Error de autenticación: Identificador de usuario no disponible. Por favor, inicia sesión nuevamente.");
      return;
    }
    
    if (!totpCode) {
      console.error("[LoginPage] Error: Código TOTP vacío");
      setTotpError("Por favor, ingresa el código de verificación de 6 dígitos.");
      return;
    }
    
    if (!/^\d{6}$/.test(totpCode)) {
      console.error("[LoginPage] Error: Formato de código TOTP inválido:", totpCode);
      setTotpError("El código debe contener exactamente 6 dígitos numéricos.");
      return;
    }
    
    console.log(`[LoginPage] Iniciando verificación MFA para usuario con firebase_uid: ${mfaUserUid}`);
    setIsVerifyingTotp(true);
    setTotpError("");

    try {
      // Preparar y mostrar los datos que se enviarán
      const payload = {
        firebase_uid: mfaUserUid,
        token: totpCode
      };
      console.log("[LoginPage] Enviando datos de verificación MFA:", JSON.stringify(payload, null, 2));
      
      const response = await fetch('/api/mfa/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      // Capturar y parsear la respuesta
      const dataText = await response.text();
      let data;
      try {
        data = JSON.parse(dataText);
        console.log("[LoginPage] Respuesta de verificación MFA:", JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error("[LoginPage] Error al parsear la respuesta JSON:", dataText);
        throw new Error("Error al procesar la respuesta del servidor.");
      }

      if (!response.ok) {
        console.error(`[LoginPage] Error HTTP ${response.status} en verificación MFA:`, data.error);
        throw new Error(data.error || `Error ${response.status} al verificar el código TOTP.`);
      }

      if (data.success) {
        console.log("[LoginPage] Verificación TOTP exitosa. Redirigiendo al dashboard.");
        setShowMfaStep(false);
        setTotpCode("");
        setMfaUserUid(null);
        // No es necesario llamar a refreshUser aquí si el onAuthStateChanged del AuthContext
        // ya maneja la actualización del usuario globalmente cuando Firebase confirma el login.
        router.push("/dashboard");
      } else {
        console.warn("[LoginPage] La verificación MFA no fue exitosa:", data.message);
        setTotpError(data.message || "La verificación MFA falló por una razón desconocida.");
      }
    } catch (err: any) {
      console.error("[LoginPage] Error en handleTotpVerification:", err);
      setTotpError(err.message || "Ocurrió un error al verificar el código.");
    } finally {
      setIsVerifyingTotp(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetErrorMessage("Por favor, ingresa tu correo electrónico.");
      setResetSuccessMessage("");
      return;
    }
    setIsResettingPassword(true);
    setResetSuccessMessage("");
    setResetErrorMessage("");
    try {
      await sendPasswordResetEmail(authInstance, resetEmail); // authInstance en lugar de auth
      setResetSuccessMessage(
        "Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico. Por favor, revisa tu bandeja de entrada (y la carpeta de spam)."
      );
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error al enviar correo de restablecimiento:", authError);
      if (authError.code === 'auth/user-not-found') {
        setResetErrorMessage("No se encontró ningún usuario con este correo electrónico.");
      } else if (authError.code === 'auth/invalid-email') {
        setResetErrorMessage("El formato del correo electrónico no es válido.");
      } else {
        setResetErrorMessage(
          "Ocurrió un error al intentar restablecer la contraseña. Por favor, inténtalo de nuevo más tarde."
        );
      }
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (authLoading && !showMfaStep) { // Solo mostrar loader principal si no estamos en el paso de MFA
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-white">
        <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <Dialog open={isResetPasswordModalOpen} onOpenChange={setIsResetPasswordModalOpen}>
      <div className="flex min-h-screen bg-gradient-to-br from-teal-50 to-white">
        <div className="hidden md:flex md:w-1/2 flex-col justify-center items-center bg-teal-600 p-8">
          <div className="max-w-md text-center">
            <Image src="/Logo_sofia.png" alt="SOFIA AI Medical Logo" width={120} height={120} className="mx-auto mb-8 rounded-2xl bg-white p-4 shadow-lg" priority />
            <h1 className="text-4xl font-bold text-white mb-4">SOFIA AI Medical</h1>
            <p className="text-teal-100 text-lg mb-8">Únete a nuestra plataforma y transforma la atención médica con tecnología de vanguardia.</p>
            <div className="space-y-6">
              <div className="flex items-center text-white">
                <div className="bg-teal-500 p-2 rounded-full mr-3"><FileText size={20} /></div>
                <p className="text-left">Acceso a diagnósticos asistidos por IA</p>
              </div>
              <div className="flex items-center text-white">
                <div className="bg-teal-500 p-2 rounded-full mr-3"><UserCircle size={20} /></div>
                <p className="text-left">Comunidad de profesionales médicos</p>
              </div>
              <div className="flex items-center text-white">
                <div className="bg-teal-500 p-2 rounded-full mr-3"><Award size={20} /></div>
                <p className="text-left">Desarrollo profesional continuo</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
          {!showMfaStep ? (
            <Card className="w-full max-w-md border-gray-200 shadow-xl rounded-lg">
              <CardHeader className="space-y-1 text-center pt-8">
                <CardTitle className="text-3xl font-bold text-gray-800">Iniciar Sesión</CardTitle>
                <CardDescription className="text-gray-500 pt-1">Ingrese sus credenciales para acceder al sistema</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error de Inicio de Sesión</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email-login" className="text-gray-700 font-medium">Correo Electrónico</Label>
                    <Input id="email-login" type="email" placeholder="doctor@sofia.ai" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white border-gray-300 h-10 rounded-md" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-login" className="text-gray-700 font-medium">Contraseña</Label>
                      <DialogTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-xs text-teal-600 hover:text-teal-800">Recuperar Contraseña</Button>
                      </DialogTrigger>
                    </div>
                    <div className="relative">
                      <Input id="password-login" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-white border-gray-300 pr-10 h-10 rounded-md" />
                      <button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-600" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-md" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin inline-flex" /> : null}
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3 pt-4 pb-6">
                <div className="text-center text-sm text-gray-600">¿No tiene una cuenta?{" "}
                  <Link href="/register" className="text-teal-600 hover:text-teal-800 font-medium">Registrarse</Link>
                </div>
                <p className="text-xs text-gray-500">© {new Date().getFullYear()} SOFIA AI Medical. Todos los derechos reservados.</p>
              </CardFooter>
            </Card>
          ) : (
            <Card className="w-full max-w-md border-gray-200 shadow-xl rounded-lg">
              <CardHeader className="space-y-1 text-center pt-8">
                <ShieldCheck className="mx-auto h-12 w-12 text-teal-600" />
                <CardTitle className="text-2xl font-bold text-gray-800 pt-2">Verificación de Dos Pasos</CardTitle>
                <CardDescription className="text-gray-500 pt-1">Ingresa el código de tu aplicación de autenticación.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-4">
                <form onSubmit={handleTotpVerification} className="space-y-6">
                  {totpError && (
                    <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error de Verificación</AlertTitle><AlertDescription>{totpError}</AlertDescription></Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="totp-code" className="text-gray-700 font-medium">Código de Autenticación</Label>
                    <Input id="totp-code" type="text" inputMode="numeric" placeholder="123456" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\s/g, ''))} required maxLength={6} pattern="\d{6}" className="bg-white border-gray-300 h-12 rounded-md text-center text-lg tracking-widest font-mono" disabled={isVerifyingTotp} />
                  </div>
                  <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-md" disabled={isVerifyingTotp || totpCode.length !== 6}>
                    {isVerifyingTotp ? <Loader2 className="mr-2 h-4 w-4 animate-spin inline-flex" /> : null}
                    {isVerifyingTotp ? "Verificando..." : "Verificar Código"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3 pt-4 pb-6">
                <Button variant="link" onClick={() => { setShowMfaStep(false); setError("Intento de login cancelado para reingresar credenciales."); setEmail(""); setPassword(""); setTotpCode(""); setMfaUserUid(null); }} className="text-sm text-gray-500 hover:text-teal-700">
                  Volver a ingresar contraseña
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">Restablecer Contraseña</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 pt-1">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordResetRequest} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email" className="text-gray-700 font-medium">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    setResetErrorMessage("");
                    setResetSuccessMessage("");
                  }}
                  required
                  className="pl-10 h-10 rounded-md border-gray-300"
                  disabled={isResettingPassword}
                />
              </div>
            </div>
            {resetSuccessMessage && (
              <Alert variant="default" className="bg-green-50 border-green-300 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Éxito</AlertTitle>
                <AlertDescription>{resetSuccessMessage}</AlertDescription>
              </Alert>
            )}
            {resetErrorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{resetErrorMessage}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md"
                disabled={isResettingPassword}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-md"
                disabled={isResettingPassword}
              >
                {isResettingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isResettingPassword ? "Enviando..." : "Enviar Enlace"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </div>
    </Dialog>
  );
}