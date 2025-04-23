"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, Filter, Download, Eye, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"

// Datos simulados para la tabla
const diagnosticosSimulados = Array.from({ length: 50 }).map((_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * 60))

  const tipos = ["Radiografía", "Resonancia", "Tomografía", "Ecografía"]
  const regiones = ["Tórax", "Abdomen", "Cráneo", "Extremidades"]
  const diagnosticos = [
    "Neumonía",
    "Fractura",
    "Normal",
    "Derrame pleural",
    "Tumor",
    "Inflamación",
    "Calcificación",
    "Atelectasia",
  ]

  const confianza = Math.floor(Math.random() * 30) + 70

  return {
    id: `DIAG-${1000 + i}`,
    pacienteId: `PAC-${Math.floor(Math.random() * 1000)}`,
    pacienteNombre: `Paciente ${i + 1}`,
    fecha: date.toISOString().split("T")[0],
    tipo: tipos[Math.floor(Math.random() * tipos.length)],
    region: regiones[Math.floor(Math.random() * regiones.length)],
    diagnostico: diagnosticos[Math.floor(Math.random() * diagnosticos.length)],
    confianza: confianza,
    estado: confianza > 90 ? "Alto" : confianza > 80 ? "Medio" : "Bajo",
  }
})

export default function HistorialPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [filtroTipo, setFiltroTipo] = useState("")
  const [filtroRegion, setFiltroRegion] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)

  const itemsPerPage = 10

  // Filtrar diagnósticos
  const filteredDiagnosticos = diagnosticosSimulados.filter((diag) => {
    const matchesSearch =
      diag.pacienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diag.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diag.pacienteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diag.diagnostico.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTipo = filtroTipo ? diag.tipo === filtroTipo : true
    const matchesRegion = filtroRegion ? diag.region === filtroRegion : true

    return matchesSearch && matchesTipo && matchesRegion
  })

  // Ordenar diagnósticos
  const sortedDiagnosticos = [...filteredDiagnosticos].sort((a, b) => {
    if (!sortConfig) return 0

    const { key, direction } = sortConfig

    if (a[key as keyof typeof a] < b[key as keyof typeof b]) {
      return direction === "ascending" ? -1 : 1
    }
    if (a[key as keyof typeof a] > b[key as keyof typeof b]) {
      return direction === "ascending" ? 1 : -1
    }
    return 0
  })

  // Paginación
  const totalPages = Math.ceil(sortedDiagnosticos.length / itemsPerPage)
  const paginatedDiagnosticos = sortedDiagnosticos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Función para ordenar
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Función para obtener la clase de ordenamiento
  const getSortDirectionIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUpDown className="ml-1 h-4 w-4 text-teal-600" />
    ) : (
      <ArrowUpDown className="ml-1 h-4 w-4 text-teal-600 rotate-180" />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Historial de Diagnósticos</h1>
        <p className="text-gray-500">Consulte y gestione los diagnósticos realizados</p>
      </div>

      <Card className="border-teal-100">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>Utilice los filtros para encontrar diagnósticos específicos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por paciente, ID o diagnóstico..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Tipo de Imagen" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="Radiografía">Radiografía</SelectItem>
                  <SelectItem value="Resonancia">Resonancia</SelectItem>
                  <SelectItem value="Tomografía">Tomografía</SelectItem>
                  <SelectItem value="Ecografía">Ecografía</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={filtroRegion} onValueChange={setFiltroRegion}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Región Anatómica" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las regiones</SelectItem>
                  <SelectItem value="Tórax">Tórax</SelectItem>
                  <SelectItem value="Abdomen">Abdomen</SelectItem>
                  <SelectItem value="Cráneo">Cráneo</SelectItem>
                  <SelectItem value="Extremidades">Extremidades</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-teal-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resultados</CardTitle>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </Button>
          </div>
          <CardDescription>{filteredDiagnosticos.length} diagnósticos encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <button className="flex items-center font-medium" onClick={() => requestSort("id")}>
                      ID {getSortDirectionIcon("id")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="flex items-center font-medium" onClick={() => requestSort("pacienteNombre")}>
                      Paciente {getSortDirectionIcon("pacienteNombre")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="flex items-center font-medium" onClick={() => requestSort("fecha")}>
                      Fecha {getSortDirectionIcon("fecha")}
                    </button>
                  </TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Región</TableHead>
                  <TableHead>
                    <button className="flex items-center font-medium" onClick={() => requestSort("diagnostico")}>
                      Diagnóstico {getSortDirectionIcon("diagnostico")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="flex items-center font-medium" onClick={() => requestSort("confianza")}>
                      Confianza {getSortDirectionIcon("confianza")}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDiagnosticos.length > 0 ? (
                  paginatedDiagnosticos.map((diag) => (
                    <TableRow key={diag.id}>
                      <TableCell className="font-medium">{diag.id}</TableCell>
                      <TableCell>{diag.pacienteNombre}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-500" />
                          <span>{diag.fecha}</span>
                        </div>
                      </TableCell>
                      <TableCell>{diag.tipo}</TableCell>
                      <TableCell>{diag.region}</TableCell>
                      <TableCell>{diag.diagnostico}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            diag.estado === "Alto"
                              ? "border-green-200 bg-green-50 text-green-700"
                              : diag.estado === "Medio"
                                ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                                : "border-red-200 bg-red-50 text-red-700"
                          }
                        >
                          {diag.confianza}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No se encontraron resultados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {filteredDiagnosticos.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                {Math.min(currentPage * itemsPerPage, filteredDiagnosticos.length)} de {filteredDiagnosticos.length}{" "}
                resultados
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
        </CardContent>
      </Card>
    </div>
  )
}
