"use client"

import type React from "react"

import { useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { Search, Edit, Trash2, FileText, ChevronLeft, ChevronRight, UserPlus } from "lucide-react"

import { getPacientes } from "@/lib/db"
import { AuthContext } from "@/context/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function PacientesPage() {
  const { user } = React.useContext(AuthContext)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
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

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const pacientesData = await getPacientes()
        setPacientes(pacientesData)
      } catch (error) {
        setError("Error al cargar los pacientes.")
        toast({
          variant: "destructive",
          title: "Error.",
          description: "Error al cargar los pacientes.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredPacientes = pacientes.filter((paciente) => {
    return (
      (paciente.primer_nombre + " " + paciente.primer_apellido).toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Paginación
  const totalPages = Math.ceil(filteredPacientes.length / itemsPerPage)
  const paginatedPacientes = filteredPacientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleAddPatient = () => {
    // Simulación de agregar paciente
    setIsAddDialogOpen(false)
    // Resetear formulario
    setNewPatient({
      nombre: "",
      apellido: "",
      edad: "",
      genero: "",
      email: "",
      telefono: "",
      direccion: "",
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setNewPatient((prev) => ({ ...prev, [id]: value }))
  }

  if (!user) {
    return <div>No se pudo obtener la informacion del usuario.</div>
  }

  if (user.rol !== "admin" && user.rol !== "medico") {
    return <div>No tiene permisos para acceder a esta pagina.</div>
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pacientes</h1>
          <p className="text-gray-500">Gestione la información de sus pacientes</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
              <DialogDescription>
                Complete la información del paciente. Haga clic en guardar cuando termine.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" value={newPatient.nombre} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input id="apellido" value={newPatient.apellido} onChange={handleInputChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edad">Edad</Label>
                  <Input id="edad" type="number" value={newPatient.edad} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genero">Género</Label>
                  <Select onValueChange={(value) => setNewPatient((prev) => ({ ...prev, genero: value }))}>
                    <SelectTrigger id="genero">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" value={newPatient.email} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" value={newPatient.telefono} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" value={newPatient.direccion} onChange={handleInputChange} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddPatient} className="bg-teal-600 hover:bg-teal-700">
                Guardar Paciente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-teal-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Pacientes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar paciente..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <CardDescription>{filteredPacientes.length} pacientes encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todos" className="space-y-4">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="recientes">Recientes</TabsTrigger>
              <TabsTrigger value="sin-diagnostico">Sin Diagnóstico</TabsTrigger>
            </TabsList>

            <TabsContent value="todos" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Género</TableHead>
                      <TableHead>Fecha Registro</TableHead>
                      <TableHead>Último Diagnóstico</TableHead>
                      <TableHead>Total Diag.</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPacientes.length > 0 ? (
                      paginatedPacientes.map((paciente) => (
                        <TableRow key={paciente.id}>
                          <TableCell className="font-medium">{paciente.id_usuario}</TableCell>
                          <TableCell>{paciente.primer_nombre + " " + paciente.primer_apellido}</TableCell>
                          <TableCell>{paciente.edad || "N/A"}</TableCell>
                          <TableCell>{paciente.genero || "N/A"}</TableCell>
                          <TableCell>{paciente.fecha_registro || "N/A"}</TableCell>
                          <TableCell>
                            {paciente.ultimo_diagnostico ? (
                              paciente.ultimo_diagnostico
                            ) : (
                              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                Sin diagnóstico
                              </Badge>
                            )}
                          </TableCell>     
                          <TableCell>{paciente.diagnosticosTotales}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button variant="ghost" size="icon" title="Ver historial">
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Editar paciente">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Eliminar paciente">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No se encontraron pacientes.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {filteredPacientes.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                    {Math.min(currentPage * itemsPerPage, filteredPacientes.length)} de {filteredPacientes.length}
                    pacientes
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium">
                      Página {currentPage} de {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recientes" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Género</TableHead>
                      <TableHead>Fecha Registro</TableHead>
                      <TableHead>Último Diagnóstico</TableHead>
                      <TableHead>Total Diag.</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        Filtro de pacientes recientes (simulado)
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="sin-diagnostico" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Género</TableHead>
                      <TableHead>Fecha Registro</TableHead>
                      <TableHead>Último Diagnóstico</TableHead>
                      <TableHead>Total Diag.</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        Filtro de pacientes sin diagnóstico (simulado)
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
