"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button" 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Trash2, FileText, ChevronLeft, ChevronRight, UserPlus, AlertCircle, Loader2, CalendarIcon } from "lucide-react" 
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover" 
import { Calendar } from "@/components/ui/calendar" 
import { format } from "date-fns" // Importar directamente desde date-fns
import { es } from 'date-fns/locale'; // Importar locale español
import { cn } from "@/lib/utils" 

// Interfaz Paciente actualizada para incluir fecha_nacimiento
interface Paciente {
  id_usuario: number
  primer_nombre: string
  primer_apellido: string
  fecha_nacimiento?: string | null // Campo clave para mostrar
  genero?: string | null 
  // fecha_registro ya no se usa en la tabla
  ultimo_diagnostico?: string | null 
  diagnosticosTotales?: number | null 
  // Añadir otros campos si se obtienen de la API y se necesitan
}

export default function PacientesPage() {
  const { user, loading: authLoading } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pacientes, setPacientes] = useState<Paciente[]>([]) 
  const [loadingPacientes, setLoadingPacientes] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newPatient, setNewPatient] = useState({
    primer_nombre: "", 
    primer_apellido: "", 
    fecha_nacimiento: "", 
    genero: "",
    email: "",
    telefono_contacto: "", 
    direccion_residencial: "", 
    tipoDocumentoCodigo: "",
    paisCodigo: "",
    nui: "",
    segundo_nombre: "",
    segundo_apellido: "",
    grupo_sanguineo: "", 
    ocupacion: "", 
    info_seguro_medico: "", 
    contacto_emergencia: "", 
  })

  const { toast } = useToast()
  const itemsPerPage = 10

  // --- Función para formatear fecha ---
  const formatDisplayDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    try {
      // Asume que la fecha viene como YYYY-MM-DD
      const date = new Date(dateString + 'T00:00:00'); // Añadir T00:00:00 para evitar problemas de zona horaria
      return format(date, 'dd/MM/yyyy', { locale: es }); // Formato dd/MM/yyyy
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Fecha inválida";
    }
  };

  // --- Data Fetching Function ---
  const fetchData = async () => {
    if (!user || user.rol === "paciente") {
      setError(user && user.rol === "paciente" ? "No tiene permisos para acceder a esta página." : null)
      setLoadingPacientes(false)
      setPacientes([]) 
      return
    }

    setLoadingPacientes(true) 
    setError(null) 

    try {
      // Asegúrate que esta API devuelva 'fecha_nacimiento' para cada paciente
      const response = await fetch("/api/dashboard/pacientes") 
      const data = await response.json()

      if (response.ok && data.pacientes) {
        const validatedPacientes = data.pacientes.map((p: any) => ({
          id_usuario: p.id_usuario,
          primer_nombre: p.primer_nombre || "Sin nombre",
          primer_apellido: p.primer_apellido || "Sin apellido",
          fecha_nacimiento: p.fecha_nacimiento, // Obtener fecha_nacimiento de la API
          genero: p.genero,
          // fecha_registro ya no es necesario mapearlo para la tabla
          ultimo_diagnostico: p.ultimo_diagnostico,
          diagnosticosTotales: p.diagnosticosTotales || 0, 
        }))
        setPacientes(validatedPacientes)
      } else {
        setError(data.error || "Error al cargar los pacientes. Intente de nuevo.")
        setPacientes([]) 
      }
    } catch (err) {
      console.error("Error fetching patients:", err)
      setError("No se pudo conectar al servidor para cargar los pacientes.")
      setPacientes([]) 
    } finally {
      setLoadingPacientes(false) 
    }
  }

  // --- Data Fetching Effect ---
  useEffect(() => {
    if (!authLoading) {
      fetchData()
    }
  }, [user, authLoading]) 

  // --- Filtering Logic ---
  const filteredPacientes = pacientes.filter((paciente) => {
    const fullName = `${paciente.primer_nombre} ${paciente.primer_apellido}`.toLowerCase()
    const idString = paciente.id_usuario?.toString().toLowerCase() || ""
    const searchTermLower = searchTerm.toLowerCase()
    return fullName.includes(searchTermLower) || idString.includes(searchTermLower)
  })

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredPacientes.length / itemsPerPage)
  const paginatedPacientes = filteredPacientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  // --- Add Patient Dialog Logic ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setNewPatient((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (value: string) => {
    setNewPatient((prev) => ({ ...prev, genero: value }))
  }

  const handleAddPatientSubmit = async () => {
    if (!newPatient.primer_nombre || !newPatient.primer_apellido || !newPatient.tipoDocumentoCodigo || !newPatient.paisCodigo || !newPatient.email || !newPatient.nui) {
       toast({
         title: "Campos Requeridos",
         description: "Por favor, complete todos los campos obligatorios.",
         variant: "destructive",
       });
       return;
    }

    const temporaryPassword = Math.random().toString(36).slice(-8); 

    const patientDataForApi = {
      tipoDocumentoCodigo: newPatient.tipoDocumentoCodigo,
      paisCodigo: newPatient.paisCodigo,
      nui: newPatient.nui,
      primer_nombre: newPatient.primer_nombre,
      segundo_nombre: newPatient.segundo_nombre || null,
      primer_apellido: newPatient.primer_apellido,
      segundo_apellido: newPatient.segundo_apellido || null,
      email: newPatient.email,
      password: temporaryPassword, 
      fecha_nacimiento: newPatient.fecha_nacimiento || null, 
      genero: newPatient.genero || null,
      telefono_contacto: newPatient.telefono_contacto || null,
      direccion_residencial: newPatient.direccion_residencial || null,
      grupo_sanguineo: newPatient.grupo_sanguineo || null, 
      ocupacion: newPatient.ocupacion || null, 
      info_seguro_medico: newPatient.info_seguro_medico || null, 
      contacto_emergencia: newPatient.contacto_emergencia || null, 
      alergias: null, 
      antecedentes_medicos: null, 
      historial_visitas: null, 
    };

    setLoadingPacientes(true); 
    try {
      const response = await fetch("/api/pacientes/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patientDataForApi),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Paciente Agregado",
          description: `El paciente ${newPatient.primer_nombre} ${newPatient.primer_apellido} ha sido registrado exitosamente.`,
          variant: "default",
        });
        setIsAddDialogOpen(false); 
        // Reset form
        setNewPatient({
          primer_nombre: "",
          primer_apellido: "",
          fecha_nacimiento: "",
          genero: "",
          email: "",
          telefono_contacto: "",
          direccion_residencial: "",
          tipoDocumentoCodigo: "",
          paisCodigo: "",
          nui: "",
          segundo_nombre: "",
          segundo_apellido: "",
          grupo_sanguineo: "", 
          ocupacion: "", 
          info_seguro_medico: "", 
          contacto_emergencia: "", 
        });
        fetchData(); // Re-fetch patients list
      } else {
        console.error("API Error:", result.error);
        toast({
          title: "Error al agregar paciente",
          description: result.error || "Ocurrió un error al registrar el paciente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor para registrar el paciente.",
        variant: "destructive",
      });
    } finally {
      setLoadingPacientes(false); 
    }
  };

  // --- Render Loading State ---
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full p-6">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <span className="ml-2 text-gray-600">Verificando autenticación...</span>
      </div>
    )
  }

  // --- Render Unauthorized State ---
  if (!user || user.rol === "paciente") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] w-full p-6 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700 mb-2">Acceso Denegado</h2>
        <p className="text-red-600 text-center">No tiene los permisos necesarios para ver esta sección.</p>
      </div>
    )
  }

  // --- Main Content Render ---
  return (
    <div className="p-6 space-y-6 w-full">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Gestión de Pacientes</h1>
          <p className="text-sm text-gray-500 mt-1">Administre la información y registros de sus pacientes.</p>
        </div>
        {/* Add Patient Button Trigger */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Paciente
            </Button>
          </DialogTrigger>
          {/* Add Patient Dialog Content */}
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
              <DialogDescription>
                Complete los detalles del nuevo paciente. Haga clic en guardar al finalizar.
              </DialogDescription>
            </DialogHeader>
            {/* Form Grid */}
            <div className="grid gap-6 py-4">
              {/* ... (Contenido del formulario sin cambios) ... */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primer_nombre">
                    Primer Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="primer_nombre"
                    value={newPatient.primer_nombre}
                    onChange={handleInputChange}
                    placeholder="Ingrese el primer nombre"
                    required
                  />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="segundo_nombre">Segundo Nombre</Label>
                    <Input
                      id="segundo_nombre"
                      value={newPatient.segundo_nombre}
                      onChange={handleInputChange}
                      placeholder="Ingrese el segundo nombre"
                    />
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="primer_apellido">
                    Primer Apellido <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="primer_apellido"
                    value={newPatient.primer_apellido}
                    onChange={handleInputChange}
                    placeholder="Ingrese el primer apellido"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-2">
                  <Label htmlFor="segundo_apellido">Segundo Apellido</Label>
                  <Input
                    id="segundo_apellido"
                    value={newPatient.segundo_apellido}
                    onChange={handleInputChange}
                    placeholder="Ingrese el segundo apellido"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoDocumentoCodigo">
                    Tipo Documento <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={(value) => setNewPatient((prev) => ({ ...prev, tipoDocumentoCodigo: value }))} value={newPatient.tipoDocumentoCodigo}>
                    <SelectTrigger id="tipoDocumentoCodigo">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                      <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                      <SelectItem value="PS">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="nui">
                    NUI <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nui"
                    value={newPatient.nui}
                    onChange={handleInputChange}
                    placeholder="Ingrese el NUI"
                    required
                  />
                </div>
              </div>
               <div className="space-y-2">
                  <Label htmlFor="paisCodigo">
                    País <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={(value) => setNewPatient((prev) => ({ ...prev, paisCodigo: value }))} value={newPatient.paisCodigo}>
                    <SelectTrigger id="paisCodigo">
                      <SelectValue placeholder="Seleccionar país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COL">Colombia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label> 
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newPatient.fecha_nacimiento && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newPatient.fecha_nacimiento ? formatDisplayDate(newPatient.fecha_nacimiento) : <span>Seleccionar fecha</span>} 
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newPatient.fecha_nacimiento ? new Date(newPatient.fecha_nacimiento + 'T00:00:00') : undefined} // Ajuste para evitar problemas de zona horaria al seleccionar
                        onSelect={(date) => {
                          setNewPatient((prev) => ({
                            ...prev,
                            fecha_nacimiento: date ? format(date, 'yyyy-MM-dd') : "", // Guardar en estado como yyyy-MM-dd
                          }));
                        }}
                        initialFocus
                        captionLayout="dropdown-buttons" // Permite seleccionar mes y año fácilmente
                        fromYear={1900} // Rango de años razonable
                        toYear={new Date().getFullYear()} // Hasta el año actual
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genero">Género</Label>
                  <Select onValueChange={handleSelectChange} value={newPatient.genero}>
                    <SelectTrigger id="genero">
                      <SelectValue placeholder="Seleccionar género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                      <SelectItem value="no_especificado">Prefiero no decir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Correo Electrónico <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newPatient.email}
                  onChange={handleInputChange}
                  placeholder="paciente@ejemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono_contacto">Teléfono</Label> 
                <Input
                  id="telefono_contacto"
                  value={newPatient.telefono_contacto}
                  onChange={handleInputChange}
                  placeholder="Ej: 3001234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion_residencial">Dirección</Label> 
                <Input
                  id="direccion_residencial"
                  value={newPatient.direccion_residencial}
                  onChange={handleInputChange}
                  placeholder="Ej: Calle 10 # 20-30"
                />
              </div>
               <div className="space-y-2">
                 <Label htmlFor="grupo_sanguineo">Grupo Sanguíneo</Label> 
                 <Select onValueChange={(value) => setNewPatient((prev) => ({ ...prev, grupo_sanguineo: value }))} value={newPatient.grupo_sanguineo}>
                   <SelectTrigger id="grupo_sanguineo">
                     <SelectValue placeholder="Seleccionar grupo" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="A+">A+</SelectItem>
                     <SelectItem value="A-">A-</SelectItem>
                     <SelectItem value="B+">B+</SelectItem>
                     <SelectItem value="B-">B-</SelectItem>
                     <SelectItem value="AB+">AB+</SelectItem>
                     <SelectItem value="AB-">AB-</SelectItem>
                     <SelectItem value="O+">O+</SelectItem>
                     <SelectItem value="O-">O-</SelectItem>
                     <SelectItem value="Desconocido">Desconocido</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="ocupacion">Ocupación</Label> 
                 <Input
                   id="ocupacion"
                   value={newPatient.ocupacion}
                   onChange={handleInputChange}
                   placeholder="Ej: Ingeniero"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="info_seguro_medico">Información Seguro Médico</Label> 
                  <Select onValueChange={(value) => setNewPatient((prev) => ({ ...prev, info_seguro_medico: value }))} value={newPatient.info_seguro_medico}>
                   <SelectTrigger id="info_seguro_medico">
                     <SelectValue placeholder="Seleccionar seguro" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="EPS Sura">EPS Sura</SelectItem>
                     <SelectItem value="EPS Sanitas">EPS Sanitas</SelectItem>
                     <SelectItem value="EPS Nueva EPS">EPS Nueva EPS</SelectItem>
                     <SelectItem value="Medicina Prepagada Colsanitas">Medicina Prepagada Colsanitas</SelectItem>
                     <SelectItem value="Particular">Particular</SelectItem>
                     <SelectItem value="Otro">Otro</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="contacto_emergencia">Contacto de Emergencia</Label> 
                 <Input
                   id="contacto_emergencia"
                   value={newPatient.contacto_emergencia}
                   onChange={handleInputChange}
                   placeholder="Nombre y Teléfono"
                 />
               </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAddPatientSubmit}
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={!newPatient.primer_nombre || !newPatient.primer_apellido || !newPatient.tipoDocumentoCodigo || !newPatient.paisCodigo || !newPatient.email || !newPatient.nui} 
              >
                Guardar Paciente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 2. Main Content Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Lista de Pacientes</CardTitle>
              <CardDescription className="mt-1">
                {loadingPacientes ? "Cargando pacientes..." : `${filteredPacientes.length} paciente(s) encontrado(s)`}
              </CardDescription>
            </div>
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o ID..."
                className="pl-8 w-full" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) 
                }}
                disabled={loadingPacientes} 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Tabs for Filtering (Optional) */}
          <Tabs defaultValue="todos" className="space-y-4">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="recientes" disabled>
                Recientes (Próximamente)
              </TabsTrigger>
              <TabsTrigger value="sin-diagnostico" disabled>
                Sin Diagnóstico (Próximamente)
              </TabsTrigger>
            </TabsList>

            {/* Content for "Todos" Tab */}
            <TabsContent value="todos" className="space-y-4">
              {/* Render Error State */}
              {error && !loadingPacientes && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Table Container */}
              <div className="rounded-md border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  {" "}
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[80px] px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre Completo
                        </TableHead>
                        {/* --- MODIFICACIÓN: Encabezado Edad -> Fecha Nac. --- */}
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Nac. 
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Género
                        </TableHead>
                        {/* --- MODIFICACIÓN: Eliminar Encabezado Fecha Reg. --- */}
                        {/* <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Reg.
                        </TableHead> */}
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Último Diag.
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                          Total Diag.
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Loading State within Table */}
                      {loadingPacientes && (
                        <TableRow>
                          {/* --- MODIFICACIÓN: Ajustar colSpan (de 8 a 7) --- */}
                          <TableCell colSpan={7} className="h-32 text-center"> 
                            <div className="flex justify-center items-center text-gray-500">
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              Cargando datos...
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {/* No Results State */}
                      {!loadingPacientes && !error && paginatedPacientes.length === 0 && (
                        <TableRow>
                           {/* --- MODIFICACIÓN: Ajustar colSpan (de 8 a 7) --- */}
                          <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                            No se encontraron pacientes {searchTerm ? "que coincidan con la búsqueda." : "."}
                          </TableCell>
                        </TableRow>
                      )}
                      {/* Patient Data Rows */}
                      {!loadingPacientes &&
                        !error &&
                        paginatedPacientes.map((paciente) => (
                          <TableRow key={paciente.id_usuario} className="hover:bg-gray-50">
                            <TableCell className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                              {paciente.id_usuario}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-700 whitespace-nowrap">{`${paciente.primer_nombre} ${paciente.primer_apellido}`}</TableCell>
                            {/* --- MODIFICACIÓN: Celda Edad -> Fecha Nac. --- */}
                            <TableCell className="px-4 py-3 text-gray-500 whitespace-nowrap">
                              {formatDisplayDate(paciente.fecha_nacimiento)} 
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 capitalize">
                              {paciente.genero ?? "N/A"}
                            </TableCell>
                            {/* --- MODIFICACIÓN: Eliminar Celda Fecha Reg. --- */}
                            {/* <TableCell className="px-4 py-3 text-gray-500 whitespace-nowrap">
                              {paciente.fecha_registro ?? "N/A"}
                            </TableCell> */}
                            <TableCell className="px-4 py-3 text-gray-500">
                              {paciente.ultimo_diagnostico ? (
                                <span className="text-sm">{paciente.ultimo_diagnostico}</span>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-amber-300 bg-amber-50 text-amber-800 font-normal text-xs py-0.5 px-2"
                                >
                                  Sin diagnóstico
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-center">
                              {paciente.diagnosticosTotales ?? 0}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex justify-end items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-gray-500 hover:text-blue-600 hover:bg-blue-100"
                                  title="Ver historial"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-gray-500 hover:text-yellow-600 hover:bg-yellow-100"
                                  title="Editar paciente"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-gray-500 hover:text-red-600 hover:bg-red-100"
                                  title="Eliminar paciente"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination Controls */}
              {!loadingPacientes && !error && filteredPacientes.length > itemsPerPage && (
                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
                  <div className="text-sm text-gray-500">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                    {Math.min(currentPage * itemsPerPage, filteredPacientes.length)} de {filteredPacientes.length}{" "}
                    pacientes
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium text-gray-700">
                      Página {currentPage} de {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Página siguiente"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Placeholder for other tabs */}
            <TabsContent value="recientes">
              <p className="text-center text-gray-500 py-10">
                Funcionalidad de pacientes recientes estará disponible pronto.
              </p>
            </TabsContent>
            <TabsContent value="sin-diagnostico">
              <p className="text-center text-gray-500 py-10">
                Funcionalidad de pacientes sin diagnóstico estará disponible pronto.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
