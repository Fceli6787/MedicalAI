"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { EyeIcon, EyeOffIcon, UserCircle, Globe, FileText, Award, Mail, Lock, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Swal from 'sweetalert2';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [formProgress, setFormProgress] = useState(25);
  
  const [formData, setFormData] = useState({
    tipoDocumentoCodigo: "",
    paisCodigo: "",
    nui: "",
    primer_nombre: "",
    segundo_nombre: "",
    primer_apellido: "",
    segundo_apellido: "",
    email: "",
    password: "",
    id_especialidad: "",
    numero_tarjeta_profesional: "",
    años_experiencia: "",
  });
  
  // Estado para validación de contraseña
  const [passwordValidation, setPasswordValidation] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasMinLength: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [paises, setPaises] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);

  // Cargar datos para los selectores
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Placeholder data con códigos
        setTiposDocumento([
          { id_tipo_documento: 1, codigo: "CC", descripcion: "Cédula de Ciudadanía" },
          { id_tipo_documento: 2, codigo: "CE", descripcion: "Cédula de Extranjería" },
          { id_tipo_documento: 3, codigo: "PS", descripcion: "Pasaporte" },
        ] as any);
        setPaises([
          { id_pais: 1, codigo: "COL", nombre: "Colombia" },
          { id_pais: 2, codigo: "MEX", nombre: "México" },
          { id_pais: 3, codigo: "ESP", nombre: "España" },
          { id_pais: 4, codigo: "ARG", nombre: "Argentina" },
        ] as any);
        setEspecialidades([
          { id_especialidad: 1, nombre: "Radiología" },
          { id_especialidad: 2, nombre: "Neurología" },
          { id_especialidad: 3, nombre: "Cardiología" },
          { id_especialidad: 4, nombre: "Dermatología" },
          { id_especialidad: 5, nombre: "Pediatría" },
        ] as any);
      } catch (error) {
        console.error("Error fetching select data:", error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (id) {
      setFormData((prev) => ({ ...prev, [id]: value }));
      
      // Actualizar validación de contraseña si el campo es password
      if (id === "password") {
        setPasswordValidation({
          hasUpperCase: /[A-Z]/.test(value),
          hasLowerCase: /[a-z]/.test(value),
          hasNumber: /[0-9]/.test(value),
          hasMinLength: value.length >= 8,
        });
      }
    }
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const goToNextTab = () => {
    if (activeTab === "personal") {
      setActiveTab("account");
      setFormProgress(50);
    } else if (activeTab === "account") {
      setActiveTab("professional");
      setFormProgress(75);
    }
  };

  const goToPrevTab = () => {
    if (activeTab === "account") {
      setActiveTab("personal");
      setFormProgress(25);
    } else if (activeTab === "professional") {
      setActiveTab("account");
      setFormProgress(50);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await register({
        ...formData,
        id_especialidad: parseInt(formData.id_especialidad),
        años_experiencia: formData.años_experiencia ? parseInt(formData.años_experiencia) : null,
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Registro exitoso',
        text: 'Tu cuenta ha sido creada correctamente.',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      router.push("/login");
    } catch (error: any) {
      console.error("Error en registro:", error);
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
      
      {/* Right side - registration form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center md:hidden">
                <Image
                  src="/placeholder.svg"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="rounded-xl bg-teal-500 p-1 mr-2"
                />
                <span className="font-bold text-teal-600">SOFIA AI Medical</span>
              </div>
              <div className="flex gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="text-teal-600 border-teal-600">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold text-gray-800">Registro de Médico</CardTitle>
            <CardDescription className="text-gray-500">
              Complete el formulario para unirse a nuestra plataforma
            </CardDescription>
            
            <div className="mt-4">
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-teal-500 transition-all duration-300" 
                  style={{ width: `${formProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Datos Personales</span>
                <span>Cuenta</span>
                <span>Información Profesional</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 mb-4">{error}</div>
              )}
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Datos Personales */}
                <TabsContent value="personal" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="tipoDocumentoCodigo" className="text-gray-700">
                        Tipo de Documento
                      </Label>
                      <Select 
                        onValueChange={(value) => handleSelectChange("tipoDocumentoCodigo", value)} 
                        value={formData.tipoDocumentoCodigo}
                      >
                        <SelectTrigger className="bg-white border-gray-300">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposDocumento.map((tipo: any) => (
                            <SelectItem key={tipo.id_tipo_documento} value={tipo.codigo}>
                              {tipo.descripcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="nui" className="text-gray-700">NUI</Label>
                      <Input
                        type="text"
                        id="nui"
                        value={formData.nui}
                        onChange={handleChange}
                        className="bg-white border-gray-300"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="primer_nombre" className="text-gray-700">Primer Nombre</Label>
                      <Input
                        type="text"
                        id="primer_nombre"
                        value={formData.primer_nombre}
                        onChange={handleChange}
                        className="bg-white border-gray-300"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="segundo_nombre" className="text-gray-700">Segundo Nombre</Label>
                      <Input
                        type="text"
                        id="segundo_nombre"
                        value={formData.segundo_nombre}
                        onChange={handleChange}
                        className="bg-white border-gray-300"
                      />
                    </div>
                    
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="primer_apellido" className="text-gray-700">Primer Apellido</Label>
                      <Input
                        type="text"
                        id="primer_apellido"
                        value={formData.primer_apellido}
                        onChange={handleChange}
                        className="bg-white border-gray-300"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="segundo_apellido" className="text-gray-700">Segundo Apellido</Label>
                      <Input
                        type="text"
                        id="segundo_apellido"
                        value={formData.segundo_apellido}
                        onChange={handleChange}
                        className="bg-white border-gray-300"
                      />
                    </div>
                    
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="paisCodigo" className="text-gray-700">País</Label>
                      <Select 
                        onValueChange={(value) => handleSelectChange("paisCodigo", value)} 
                        value={formData.paisCodigo}
                      >
                        <SelectTrigger className="bg-white border-gray-300">
                          <SelectValue placeholder="Seleccionar país" />
                        </SelectTrigger>
                        <SelectContent>
                          {paises.map((pais: any) => (
                            <SelectItem key={pais.id_pais} value={pais.codigo}>
                              {pais.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button 
                      type="button" 
                      onClick={goToNextTab}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      Siguiente
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Cuenta */}
                <TabsContent value="account" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-teal-600" />
                        Correo Electrónico
                      </div>
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="bg-white border-gray-300"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700">
                      <div className="flex items-center">
                        <Lock className="h-4 w-4 mr-2 text-teal-600" />
                        Contraseña
                      </div>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="bg-white border-gray-300"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        La contraseña debería cumplir con los siguientes requerimientos:
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-2 ${
                            /[A-Z]/.test(formData.password) 
                              ? "bg-green-100 text-green-600" 
                              : "bg-red-100 text-red-500"
                          }`}>
                            {/[A-Z]/.test(formData.password) 
                              ? <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              : <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            }
                          </div>
                          <span className={`text-xs ${
                            /[A-Z]/.test(formData.password) 
                              ? "text-green-600" 
                              : "text-red-500"
                          }`}>
                            Al menos debería tener <span className="font-semibold">una letra mayúscula</span>
                          </span>
                        </div>

                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-2 ${
                            /[a-z]/.test(formData.password) 
                              ? "bg-green-100 text-green-600" 
                              : "bg-red-100 text-red-500"
                          }`}>
                            {/[a-z]/.test(formData.password) 
                              ? <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              : <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            }
                          </div>
                          <span className={`text-xs ${
                            /[a-z]/.test(formData.password) 
                              ? "text-green-600" 
                              : "text-red-500"
                          }`}>
                            Al menos debería tener <span className="font-semibold">una letra minúscula</span>
                          </span>
                        </div>

                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-2 ${
                            /[0-9]/.test(formData.password) 
                              ? "bg-green-100 text-green-600" 
                              : "bg-red-100 text-red-500"
                          }`}>
                            {/[0-9]/.test(formData.password) 
                              ? <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              : <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            }
                          </div>
                          <span className={`text-xs ${
                            /[0-9]/.test(formData.password) 
                              ? "text-green-600" 
                              : "text-red-500"
                          }`}>
                            Al menos debería tener <span className="font-semibold">un número</span>
                          </span>
                        </div>

                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-2 ${
                            formData.password.length >= 8 
                              ? "bg-green-100 text-green-600" 
                              : "bg-red-100 text-red-500"
                          }`}>
                            {formData.password.length >= 8 
                              ? <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              : <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            }
                          </div>
                          <span className={`text-xs ${
                            formData.password.length >= 8 
                              ? "text-green-600" 
                              : "text-red-500"
                          }`}>
                            Debería tener <span className="font-semibold">8 caracteres como mínimo</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-between">
                    <Button 
                      type="button" 
                      onClick={goToPrevTab}
                      variant="outline"
                      className="border-teal-600 text-teal-600"
                    >
                      Atrás
                    </Button>
                    <Button 
                      type="button" 
                      onClick={goToNextTab}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      Siguiente
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Información Profesional */}
                <TabsContent value="professional" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="id_especialidad" className="text-gray-700">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2 text-teal-600" />
                        Especialidad
                      </div>
                    </Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange("id_especialidad", value)} 
                      value={formData.id_especialidad}
                    >
                      <SelectTrigger className="bg-white border-gray-300">
                        <SelectValue placeholder="Seleccionar especialidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {especialidades.map((especialidad: any) => (
                          <SelectItem key={especialidad.id_especialidad} value={especialidad.id_especialidad.toString()}>
                            {especialidad.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="numero_tarjeta_profesional" className="text-gray-700">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-teal-600" />
                        Número de Tarjeta Profesional
                      </div>
                    </Label>
                    <Input
                      type="text"
                      id="numero_tarjeta_profesional"
                      value={formData.numero_tarjeta_profesional}
                      onChange={handleChange}
                      className="bg-white border-gray-300"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="años_experiencia" className="text-gray-700">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-teal-600" />
                        Años de Experiencia
                      </div>
                    </Label>
                    <Input
                      type="number"
                      id="años_experiencia"
                      value={formData.años_experiencia}
                      onChange={handleChange}
                      className="bg-white border-gray-300"
                      min="0"
                      max="70"
                    />
                  </div>
                  
                  <div className="pt-4 flex flex-col space-y-4">
                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        onClick={goToPrevTab}
                        variant="outline"
                        className="border-teal-600 text-teal-600"
                      >
                        Atrás
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-teal-600 hover:bg-teal-700"
                        disabled={isLoading}
                      >
                        {isLoading ? "Registrando..." : "Completar Registro"}
                      </Button>
                    </div>
                    
                    <p className="text-xs text-center text-gray-500 mt-4">
                      Al registrarte aceptas nuestros <a href="#" className="text-teal-600 hover:underline">Términos y Condiciones</a> y <a href="#" className="text-teal-600 hover:underline">Política de Privacidad</a>.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </CardContent>
          
          <CardFooter className="flex-col space-y-4 pt-0">
            <Separator className="my-2" />
            <div className="text-xs text-center text-gray-500">
              SOFIA AI Medical © 2025 - Todos los derechos reservados
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}