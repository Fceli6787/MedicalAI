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
import { EyeIcon, EyeOffIcon, FileText, UserCircle, Award } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-teal-50 to-white">
      {/* Left side - image/branding */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-center items-center bg-teal-600 p-8">
        <div className="max-w-md text-center">
          <Image
            src="/Logo_sofia.png"
            alt="SOFIA AI Medical Logo"
            width={120}
            height={120}
            className="mx-auto mb-8 rounded-2xl bg-white p-4"
          />
          <h1 className="text-4xl font-bold text-white mb-4">SOFIA AI Medical</h1>
          <p className="text-teal-100 text-lg mb-8">
            Únete a nuestra plataforma y transforma la atención médica con tecnología de vanguardia.
          </p>
          <div className="space-y-6">
            <div className="flex items-center text-white">
              <div className="bg-teal-500 p-2 rounded-full mr-3">
                <FileText size={20} />
              </div>
              <p className="text-left">Acceso a diagnósticos asistidos por IA</p>
            </div>
            <div className="flex items-center text-white">
              <div className="bg-teal-500 p-2 rounded-full mr-3">
                <UserCircle size={20} />
              </div>
              <p className="text-left">Comunidad de profesionales médicos</p>
            </div>
            <div className="flex items-center text-white">
              <div className="bg-teal-500 p-2 rounded-full mr-3">
                <Award size={20} />
              </div>
              <p className="text-left">Desarrollo profesional continuo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">Iniciar Sesión</CardTitle>
            <CardDescription className="text-gray-500">
              Ingrese sus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@sofia.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700">Contraseña</Label>
                  <Link href="#" className="text-xs text-teal-600 hover:text-teal-800">
                    Recuperar Contraseña
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white border-gray-300 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => router.back()}
                className="text-teal-600 hover:text-teal-800"
              >
                Atrás
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-center text-sm text-gray-600">
              ¿No tiene una cuenta?{" "}
              <Link href="/register" className="text-teal-600 hover:text-teal-800 font-medium">
                Registrarse
              </Link>
            </div>
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} SOFIA AI Medical. Todos los derechos reservados.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}