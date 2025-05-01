"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Calendar,
  Filter,
  Download,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  Loader2,
  RefreshCw,
  FileDown,
  ClipboardList,
  User,
  Stethoscope,
  MapPin,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function HistorialPage() {
  const [diagnosticos, setDiagnosticos] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const [loadingDiagnosticos, setLoadingDiagnosticos] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [filtroTipo, setFiltroTipo] = useState("")
  const [filtroRegion, setFiltroRegion] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)

  const itemsPerPage = 10

  const loadDiagnosticos = async () => {
    if (!user) {
      setLoadingDiagnosticos(false)
      return
    }

    setLoadingDiagnosticos(true)

    try {
      const response = await fetch("/api/dashboard/diagnosticos")
      const data = await response.json()

      if (response.ok) {
        setDiagnosticos(data.diagnosticos || [])
        setError(null)
      } else {
        setError(data.error || "Error al cargar los diagnósticos.")
      }
    } catch (error) {
      console.error("Error al cargar los diagnósticos:", error)
      setError("Error al cargar los diagnósticos. Compruebe su conexión e intente nuevamente.")
    } finally {
      setLoadingDiagnosticos(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadDiagnosticos()
    }
  }, [user, authLoading])

  const filteredDiagnosticos = diagnosticos.filter((diag) => {
    const matchesSearch =
      diag.paciente?.primer_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diag.id_diagnostico?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      diag.paciente_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      diag.diagnostico?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTipo = filtroTipo && filtroTipo !== "todos" ? diag.tipo === filtroTipo : true
    const matchesRegion = filtroRegion && filtroRegion !== "todas" ? diag.region === filtroRegion : true

    return matchesSearch && matchesTipo && matchesRegion
  })

  const sortedDiagnosticos = [...filteredDiagnosticos].sort((a, b) => {
    if (!sortConfig) return 0

    const { key, direction } = sortConfig

    const aValue = a[key as keyof typeof a] ?? ""
    const bValue = b[key as keyof typeof b] ?? ""

    if (aValue < bValue) {
      return direction === "ascending" ? -1 : 1
    }
    if (aValue > bValue) {
      return direction === "ascending" ? 1 : -1
    }
    return 0
  })

  const totalPages = Math.ceil(sortedDiagnosticos.length / itemsPerPage)
  const paginatedDiagnosticos = sortedDiagnosticos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const getSortDirectionIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUpDown className="ml-1 h-4 w-4 text-teal-600" />
    ) : (
      <ArrowUpDown className="ml-1 h-4 w-4 text-teal-600 rotate-180" />
    )
  }

  const handleExport = () => {
    // Implementación de exportación (podría ser a CSV, PDF, etc.)
    alert("Funcionalidad de exportación")
  }

  const handleViewDiagnostico = (id: number) => {
    // Implementación para ver detalles del diagnóstico
    alert(`Ver diagnóstico ${id}`)
  }

  const resetFilters = () => {
    setSearchTerm("")
    setFiltroTipo("")
    setFiltroRegion("")
    setSortConfig(null)
    setCurrentPage(1)
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Historial de Diagnósticos</h1>
          <p className="text-gray-500 mt-1">Consulte y gestione los diagnósticos médicos realizados</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="border-gray-200 text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>
          <Button onClick={handleExport} className="bg-teal-600 hover:bg-teal-700">
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {authLoading ? (
        <div className="flex flex-col items-center justify-center w-full h-64 gap-4">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
          <p className="text-gray-500">Verificando credenciales...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !user ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acceso denegado</AlertTitle>
          <AlertDescription>No tienes permisos para ver esta información. Por favor, inicia sesión.</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Filters card */}
          <Card className="border-teal-100 shadow-sm">
            <CardHeader className="bg-teal-50/50 border-b border-teal-100">
              <CardTitle className="flex items-center text-teal-800">
                <Filter className="h-5 w-5 mr-2 text-teal-600" />
                Filtros de Búsqueda
              </CardTitle>
              <CardDescription>Utilice los filtros para encontrar diagnósticos específicos</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por paciente, ID o diagnóstico..."
                    className="pl-10 border-gray-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div>
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger className="border-gray-300">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
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
                    <SelectTrigger className="border-gray-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
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

          {/* Results card */}
          <Card className="border-teal-100 shadow-sm">
            <CardHeader className="bg-teal-50/50 border-b border-teal-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-teal-800">
                  <ClipboardList className="h-5 w-5 mr-2 text-teal-600" />
                  Resultados
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadDiagnosticos}
                    className="border-teal-200 text-teal-700 hover:bg-teal-50"
                    disabled={loadingDiagnosticos}
                  >
                    {loadingDiagnosticos ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    <span>Actualizar</span>
                  </Button>
                </div>
              </div>
              <CardDescription>
                {loadingDiagnosticos ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Cargando diagnósticos...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                      {filteredDiagnosticos.length}
                    </Badge>
                    diagnósticos encontrados
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[80px]">
                          <button
                            className="flex items-center font-medium text-gray-700"
                            onClick={() => requestSort("id_diagnostico")}
                          >
                            ID {getSortDirectionIcon("id_diagnostico")}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            className="flex items-center font-medium text-gray-700"
                            onClick={() => requestSort("paciente.primer_nombre")}
                          >
                            <User className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                            Paciente {getSortDirectionIcon("paciente.primer_nombre")}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            className="flex items-center font-medium text-gray-700"
                            onClick={() => requestSort("fecha")}
                          >
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                            Fecha {getSortDirectionIcon("fecha")}
                          </button>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center font-medium text-gray-700">
                            <FileText className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                            Tipo
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center font-medium text-gray-700">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                            Región
                          </div>
                        </TableHead>
                        <TableHead>
                          <button
                            className="flex items-center font-medium text-gray-700"
                            onClick={() => requestSort("diagnostico")}
                          >
                            <Stethoscope className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                            Diagnóstico {getSortDirectionIcon("diagnostico")}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            className="flex items-center font-medium text-gray-700"
                            onClick={() => requestSort("confianza")}
                          >
                            Confianza {getSortDirectionIcon("confianza")}
                          </button>
                        </TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingDiagnosticos ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
                              <span className="text-sm text-gray-500">Cargando diagnósticos...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : paginatedDiagnosticos.length > 0 ? (
                        paginatedDiagnosticos.map((diag) => (
                          <TableRow key={diag.id_diagnostico} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-teal-700">{diag.id_diagnostico}</TableCell>
                            <TableCell>
                              <div className="font-medium">{diag.paciente?.primer_nombre || "—"}</div>
                              <div className="text-xs text-gray-500">ID: {diag.paciente_id || "—"}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                <span>{diag.fecha || "—"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 font-normal">
                                {diag.tipo || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 font-normal">
                                {diag.region || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[200px] truncate font-medium">{diag.diagnostico || "—"}</div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  diag.confianza >= 80
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : diag.confianza >= 50
                                      ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                                      : "border-red-200 bg-red-50 text-red-700"
                                }
                              >
                                {diag.confianza ? `${diag.confianza}%` : "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDiagnostico(diag.id_diagnostico)}
                                  className="h-8 w-8 text-gray-500 hover:text-teal-600"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-teal-600"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <AlertCircle className="h-6 w-6 text-gray-400" />
                              <span className="text-gray-500">No se encontraron resultados.</span>
                              {(searchTerm || filtroTipo || filtroRegion) && (
                                <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2">
                                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                  Limpiar filtros
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>

            {filteredDiagnosticos.length > 0 && (
              <CardFooter className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50">
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
                    className="h-8 w-8 border-gray-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium bg-white px-3 py-1 rounded border border-gray-200">
                    {currentPage} / {totalPages || 1}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="h-8 w-8 border-gray-200"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
