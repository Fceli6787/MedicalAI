"use client"

import type React from "react"

import { useState } from "react"
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
import { Search, Edit, Trash2, FileText, ChevronLeft, ChevronRight, UserPlus } from "lucide-react"

// Datos simulados para la tabla
const pacientesSimulados = Array.from({ length: 50 }).map((_, i) => {
  const id = `PAC-${1000 + i}`
  const generos = ["Masculino", "Femenino"]
  const nombres = ["Juan", "María", "Carlos", "Ana", "Luis", "Laura", "Pedro", "Sofía"]
  const apellidos = ["García", "Rodríguez", "López", "Martínez", "González", "Pérez", "Sánchez", "Fernández"]

  const nombre = nombres[Math.floor(Math.random() * nombres.length)]
  const apellido = apellidos[Math.floor(Math.random() * apellidos.length)]
  const edad = Math.floor(Math.random() * 70) + 18
  const genero = generos[Math.floor(Math.random() * generos.length)]

  const fechaRegistro = new Date()
  fechaRegistro.setDate(fechaRegistro.getDate() - Math.floor(Math.random() * 365))

  const ultimoDiagnostico = Math.random() > 0.3 ? new Date() : null
  if (ultimoDiagnostico) {
    ultimoDiagnostico.setDate(ultimoDiagnostico.getDate() - Math.floor(Math.random() * 60))
  }

  return {
    id,
    nombre,
    apellido,
    nombreCompleto: `${nombre} ${apellido}`,
    edad,
    genero,
    fechaRegistro: fechaRegistro.toISOString().split("T")[0],
    ultimoDiagnostico: ultimoDiagnostico ? ultimoDiagnostico.toISOString().split("T")[0] : null,
    diagnosticosTotales: ultimoDiagnostico ? Math.floor(Math.random() * 10) + 1 : 0,
  }
})

export default function PacientesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
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

  const itemsPerPage = 10

  // Filtrar pacientes
  const filteredPacientes = pacientesSimulados.filter((paciente) => {
    return (
      paciente.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  return (
    <div className="space-y-6">
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
                          <TableCell className="font-medium">{paciente.id}</TableCell>
                          <TableCell>{paciente.nombreCompleto}</TableCell>
                          <TableCell>{paciente.edad}</TableCell>
                          <TableCell>{paciente.genero}</TableCell>
                          <TableCell>{paciente.fechaRegistro}</TableCell>
                          <TableCell>
                            {paciente.ultimoDiagnostico ? (
                              paciente.ultimoDiagnostico
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
                    {Math.min(currentPage * itemsPerPage, filteredPacientes.length)} de {filteredPacientes.length}{" "}
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
