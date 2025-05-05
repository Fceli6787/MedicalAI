"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button" // Assuming Button includes buttonVariants
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
import { Search, Edit, Trash2, FileText, ChevronLeft, ChevronRight, UserPlus, AlertCircle, Loader2 } from "lucide-react" // Added Loader2
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/components/ui/use-toast"
// Removed cn and Link as they weren't used in the provided snippet after refactor focus

// Define the structure of a patient based on usage
interface Paciente {
  id_usuario: number
  primer_nombre: string
  primer_apellido: string
  edad?: number | null // Made optional as it might be missing
  genero?: string | null // Made optional
  fecha_registro?: string | null // Made optional
  ultimo_diagnostico?: string | null // Made optional
  diagnosticosTotales?: number | null // Made optional
  // Add other potential fields if needed
}

export default function PacientesPage() {
  const { user, loading: authLoading } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pacientes, setPacientes] = useState<Paciente[]>([]) // Use the interface
  const [loadingPacientes, setLoadingPacientes] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newPatient, setNewPatient] = useState({
    nombre: "",
    apellido: "",
    edad: "",
    genero: "",
    email: "",
    telefono: "",
    direccion: "",
  })

  const { toast } = useToast()
  const itemsPerPage = 10

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchData = async () => {
      // Ensure user is loaded and has the correct role before fetching
      if (!user || user.rol === "paciente") {
        setError(user && user.rol === "paciente" ? "No tiene permisos para acceder a esta página." : null)
        setLoadingPacientes(false)
        setPacientes([]) // Clear patients if not authorized
        return
      }

      setLoadingPacientes(true) // Start loading state for fetch
      setError(null) // Reset error before fetch

      try {
        const response = await fetch("/api/dashboard/pacientes")
        const data = await response.json()

        if (response.ok && data.pacientes) {
          // Basic validation/transformation if needed
          const validatedPacientes = data.pacientes.map((p: any) => ({
            id_usuario: p.id_usuario,
            primer_nombre: p.primer_nombre || "Sin nombre",
            primer_apellido: p.primer_apellido || "Sin apellido",
            edad: p.edad,
            genero: p.genero,
            fecha_registro: p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString() : "N/A", // Format date
            ultimo_diagnostico: p.ultimo_diagnostico,
            diagnosticosTotales: p.diagnosticosTotales || 0, // Default to 0
          }))
          setPacientes(validatedPacientes)
        } else {
          setError(data.error || "Error al cargar los pacientes. Intente de nuevo.")
          setPacientes([]) // Clear patients on error
        }
      } catch (err) {
        console.error("Error fetching patients:", err)
        setError("No se pudo conectar al servidor para cargar los pacientes.")
        setPacientes([]) // Clear patients on fetch error
      } finally {
        setLoadingPacientes(false) // End loading state
      }
    }

    // Fetch data only when auth is resolved
    if (!authLoading) {
      fetchData()
    }
  }, [user, authLoading]) // Re-fetch if user or authLoading changes

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
    // TODO: Implement actual API call to add patient
    console.log("Adding patient (simulated):", newPatient)

    // Simulate API call feedback
    toast({
      title: "Paciente Agregado (Simulado)",
      description: `El paciente ${newPatient.nombre} ${newPatient.apellido} ha sido agregado (simulación).`,
      variant: "default", // Use default variant for success simulation
    })

    setIsAddDialogOpen(false) // Close dialog
    // Reset form
    setNewPatient({
      nombre: "",
      apellido: "",
      edad: "",
      genero: "",
      email: "",
      telefono: "",
      direccion: "",
    })
    // Optionally re-fetch patients list here if API call was real
    // fetchData();
  }

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
    // Use padding for spacing within the component, let parent handle overall layout
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
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    value={newPatient.nombre}
                    onChange={handleInputChange}
                    placeholder="Ingrese el nombre"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">
                    Apellido <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="apellido"
                    value={newPatient.apellido}
                    onChange={handleInputChange}
                    placeholder="Ingrese el apellido"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edad">Edad</Label>
                  <Input
                    id="edad"
                    type="number"
                    value={newPatient.edad}
                    onChange={handleInputChange}
                    placeholder="Ej: 30"
                  />
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
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPatient.email}
                  onChange={handleInputChange}
                  placeholder="paciente@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={newPatient.telefono}
                  onChange={handleInputChange}
                  placeholder="Ej: 3001234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={newPatient.direccion}
                  onChange={handleInputChange}
                  placeholder="Ej: Calle 10 # 20-30"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              {/* Disable button if required fields are empty - Basic example */}
              <Button
                onClick={handleAddPatientSubmit}
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={!newPatient.nombre || !newPatient.apellido} // Simple validation example
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
                className="pl-8 w-full" // Ensure padding for icon
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Reset page when searching
                }}
                disabled={loadingPacientes} // Disable search while loading
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Tabs for Filtering (Optional) */}
          <Tabs defaultValue="todos" className="space-y-4">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              {/* Add logic later to filter these tabs */}
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
                  {/* Make table scrollable on small screens */}
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[80px] px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre Completo
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Edad
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Género
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Reg.
                        </TableHead>
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
                          <TableCell colSpan={8} className="h-32 text-center">
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
                          <TableCell colSpan={8} className="h-32 text-center text-gray-500">
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
                            <TableCell className="px-4 py-3 text-gray-500">{paciente.edad ?? "N/A"}</TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 capitalize">
                              {paciente.genero ?? "N/A"}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 whitespace-nowrap">
                              {paciente.fecha_registro ?? "N/A"}
                            </TableCell>
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
                                {/* TODO: Add onClick handlers for these buttons */}
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

