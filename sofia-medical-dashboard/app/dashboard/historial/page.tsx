"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge" // Importar Badge
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
  // MapPin, // No hay datos de región en getDiagnosticos
} from "lucide-react"
import { useAuth } from "@/context/AuthContext" // Asegúrate que la ruta es correcta

// Interfaz para la estructura de datos que devuelve getDiagnosticos
interface DiagnosticoHistorial {
    id_diagnostico: number;
    id_paciente: number;
    nombre_paciente: string | null; 
    id_medico: number;
    nombre_medico: string | null; 
    id_tipo_examen: number;
    nombre_tipo_examen: string | null; 
    resultado: string;
    nivel_confianza: number;
    fecha_diagnostico: string; 
    estado: string;
}


export default function HistorialPage() {
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoHistorial[]>([]) 
  const [error, setError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const [loadingDiagnosticos, setLoadingDiagnosticos] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [filtroTipoExamen, setFiltroTipoExamen] = useState("") 
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DiagnosticoHistorial | string 
    direction: "ascending" | "descending"
  } | null>(null)

  const itemsPerPage = 10

  const loadDiagnosticos = async () => {
    setLoadingDiagnosticos(true)
    setError(null); 

    try {
      const response = await fetch("/api/diagnosticos") 
      const data = await response.json()

      if (response.ok) {
        if (Array.isArray(data)) {
            setDiagnosticos(data);
        } else {
            console.error("Respuesta inesperada de la API:", data);
            setError("Formato de datos inesperado recibido del servidor.");
            setDiagnosticos([]);
        }
      } else {
        setError(data.error || "Error al cargar los diagnósticos.");
        setDiagnosticos([]); 
      }
    } catch (error) {
      console.error("Error al cargar los diagnósticos:", error)
      setError("Error de red o al procesar la respuesta. Compruebe su conexión e intente nuevamente.")
      setDiagnosticos([]); 
    } finally {
      setLoadingDiagnosticos(false)
    }
  }

  useEffect(() => {
    if (!authLoading) { 
        loadDiagnosticos()
    }
  }, [authLoading]) 

  const filteredDiagnosticos = diagnosticos.filter((diag) => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      diag.nombre_paciente?.toLowerCase().includes(searchTermLower) ||
      diag.id_diagnostico?.toString().includes(searchTermLower) || 
      diag.id_paciente?.toString().includes(searchTermLower) ||
      diag.resultado?.toLowerCase().includes(searchTermLower) ||
      diag.nombre_medico?.toLowerCase().includes(searchTermLower) 

    const matchesTipo = filtroTipoExamen && filtroTipoExamen !== "todos" 
        ? diag.nombre_tipo_examen === filtroTipoExamen 
        : true

    return matchesSearch && matchesTipo 
  })

  const sortedDiagnosticos = [...filteredDiagnosticos].sort((a, b) => {
    if (!sortConfig) {
         return new Date(b.fecha_diagnostico).getTime() - new Date(a.fecha_diagnostico).getTime();
    }

    const { key, direction } = sortConfig
    const aValue = a[key as keyof DiagnosticoHistorial] ?? ""; 
    const bValue = b[key as keyof DiagnosticoHistorial] ?? "";

    if (key === 'fecha_diagnostico') {
        const dateA = new Date(aValue as string).getTime();
        const dateB = new Date(bValue as string).getTime();
        if (dateA < dateB) return direction === "ascending" ? -1 : 1;
        if (dateA > dateB) return direction === "ascending" ? 1 : -1;
        return 0;
    }
    
    if (aValue < bValue) return direction === "ascending" ? -1 : 1;
    if (aValue > bValue) return direction === "ascending" ? 1 : -1;
    return 0;
  })

  const totalPages = Math.ceil(sortedDiagnosticos.length / itemsPerPage)
  const paginatedDiagnosticos = sortedDiagnosticos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const requestSort = (key: keyof DiagnosticoHistorial | string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const getSortDirectionIcon = (key: keyof DiagnosticoHistorial | string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-gray-400" /> 
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-teal-600" /> 
    ) : (
      <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-teal-600 transform scale-y-[-1]" /> 
    )
  }

  const handleExport = () => {
    console.log("Exportando datos:", sortedDiagnosticos); 
    alert("Funcionalidad de exportación pendiente")
  }

  const handleViewDiagnostico = (id: number) => {
    console.log("Viendo diagnóstico ID:", id);
    alert(`Ver detalles del diagnóstico ${id} (pendiente)`)
  }

  const resetFilters = () => {
    setSearchTerm("")
    setFiltroTipoExamen("") 
    setSortConfig(null)
    setCurrentPage(1)
  }

  const formatDate = (dateString: string | null) => {
      if (!dateString) return "—";
      try {
          // Formato más corto para la tabla
          return new Date(dateString).toLocaleDateString('es-CO', { 
              year: 'numeric', month: '2-digit', day: '2-digit', 
          });
      } catch (e) {
          return dateString; 
      }
  }

  return (
    <div className="w-full h-full py-8 px-4 sm:px-6 space-y-8"> 
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
            className="border-gray-300 text-gray-700 hover:bg-gray-50" 
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reiniciar Filtros
          </Button>
          <Button onClick={handleExport} className="bg-teal-600 hover:bg-teal-700">
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Separator /> 

      {authLoading ? (
        <div className="flex flex-col items-center justify-center w-full h-64 gap-4">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Datos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
           <Button variant="outline" size="sm" onClick={loadDiagnosticos} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2"/> Reintentar
           </Button>
        </Alert>
      ) : (
        <>
          {/* Filters card */}
          <Card className="border-gray-200 shadow-sm w-full"> 
            <CardHeader className="bg-gray-50 border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4"> 
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800"> 
                <Filter className="h-5 w-5 mr-2 text-gray-500" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3"> 
                <div className="relative sm:col-span-2 md:col-span-1"> 
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por ID, paciente, médico, resultado..."
                    className="pl-10 border-gray-300 h-10" 
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                  />
                </div>

                <div>
                  <Select value={filtroTipoExamen} onValueChange={(value) => { setFiltroTipoExamen(value); setCurrentPage(1); }}> 
                    <SelectTrigger className="border-gray-300 h-10"> 
                      <div className="flex items-center gap-2 text-sm"> 
                        <FileText className="h-4 w-4 text-gray-500" />
                        <SelectValue placeholder="Tipo de Examen" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      <SelectItem value="Radiografía">Radiografía</SelectItem>
                      <SelectItem value="Resonancia Magnética">Resonancia Magnética</SelectItem>
                      <SelectItem value="Tomografía">Tomografía</SelectItem>
                      <SelectItem value="Ecografía">Ecografía</SelectItem>
                       <SelectItem value="Mamografía">Mamografía</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results card */}
          <Card className="border-gray-200 shadow-sm w-full"> 
            <CardHeader className="bg-gray-50 border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between"> 
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-gray-500" />
                 <CardTitle className="text-lg font-semibold text-gray-800">Historial</CardTitle>
                 {!loadingDiagnosticos && (
                     <Badge variant="secondary" className="font-normal">
                        {filteredDiagnosticos.length} resultado(s)
                     </Badge>
                 )}
              </div>
               <Button
                 variant="ghost" 
                 size="sm"
                 onClick={loadDiagnosticos}
                 className="text-teal-700 hover:bg-teal-50"
                 disabled={loadingDiagnosticos}
               >
                 {loadingDiagnosticos ? (
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                 ) : (
                   <RefreshCw className="h-4 w-4 mr-2" />
                 )}
                 <span>{loadingDiagnosticos ? "Actualizando..." : "Actualizar"}</span>
               </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto"> 
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead className="w-[70px] px-4 py-2"> 
                        <button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase" onClick={() => requestSort("id_diagnostico")}>
                          ID {getSortDirectionIcon("id_diagnostico")}
                        </button>
                      </TableHead>
                      <TableHead className="px-4 py-2">
                        <button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase" onClick={() => requestSort("nombre_paciente")}>
                          <User className="h-3.5 w-3.5" /> Paciente {getSortDirectionIcon("nombre_paciente")}
                        </button>
                      </TableHead>
                       <TableHead className="px-4 py-2">
                        <button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase" onClick={() => requestSort("nombre_medico")}>
                          <User className="h-3.5 w-3.5" /> Médico {getSortDirectionIcon("nombre_medico")}
                        </button>
                      </TableHead>
                      <TableHead className="px-4 py-2">
                        <button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase" onClick={() => requestSort("fecha_diagnostico")}>
                          <Calendar className="h-3.5 w-3.5" /> Fecha {getSortDirectionIcon("fecha_diagnostico")}
                        </button>
                      </TableHead>
                      <TableHead className="px-4 py-2">
                         <button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase" onClick={() => requestSort("nombre_tipo_examen")}>
                            <FileText className="h-3.5 w-3.5" /> Tipo Ex. {getSortDirectionIcon("nombre_tipo_examen")}
                         </button>
                      </TableHead>
                      <TableHead className="px-4 py-2">
                        <button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase" onClick={() => requestSort("resultado")}>
                           <Stethoscope className="h-3.5 w-3.5" /> Resultado {getSortDirectionIcon("resultado")}
                        </button>
                      </TableHead>
                      <TableHead className="px-4 py-2">
                        <button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase" onClick={() => requestSort("nivel_confianza")}>
                           Confianza {getSortDirectionIcon("nivel_confianza")}
                        </button>
                      </TableHead>
                       <TableHead className="px-4 py-2">
                        <button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase" onClick={() => requestSort("estado")}>
                           Estado {getSortDirectionIcon("estado")}
                        </button>
                      </TableHead>
                      <TableHead className="text-right px-4 py-2 text-xs font-medium text-gray-600 uppercase">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDiagnosticos ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-32 text-center"> 
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
                            <span className="text-sm text-gray-500">Cargando diagnósticos...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedDiagnosticos.length > 0 ? (
                      paginatedDiagnosticos.map((diag) => (
                        <TableRow key={diag.id_diagnostico} className="hover:bg-gray-50 text-sm">
                          <TableCell className="font-medium text-teal-700 px-4 py-2">{diag.id_diagnostico}</TableCell>
                          <TableCell className="px-4 py-2">{diag.nombre_paciente || "—"}</TableCell>
                          <TableCell className="px-4 py-2">{diag.nombre_medico || "—"}</TableCell>
                          <TableCell className="px-4 py-2">{formatDate(diag.fecha_diagnostico)}</TableCell>
                          <TableCell className="px-4 py-2">{diag.nombre_tipo_examen || "—"}</TableCell>
                          <TableCell className="px-4 py-2">
                             <div className="max-w-[180px] truncate" title={diag.resultado}>{diag.resultado || "—"}</div> 
                          </TableCell>
                          <TableCell className="px-4 py-2 text-center"> 
                            {/* *** CORRECCIÓN: Usar variantes válidas *** */}
                            <Badge
                              variant={
                                diag.nivel_confianza >= 0.8
                                ? "default" // Alta confianza -> default (verde)
                                : diag.nivel_confianza >= 0.5
                                ? "secondary" // Media confianza -> secondary (gris)
                                : "destructive" // Baja confianza -> destructive (rojo)
                              }
                              className="font-medium"
                            >
                              {`${(diag.nivel_confianza * 100).toFixed(0)}%`} 
                            </Badge>
                          </TableCell>
                           <TableCell className="px-4 py-2">
                             {/* *** CORRECCIÓN: Usar variantes válidas *** */}
                             <Badge 
                                variant={
                                    diag.estado === 'Completado' ? 'default' : // Usar default para éxito
                                    diag.estado === 'Pendiente' ? 'outline' : 
                                    'destructive' // Usar destructive para otros (ej. Anulado)
                                }
                             >
                                {diag.estado || "—"}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-right px-4 py-2">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDiagnostico(diag.id_diagnostico)}
                                className="h-8 w-8 text-gray-500 hover:text-teal-600"
                                title="Ver Detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-32 text-center"> 
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="h-6 w-6 text-gray-400" />
                            <span className="text-gray-500">No se encontraron diagnósticos.</span>
                            {(searchTerm || filtroTipoExamen) && ( 
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
            </CardContent>

            {filteredDiagnosticos.length > 0 && totalPages > 1 && ( 
              <CardFooter
                className="flex items-center justify-between border-t border-gray-100 px-6 py-3 bg-gray-50/50" 
              >
                <div className="text-xs text-gray-500"> 
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                  {Math.min(currentPage * itemsPerPage, filteredDiagnosticos.length)} de {filteredDiagnosticos.length}{" "}
                  resultados
                </div>
                <div className="flex items-center space-x-1.5"> 
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-7 w-7 border-gray-300" 
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-xs font-medium px-2.5 py-1 rounded"> 
                    Pág {currentPage} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="h-7 w-7 border-gray-300" 
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

