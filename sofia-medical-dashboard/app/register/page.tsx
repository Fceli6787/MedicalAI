"use client"

"use client"

import { useState, useEffect } from "react"; // Importar useEffect
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Importar Select components
import Swal from 'sweetalert2'; // Importar SweetAlert2

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
    const [formData, setFormData] = useState({
        id_tipo_documento: "",
        id_pais: "",
        nui: "",
        primer_nombre: "",
        segundo_nombre: "",
        primer_apellido: "",
        segundo_apellido: "",
        email: "",
        password: "",
        id_especialidad: "", // Campo para especialidad
        numero_tarjeta_profesional: "", // Campo para número de tarjeta profesional
        años_experiencia: "", // Campo para años de experiencia
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [tiposDocumento, setTiposDocumento] = useState([]); // Estado para tipos de documento
    const [paises, setPaises] = useState([]); // Estado para países
    const [especialidades, setEspecialidades] = useState([]); // Estado para especialidades

    // Cargar datos para los selectores (tipos de documento, países, especialidades)
    useEffect(() => {
      const fetchData = async () => {
        try {
          // Aquí deberías tener rutas de API para obtener estos datos
          // Por ahora, usaré placeholders. Necesitarías implementar estas APIs.
          // Ejemplo: const tiposDocRes = await fetch('/api/tipos-documento');
          // const tiposDocData = await tiposDocRes.json();
          // setTiposDocumento(tiposDocData);

          // Placeholder data
          setTiposDocumento([
            { id_tipo_documento: 1, descripcion: "Cédula" },
            { id_tipo_documento: 2, descripcion: "Pasaporte" },
          ] as any);
          setPaises([
            { id_pais: 1, nombre: "Colombia" },
            { id_pais: 2, nombre: "México" },
          ] as any);
          setEspecialidades([
            { id_especialidad: 1, nombre: "Radiología" },
            { id_especialidad: 2, nombre: "Neurología" },
          ] as any);

        } catch (error) {
          console.error("Error fetching select data:", error);
          // Manejar error, quizás mostrar un mensaje al usuario
        }
      };
      fetchData();
    }, []);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: string, value: string) => {
      setFormData((prev) => ({ ...prev, [id]: value }));
    };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            // Enviar todos los datos del formData al backend a través de la función register
            await register({
              ...formData,
              id_tipo_documento: parseInt(formData.id_tipo_documento), // Convertir a número
              id_pais: parseInt(formData.id_pais), // Convertir a número
              id_especialidad: parseInt(formData.id_especialidad), // Convertir a número
              años_experiencia: formData.años_experiencia ? parseInt(formData.años_experiencia) : null, // Convertir a número o null
            });
            // Mostrar SweetAlert2 para registro exitoso
            Swal.fire({
              icon: 'success',
              title: 'Registro exitoso',
              text: 'Tu cuenta ha sido creada.',
              timer: 2000,
              timerProgressBar: true,
              showConfirmButton: false,
            });
            router.push("/login"); // Redirigir a login después de un registro exitoso
        } catch (error: any) {
            console.error("Error en handleSubmit:", error);
            // Mostrar error con SweetAlert2
            Swal.fire({
              icon: 'error',
              title: 'Error en el registro',
              text: error.message || "Error al registrar usuario",
            });
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
            <CardTitle className="text-2xl font-bold text-gray-800">Crear Cuenta de Médico</CardTitle> {/* Título actualizado */}
            <CardDescription className="text-gray-500">
              Completa el formulario para registrarte como médico
            </CardDescription> {/* Descripción actualizada */}
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}
            <div className="space-y-2">
              <Label htmlFor="id_tipo_documento">Tipo de Documento</Label>
              <Select onValueChange={(value) => handleSelectChange("id_tipo_documento", value)} value={formData.id_tipo_documento}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {tiposDocumento.map((tipo: any) => (
                    <SelectItem key={tipo.id_tipo_documento} value={tipo.id_tipo_documento.toString()}>{tipo.descripcion}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="id_pais">País</Label>
              <Select onValueChange={(value) => handleSelectChange("id_pais", value)} value={formData.id_pais}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar país" />
                </SelectTrigger>
                <SelectContent>
                  {paises.map((pais: any) => (
                    <SelectItem key={pais.id_pais} value={pais.id_pais.toString()}>{pais.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
                            <Label htmlFor="nui">NUI</Label>
                            <Input
                                type="text"
                                id="nui"
                                value={formData.nui}
                                onChange={handleChange}
                                required
                            />
                        </div>
            <div className="space-y-2">
                            <Label htmlFor="primer_nombre">Primer Nombre</Label>
                            <Input
                                type="text"
                                id="primer_nombre"
                                value={formData.primer_nombre}
                                onChange={handleChange}
                                required
                            />
                        </div>
            <div className="space-y-2">
                            <Label htmlFor="segundo_nombre">Segundo Nombre (Opcional)</Label>
                            <Input
                                type="text"
                                id="segundo_nombre"
                                value={formData.segundo_nombre}
                                onChange={handleChange}
                            />
                        </div>
            <div className="space-y-2">
                            <Label htmlFor="primer_apellido">Primer Apellido</Label>
                            <Input
                                type="text"
                                id="primer_apellido"
                                value={formData.primer_apellido}
                                onChange={handleChange}
                                required
                            />
                        </div>
            <div className="space-y-2">
                            <Label htmlFor="segundo_apellido">Segundo Apellido (Opcional)</Label>
                            <Input
                                type="text"
                                id="segundo_apellido"
                                value={formData.segundo_apellido}
                                onChange={handleChange}
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
              {/* Campos específicos de médico */}
              <div className="space-y-2">
                <Label htmlFor="id_especialidad">Especialidad</Label>
                <Select onValueChange={(value) => handleSelectChange("id_especialidad", value)} value={formData.id_especialidad}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((especialidad: any) => (
                      <SelectItem key={especialidad.id_especialidad} value={especialidad.id_especialidad.toString()}>{especialidad.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero_tarjeta_profesional">Número de Tarjeta Profesional</Label>
                <Input
                  type="text"
                  id="numero_tarjeta_profesional"
                  value={formData.numero_tarjeta_profesional}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="años_experiencia">Años de Experiencia (Opcional)</Label>
                <Input
                  type="number"
                  id="años_experiencia"
                  value={formData.años_experiencia}
                  onChange={handleChange}
                />
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
