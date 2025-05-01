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
import { EyeIcon, EyeOffIcon } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 to-white p-4">
      <Card className="mx-auto w-full max-w-md border-teal-100 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center">
              <Image src="/Logo_sofia.png" alt="SOFIA AI Medical Logo" width={120} height={120}/>
          </div>
          <CardTitle className="text-2xl font-bold text-teal-800">Iniciar Sesión</CardTitle>
          <CardDescription>Ingrese sus credenciales para acceder al sistema</CardDescription>{" "}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>} <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label> <Input id="email" type="email" placeholder="doctor@sofia.ai" value={email} onChange={(e) => setEmail(e.target.value)} required className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" />
            </div> <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label> <Link href="#" className="text-xs text-teal-600 hover:text-teal-800">Recuperar Contraseña</Link>
              </div> <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="border-gray-300 pr-10 focus:border-teal-500 focus:ring-teal-500" /> <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />} </button>
              </div>
            </div> <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"} </Button>
          </form>
          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => router.back()} className="font-medium text-teal-600 hover:text-teal-800">Atrás</Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm">
            ¿No tiene una cuenta? <Link href="/register" className="font-medium text-teal-600 hover:text-teal-800">Registrarse</Link>{" "}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
