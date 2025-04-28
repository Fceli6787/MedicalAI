"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            await register(formData.name, formData.email, formData.password);
            router.push("/login");
        } catch (error: any) {
            console.error(error);
            setError(error.message || "Error al registrar usuario");
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <Card className="border-gray-300 shadow-lg">
          <CardHeader className="flex flex-col items-center space-y-2">
            <div className="flex justify-center">
              <Image
                src="/placeholder.svg"
                alt="SOFIA AI Medical Logo"
                width={64}
                height={64}
                className="rounded-xl bg-teal-500 p-2"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Crear Cuenta</CardTitle>
            <CardDescription className="text-gray-500">
              Completa el formulario para registrarse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}
            <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                type="text"
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                {isLoading ? "Registrando..." : "Registrarse"}
              </Button>
            </form>
            <div className="w-full text-sm text-center mt-3">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="font-medium text-teal-600 hover:text-teal-800">
                Inicia Sesión
              </Link>
            </div>
            <Link href="/" className="w-full text-center font-medium text-teal-600 hover:text-teal-800">Volver</Link>
          </CardContent>
        </Card>
              </div>

    </div>
  )
}
