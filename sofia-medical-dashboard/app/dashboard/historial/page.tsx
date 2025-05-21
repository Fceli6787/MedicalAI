"use client"

import { useState, useEffect, Fragment, useRef } from "react"
// Asumiendo que Link es de next/link, pero no se usa directamente en este fragmento modificado.
// import Link from "next/link" 
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  Calendar,
  Filter,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  Loader2,
  RefreshCw,
  FileDown, // Aunque el botón de exportar se elimina, el ícono puede usarse en el modal
  ClipboardList,
  User,
  Stethoscope,
  Image as ImageIcon,
  HeartPulse,
  ListChecks,
  Info,
  Trash2
} from "lucide-react"
import { useAuth } from "@/context/AuthContext" // Asumiendo que este hook existe y funciona
import { generateDiagnosisPDF, type DiagnosisReportData } from "@/lib/generate-pdf" // Asumiendo que esta utilidad existe

// Interfaces
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

interface DiagnosticoDetalladoRecomendacion {
  id_recomendacion: number;
  descripcion: string;
  prioridad: string;
  fecha_creacion: string;
}

interface DiagnosticoDetallado {
  id_diagnostico: number;
  id_paciente: number;
  nombre_paciente: string | null;
  nui_paciente: string | null;
  id_medico: number;
  nombre_medico: string | null;
  id_tipo_examen: number;
  nombre_tipo_examen: string | null;
  resultado: string;
  nivel_confianza: number;
  fecha_diagnostico: string;
  estado_diagnostico: string;
  ai_descripcion_detallada: string | null;
  ai_pronostico_tiempo_recuperacion: string | null;
  ai_pronostico_probabilidad_mejoria: string | null;
  imagen_url: string | null;
  imagen_tipo: string | null;
  recomendaciones: DiagnosticoDetalladoRecomendacion[];
}


export default function HistorialPage() {
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoHistorial[]>([])
  const [error, setError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth() // Estado de autenticación
  const [loadingDiagnosticos, setLoadingDiagnosticos] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [filtroTipoExamen, setFiltroTipoExamen] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DiagnosticoHistorial | string
    direction: "ascending" | "descending"
  } | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDiagnostico, setSelectedDiagnostico] = useState<DiagnosticoDetallado | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const itemsPerPage = 10
  const imageToCaptureRef = useRef<HTMLImageElement>(null);

  // Carga los diagnósticos desde la API
  const loadDiagnosticos = async () => {
    setLoadingDiagnosticos(true)
    setError(null);
    try {
      const response = await fetch("/api/diagnosticos") // Endpoint de la API para obtener diagnósticos
      const data = await response.json()
      if (response.ok) {
        if (Array.isArray(data)) {
          setDiagnosticos(data as DiagnosticoHistorial[]);
        } else {
          console.error("Respuesta inesperada de la API (lista):", data);
          setError("Formato de datos inesperado del servidor (lista).");
          setDiagnosticos([]);
        }
      } else {
        setError(data.error || "Error al cargar los diagnósticos.");
        setDiagnosticos([]);
      }
    } catch (error) {
      console.error("Error de red al cargar los diagnósticos:", error)
      setError("Error de red o al procesar la respuesta. Compruebe su conexión.")
      setDiagnosticos([]);
    } finally {
      setLoadingDiagnosticos(false)
    }
  }

  // Efecto para cargar diagnósticos cuando el estado de autenticación cambie
  useEffect(() => {
    if (!authLoading) {
      loadDiagnosticos()
    }
  }, [authLoading]) // Dependencia: authLoading

  // Filtra los diagnósticos según el término de búsqueda y el tipo de examen
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

  // Ordena los diagnósticos según la configuración de ordenamiento
  const sortedDiagnosticos = [...filteredDiagnosticos].sort((a, b) => {
    if (!sortConfig) {
      // Ordenar por fecha de diagnóstico descendente por defecto
      return new Date(b.fecha_diagnostico).getTime() - new Date(a.fecha_diagnostico).getTime();
    }
    const { key, direction } = sortConfig
    const aValue = a[key as keyof DiagnosticoHistorial] ?? "";
    const bValue = b[key as keyof DiagnosticoHistorial] ?? "";

    // Manejo especial para fechas
    if (key === 'fecha_diagnostico') {
      const dateA = new Date(aValue as string).getTime();
      const dateB = new Date(bValue as string).getTime();
      if (dateA < dateB) return direction === "ascending" ? -1 : 1;
      if (dateA > dateB) return direction === "ascending" ? 1 : -1;
      return 0;
    }

    // Ordenamiento genérico para otros campos
    if (aValue < bValue) return direction === "ascending" ? -1 : 1;
    if (aValue > bValue) return direction === "ascending" ? 1 : -1;
    return 0;
  })

  const totalPages = Math.ceil(sortedDiagnosticos.length / itemsPerPage)
  const paginatedDiagnosticos = sortedDiagnosticos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Solicita el ordenamiento por una clave específica
  const requestSort = (key: keyof DiagnosticoHistorial | string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Obtiene el ícono de dirección de ordenamiento
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

  // Maneja la visualización de los detalles de un diagnóstico
  const handleViewDiagnostico = async (id_diagnostico: number) => {
    setSelectedDiagnostico(null);
    setModalLoading(true);
    setModalError(null);
    setIsModalOpen(true);
    console.log(`[FRONTEND handleViewDiagnostico] Solicitando detalles para ID: ${id_diagnostico}`);

    try {
      const response = await fetch(`/api/diagnosticos/${id_diagnostico}`); // Endpoint para detalles
      const data = await response.json();

      console.log(`[FRONTEND handleViewDiagnostico] Respuesta de API para ID ${id_diagnostico} - Status: ${response.status}`);
      if (response.ok) {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setSelectedDiagnostico(data as DiagnosticoDetallado);
        } else {
          console.error("[FRONTEND handleViewDiagnostico] Respuesta inesperada de la API de detalles:", data);
          setModalError("Formato de datos inesperado para los detalles.");
        }
      } else {
        console.error("[FRONTEND handleViewDiagnostico] Error de la API de detalles:", data);
        setModalError(data.error || `Error al cargar detalles (ID: ${id_diagnostico}).`);
      }
    } catch (error) {
      console.error("[FRONTEND handleViewDiagnostico] Error en fetch de detalles:", error);
      setModalError("Error de red o al procesar la respuesta de detalles.");
    } finally {
      setModalLoading(false);
    }
  };

  // Maneja la eliminación de un diagnóstico
  const handleDeleteDiagnostico = async (id_diagnostico: number) => {
    // Considerar reemplazar window.confirm con un modal de confirmación personalizado
    if (!window.confirm(`¿Está seguro de que desea eliminar el diagnóstico ID ${id_diagnostico}? Esta acción no se puede deshacer y eliminará todos los datos asociados.`)) {
      return;
    }
    setDeletingId(id_diagnostico);
    try {
      const response = await fetch(`/api/diagnosticos/${id_diagnostico}`, { method: 'DELETE' }); // Endpoint para eliminar
      const responseData = await response.json();
      if (response.ok) {
        setDiagnosticos(prev => prev.filter(d => d.id_diagnostico !== id_diagnostico));
        // Considerar un sistema de notificaciones más robusto en lugar de alert
        alert(responseData.message || `Diagnóstico ID ${id_diagnostico} eliminado.`);
        if (isModalOpen && selectedDiagnostico?.id_diagnostico === id_diagnostico) {
          setIsModalOpen(false);
          setSelectedDiagnostico(null);
        }
      } else {
        alert(`Error al eliminar: ${responseData.error || 'Error desconocido.'}`);
      }
    } catch (error) {
      alert("Error de red al intentar eliminar.");
    } finally {
      setDeletingId(null);
    }
  };

  // Maneja la descarga del PDF desde el modal
  const handleDownloadPDFFromModal = async () => {
    if (!selectedDiagnostico) {
      setModalError("No hay diagnóstico seleccionado para generar el PDF.");
      return;
    }
    setPdfLoading(true);
    setModalError(null);

    try {
      const reportData: DiagnosisReportData = {
        patientInfo: {
          id: selectedDiagnostico.id_paciente?.toString() || "N/A",
          name: selectedDiagnostico.nombre_paciente || "Paciente Desconocido",
          nui: selectedDiagnostico.nui_paciente || "N/A",
          examDate: selectedDiagnostico.fecha_diagnostico ? formatDate(selectedDiagnostico.fecha_diagnostico) : "Fecha Desconocida",
        },
        diagnosis: {
          condition: selectedDiagnostico.resultado || "No especificado",
          confidence: selectedDiagnostico.nivel_confianza,
          description: selectedDiagnostico.ai_descripcion_detallada || undefined,
          recomendaciones: selectedDiagnostico.recomendaciones?.map(r => r.descripcion) || [],
          pronostico: (selectedDiagnostico.ai_pronostico_tiempo_recuperacion || selectedDiagnostico.ai_pronostico_probabilidad_mejoria) ? {
            tiempo_recuperacion: selectedDiagnostico.ai_pronostico_tiempo_recuperacion || undefined,
            probabilidad_mejoria: selectedDiagnostico.ai_pronostico_probabilidad_mejoria || undefined,
          } : undefined,
        },
        imageFileName: typeof selectedDiagnostico.imagen_url === 'string' && !selectedDiagnostico.imagen_url.startsWith('data:') ? selectedDiagnostico.imagen_url : `imagen_diagnostico_${selectedDiagnostico.id_diagnostico}`,
        examType: selectedDiagnostico.nombre_tipo_examen || "No especificado",
      };

      console.log("Generando PDF para historial con datos:", reportData);
      console.log("Elemento a capturar para imagen (ref):", imageToCaptureRef.current);

      // Llama a la función para generar el PDF
      const pdf = await generateDiagnosisPDF(reportData, imageToCaptureRef.current || undefined);
      pdf.save(`diagnostico_historial_${selectedDiagnostico.id_diagnostico}_${reportData.patientInfo.name.replace(/\s+/g, '_')}.pdf`);
      console.log("PDF de historial generado y descarga iniciada.");

    } catch (error: any) {
      console.error("Error al generar el PDF del historial:", error);
      setModalError(`Error al generar el PDF: ${error.message || "Error desconocido."}`);
    } finally {
      setPdfLoading(false);
    }
  };

  // Reinicia los filtros a sus valores por defecto
  const resetFilters = () => {
    setSearchTerm(""); 
    setFiltroTipoExamen(""); 
    setSortConfig(null); 
    setCurrentPage(1);
  }

  // Formatea una cadena de fecha
  const formatDate = (dateString: string | null, options?: Intl.DateTimeFormatOptions) => {
    if (!dateString) return "—"; // Retorna un guion si la fecha es nula
    try {
      const date = new Date(dateString);
      // Formato específico para la descripción del título del modal
      if (options && options.month === 'long' && options.year === 'numeric' && options.day === 'numeric' && options.hour && options.minute) {
        const dia = date.getDate().toString().padStart(2, '0');
        const mes = date.toLocaleDateString('es-CO', { month: 'long' }); // Formato de mes largo en español de Colombia
        const año = date.getFullYear();
        const hora = date.getHours().toString().padStart(2, '0');
        const minutos = date.getMinutes().toString().padStart(2, '0');
        return `${dia} de ${mes} de ${año}, ${hora}:${minutos}`;
      }
      // Formato corto por defecto para la tabla
      const defaultShortOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
      return date.toLocaleDateString('es-CO', options || defaultShortOptions); // Localización para Colombia
    } catch (e) {
      console.warn("Error al formatear fecha:", dateString, e);
      return dateString; // Retorna la cadena original si falla el formateo
    }
  }

  // Formatea el nivel de confianza a porcentaje
  const formatConfidence = (confidence: number | null | undefined): string => {
    if (confidence === null || confidence === undefined) return "N/A";
    return `${(confidence * 100).toFixed(0)}%`;
  };

  // Obtiene la URL de la imagen a partir de los detalles del diagnóstico
  const getImageUrlFromDetails = (
    imageUrl: string | null,
    imageType: string | null
  ): string => {
    console.log(`[FRONTEND getImageUrlFromDetails] URL recibida (raw): "${imageUrl ? String(imageUrl).substring(0, 60) + "..." : "null"}", Tipo: ${imageType}`);
    const placeholderImg = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=Imagen+no+disponible'; // Imagen de placeholder
    
    if (!imageUrl) {
      console.warn('[FRONTEND getImageUrlFromDetails] imageUrl es nulo. Usando placeholder.');
      return placeholderImg;
    }

    let imageUrlString = String(imageUrl).trim();
    // Elimina comillas si existen
    if ((imageUrlString.startsWith('"') && imageUrlString.endsWith('"')) ||
        (imageUrlString.startsWith("'") && imageUrlString.endsWith("'"))) {
      imageUrlString = imageUrlString.substring(1, imageUrlString.length - 1);
    }

    // Si ya es una URI de datos
    if (imageUrlString.startsWith('data:image')) {
      return imageUrlString;
    }
    // Si es una URL completa
    if (imageUrlString.startsWith('http://') || imageUrlString.startsWith('https://')) {
      return imageUrlString;
    }
    // Si es data base64 y tenemos un tipo
    if (imageType) {
      let mimeType = 'image/jpeg'; // Tipo MIME por defecto
      const tipoLimpio = String(imageType).toLowerCase().trim();
      if (tipoLimpio === 'jpg' || tipoLimpio === 'jpeg') mimeType = 'image/jpeg';
      else if (tipoLimpio === 'png') mimeType = 'image/png';
      else if (tipoLimpio === 'gif') mimeType = 'image/gif';
      else if (tipoLimpio === 'webp') mimeType = 'image/webp';
      // Considerar convertir DICOM a PNG para visualización o manejarlo apropiadamente
      else if (tipoLimpio === 'dicom') mimeType = 'image/png'; 
      else if (tipoLimpio.startsWith('image/')) mimeType = tipoLimpio;

      const dataUri = `data:${mimeType};base64,${imageUrlString}`;
      return dataUri;
    }
    // Si es una ruta relativa (ej. /uploads/image.jpg)
    if (imageUrlString.startsWith('/')) {
      // Asumiendo que se sirve desde el mismo dominio
      return imageUrlString;
    }
    // Fallback si no se puede determinar el tipo o formato
    console.warn('[FRONTEND getImageUrlFromDetails] No se pudo determinar el formato de la imagen. Usando placeholder.');
    return placeholderImg;
  };

  return (
    <div className="w-full h-full py-8 px-4 sm:px-6 space-y-8 bg-slate-50 dark:bg-gray-900">
      {/* Encabezado de la página */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Historial de Diagnósticos</h1>
          <p className="text-gray-500 dark:text-gray-300 mt-1">Consulte y gestione los diagnósticos médicos realizados</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reiniciar Filtros
          </Button>
          {/* Botón de Exportar eliminado */}
        </div>
      </header>

      {/* Estado de carga inicial o error */}
      {authLoading ? (
        <div className="flex flex-col items-center justify-center w-full h-64 gap-4">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
          <p className="text-gray-500 dark:text-gray-300">Cargando...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">Error al Cargar Datos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" size="sm" onClick={loadDiagnosticos} className="mt-4 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-800">
            <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
          </Button>
        </Alert>
      ) : (
        <Fragment>
          {/* Tarjeta de Filtros */}
          <Card className="border-gray-200 dark:border-gray-700 shadow-sm w-full dark:bg-gray-800">
            <CardHeader className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800 dark:text-white">
                <Filter className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-300" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {/* Input de búsqueda */}
                <div className="relative sm:col-span-2 md:col-span-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder="Buscar por ID, paciente, médico, resultado..."
                    className="pl-10 border-gray-300 h-10 rounded-md dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  />
                </div>
                {/* Selector de tipo de examen */}
                <div>
                  <Select value={filtroTipoExamen} onValueChange={(value) => { setFiltroTipoExamen(value); setCurrentPage(1); }}>
                    <SelectTrigger className="border-gray-300 h-10 rounded-md dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                        <SelectValue placeholder="Tipo de Examen" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:text-white dark:border-gray-700">
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

          {/* Tarjeta de Historial (Tabla) */}
          <Card className="border-gray-200 dark:border-gray-700 shadow-sm w-full mt-6 dark:bg-gray-800">
            <CardHeader className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Historial</CardTitle>
                {!loadingDiagnosticos && (
                  <Badge variant="secondary" className="font-normal bg-teal-100 text-teal-700 dark:bg-teal-800 dark:text-teal-300">
                    {filteredDiagnosticos.length} resultado(s)
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadDiagnosticos}
                className="text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-gray-700"
                disabled={loadingDiagnosticos}
              >
                {loadingDiagnosticos ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                <span>{loadingDiagnosticos ? "Actualizando..." : "Actualizar"}</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-100 dark:bg-gray-700/60">
                    <TableRow className="border-gray-200 dark:border-gray-600">
                      <TableHead className="w-[70px] px-4 py-2"><button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase hover:text-teal-700 dark:text-gray-300 dark:hover:text-teal-400" onClick={() => requestSort("id_diagnostico")}>ID {getSortDirectionIcon("id_diagnostico")}</button></TableHead>
                      <TableHead className="px-4 py-2"><button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase hover:text-teal-700 dark:text-gray-300 dark:hover:text-teal-400" onClick={() => requestSort("nombre_paciente")}><User className="h-3.5 w-3.5" /> Paciente {getSortDirectionIcon("nombre_paciente")}</button></TableHead>
                      <TableHead className="px-4 py-2"><button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase hover:text-teal-700 dark:text-gray-300 dark:hover:text-teal-400" onClick={() => requestSort("nombre_medico")}><Stethoscope className="h-3.5 w-3.5" /> Médico {getSortDirectionIcon("nombre_medico")}</button></TableHead>
                      <TableHead className="px-4 py-2"><button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase hover:text-teal-700 dark:text-gray-300 dark:hover:text-teal-400" onClick={() => requestSort("fecha_diagnostico")}><Calendar className="h-3.5 w-3.5" /> Fecha {getSortDirectionIcon("fecha_diagnostico")}</button></TableHead>
                      <TableHead className="px-4 py-2"><button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase hover:text-teal-700 dark:text-gray-300 dark:hover:text-teal-400" onClick={() => requestSort("nombre_tipo_examen")}><FileText className="h-3.5 w-3.5" /> Tipo Ex. {getSortDirectionIcon("nombre_tipo_examen")}</button></TableHead>
                      <TableHead className="px-4 py-2"><button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase hover:text-teal-700 dark:text-gray-300 dark:hover:text-teal-400" onClick={() => requestSort("resultado")}>Resultado {getSortDirectionIcon("resultado")}</button></TableHead>
                      <TableHead className="px-4 py-2"><button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase hover:text-teal-700 dark:text-gray-300 dark:hover:text-teal-400" onClick={() => requestSort("nivel_confianza")}>Confianza {getSortDirectionIcon("nivel_confianza")}</button></TableHead>
                      <TableHead className="px-4 py-2"><button className="flex items-center gap-1 font-medium text-xs text-gray-600 uppercase hover:text-teal-700 dark:text-gray-300 dark:hover:text-teal-400" onClick={() => requestSort("estado")}>Estado {getSortDirectionIcon("estado")}</button></TableHead>
                      <TableHead className="text-right px-4 py-2 text-xs font-medium text-gray-600 uppercase dark:text-gray-300">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDiagnosticos ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
                            <span className="text-sm text-gray-500 dark:text-gray-300">Cargando diagnósticos...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedDiagnosticos.length > 0 ? (
                      paginatedDiagnosticos.map((diag) => (
                        <TableRow key={diag.id_diagnostico} className="hover:bg-gray-50 text-sm border-b dark:hover:bg-gray-700/50 dark:border-gray-700">
                          <TableCell className="font-medium text-teal-700 dark:text-teal-400 px-4 py-3">{diag.id_diagnostico}</TableCell>
                          <TableCell className="px-4 py-3 text-gray-900 dark:text-white">{diag.nombre_paciente || "—"}</TableCell>
                          <TableCell className="px-4 py-3 text-gray-900 dark:text-white">{diag.nombre_medico || "—"}</TableCell>
                          <TableCell className="px-4 py-3 text-gray-900 dark:text-white">{formatDate(diag.fecha_diagnostico, { day: '2-digit', month: 'short', year: 'numeric' } as Intl.DateTimeFormatOptions)}</TableCell>
                          <TableCell className="px-4 py-3 text-gray-900 dark:text-white">{diag.nombre_tipo_examen || "—"}</TableCell>
                          <TableCell className="px-4 py-3 text-gray-900 dark:text-white"><div className="max-w-[180px] truncate" title={diag.resultado}>{diag.resultado || "—"}</div></TableCell>
                          <TableCell className="px-4 py-3 text-center"><Badge variant={diag.nivel_confianza >= 0.8 ? "default" : diag.nivel_confianza >= 0.5 ? "secondary" : "destructive"} className={`font-medium ${diag.nivel_confianza >= 0.8 ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300' : diag.nivel_confianza >= 0.5 ? 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-800 dark:text-yellow-300 dark:border-yellow-600' : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300'}`}>{formatConfidence(diag.nivel_confianza)}</Badge></TableCell>
                          <TableCell className="px-4 py-3"><Badge variant={diag.estado === 'Completado' ? 'default' : diag.estado === 'Pendiente' ? 'outline' : 'destructive'} className={`${diag.estado === 'Completado' ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300' : diag.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-800 dark:text-yellow-300 dark:border-yellow-600' : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300'}`}>{diag.estado || "—"}</Badge></TableCell>
                          <TableCell className="text-right px-4 py-3">
                            <div className="flex justify-end items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDiagnostico(diag.id_diagnostico)}
                                className="h-8 w-8 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-md dark:text-gray-400 dark:hover:text-teal-400 dark:hover:bg-gray-700"
                                title="Ver Detalles"
                                disabled={deletingId === diag.id_diagnostico}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteDiagnostico(diag.id_diagnostico)}
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700"
                                title="Eliminar Diagnóstico"
                                disabled={deletingId === diag.id_diagnostico}
                              >
                                {deletingId === diag.id_diagnostico ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-500 dark:text-gray-300">No se encontraron diagnósticos.</span>
                            {(searchTerm || filtroTipoExamen) && (
                              <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
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
            {/* Paginación */}
            {filteredDiagnosticos.length > 0 && totalPages > 1 && (
              <CardFooter
                className="flex items-center justify-between border-t border-gray-200 px-6 py-3 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50"
              >
                <div className="text-xs text-gray-500 dark:text-gray-300">
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
                    className="h-7 w-7 border-gray-300 rounded-md dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-xs font-medium px-2.5 py-1 rounded dark:text-white">
                    Pág {currentPage} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="h-7 w-7 border-gray-300 rounded-md dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </Fragment>
      )}

      {/* Modal de Detalles del Diagnóstico */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col rounded-lg dark:bg-gray-800 dark:text-white">
          <DialogHeader className="p-6 border-b dark:border-gray-700">
            <DialogTitle className="text-2xl font-semibold text-gray-800 dark:text-white">
              Detalles del Diagnóstico #{selectedDiagnostico?.id_diagnostico || '...'}
            </DialogTitle>
            {selectedDiagnostico?.fecha_diagnostico && (
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-300">
                Fecha del diagnóstico: {formatDate(selectedDiagnostico.fecha_diagnostico, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' } as Intl.DateTimeFormatOptions)}
              </DialogDescription>
            )}
          </DialogHeader>

          <ScrollArea className="flex-grow overflow-y-auto p-6">
            {modalLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Cargando detalles...</p>
              </div>
            ) : modalError ? (
              <Alert variant="destructive" className="my-4 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error al Cargar Detalles</AlertTitle>
                <AlertDescription>{modalError}</AlertDescription>
                <Button variant="outline" size="sm" onClick={() => selectedDiagnostico && handleViewDiagnostico(selectedDiagnostico.id_diagnostico)} className="mt-2 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-800">
                  Reintentar
                </Button>
              </Alert>
            ) : selectedDiagnostico ? (
              <div className="space-y-6">
                {/* Información General del Diagnóstico */}
                <Card className="shadow-md border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2 dark:text-white"><Info className="h-5 w-5 text-teal-600 dark:text-teal-400" />Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm dark:text-gray-200">
                    <div><strong>ID Diagnóstico:</strong> <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-200">{selectedDiagnostico.id_diagnostico}</Badge></div>
                    <div><strong>Estado:</strong> <Badge variant={selectedDiagnostico.estado_diagnostico === 'Completado' ? 'default' : selectedDiagnostico.estado_diagnostico === 'Pendiente' ? 'secondary' : 'destructive'} className={`${selectedDiagnostico.estado_diagnostico === 'Completado' ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300' : selectedDiagnostico.estado_diagnostico === 'Pendiente' ? 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-800 dark:text-yellow-300 dark:border-yellow-600' : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300'}`}>{selectedDiagnostico.estado_diagnostico}</Badge></div>
                    <div><strong>Paciente:</strong> {selectedDiagnostico.nombre_paciente || "N/A"} (NUI: {selectedDiagnostico.nui_paciente || "N/A"})</div>
                    <div><strong>Médico:</strong> {selectedDiagnostico.nombre_medico || "N/A"}</div>
                    <div><strong>Tipo de Examen:</strong> {selectedDiagnostico.nombre_tipo_examen || "N/A"}</div>
                    <div><strong>Resultado Principal (IA):</strong> {selectedDiagnostico.resultado || "N/A"}</div>
                    <div><strong>Nivel de Confianza (IA):</strong> <Badge variant={selectedDiagnostico.nivel_confianza >= 0.8 ? "default" : selectedDiagnostico.nivel_confianza >= 0.5 ? "secondary" : "destructive"} className={`${selectedDiagnostico.nivel_confianza >= 0.8 ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300' : selectedDiagnostico.nivel_confianza >= 0.5 ? 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-800 dark:text-yellow-300 dark:border-yellow-600' : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300'}`}>{formatConfidence(selectedDiagnostico.nivel_confianza)}</Badge></div>
                  </CardContent>
                </Card>

                {/* Análisis Detallado (IA) */}
                {(selectedDiagnostico.ai_descripcion_detallada || selectedDiagnostico.ai_pronostico_tiempo_recuperacion || selectedDiagnostico.ai_pronostico_probabilidad_mejoria) && (
                  <Card className="shadow-md border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-700/50">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2 dark:text-white"><Stethoscope className="h-5 w-5 text-teal-600 dark:text-teal-400" />Análisis Detallado (IA)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm dark:text-gray-200">
                      {selectedDiagnostico.ai_descripcion_detallada && (
                        <div>
                          <h4 className="font-semibold text-gray-700 dark:text-gray-100 mb-1">Descripción Detallada:</h4>
                          <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md dark:bg-gray-800 dark:text-gray-300">{selectedDiagnostico.ai_descripcion_detallada}</p>
                        </div>
                      )}
                      {(selectedDiagnostico.ai_pronostico_tiempo_recuperacion || selectedDiagnostico.ai_pronostico_probabilidad_mejoria) && (
                        <div>
                          <h4 className="font-semibold text-gray-700 dark:text-gray-100 mb-1 mt-3 flex items-center gap-1.5"><HeartPulse className="h-4 w-4 dark:text-teal-400" />Pronóstico:</h4>
                          {selectedDiagnostico.ai_pronostico_tiempo_recuperacion && <p className="text-gray-600 dark:text-gray-300"><strong>Tiempo de recuperación:</strong> {selectedDiagnostico.ai_pronostico_tiempo_recuperacion}</p>}
                          {selectedDiagnostico.ai_pronostico_probabilidad_mejoria && <p className="text-gray-600 dark:text-gray-300"><strong>Probabilidad de mejoría:</strong> {selectedDiagnostico.ai_pronostico_probabilidad_mejoria}</p>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Imagen Médica */}
                <Card className="shadow-md border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2 dark:text-white"><ImageIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />Imagen Médica</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    {selectedDiagnostico.imagen_url ? (
                      <div className="flex flex-col items-center">
                        <div className="bg-gray-100 rounded-md p-2 shadow-inner mb-4 dark:bg-gray-800">
                          <img
                            ref={imageToCaptureRef} // Referencia para captura de imagen para PDF
                            src={getImageUrlFromDetails(selectedDiagnostico.imagen_url, selectedDiagnostico.imagen_tipo)}
                            alt={`Imagen del diagnóstico ${selectedDiagnostico.id_diagnostico}`}
                            className="rounded-md max-w-full h-auto max-h-96 object-contain border shadow-sm dark:border-gray-600"
                            onError={(e) => {
                              console.error("Error al cargar la imagen en <img>:", e);
                              (e.target as HTMLImageElement).src = `https://placehold.co/600x400/e2e8f0/94a3b8?text=Error+al+cargar+imagen`;
                              (e.target as HTMLImageElement).alt = 'Error al cargar imagen';
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-600 bg-teal-50 px-3 py-1.5 rounded-md dark:bg-teal-900 dark:text-teal-300">
                          <p>ID Diagnóstico: {selectedDiagnostico.id_diagnostico} | Tipo: {selectedDiagnostico.imagen_tipo || "No especificado"}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 p-4 dark:text-gray-300">
                        <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-2 dark:text-gray-500" />
                        No hay imagen asociada a este diagnóstico.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recomendaciones */}
                {selectedDiagnostico.recomendaciones && selectedDiagnostico.recomendaciones.length > 0 && (
                  <Card className="shadow-md border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-700/50">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2 dark:text-white"><ListChecks className="h-5 w-5 text-teal-600 dark:text-teal-400" />Recomendaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {selectedDiagnostico.recomendaciones.map((rec) => (
                          <li key={rec.id_recomendacion} className="p-3 border rounded-md bg-gray-50/70 shadow-sm dark:border-gray-600 dark:bg-gray-800/70 dark:text-gray-200">
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-sm font-medium text-gray-800 dark:text-white">{rec.descripcion}</p>
                              <Badge
                                variant={rec.prioridad === 'Alta' ? 'destructive' : rec.prioridad === 'Media' ? 'default' : 'secondary'}
                                className={`text-xs whitespace-nowrap ${
                                  rec.prioridad === 'Alta' ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300'
                                  : rec.prioridad === 'Media' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300' // Color para prioridad 'Baja' u otras
                                }`}
                              >
                                Prioridad: {rec.prioridad}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Registrada: {formatDate(rec.fecha_creacion, { day: '2-digit', month: 'short', year: 'numeric' } as Intl.DateTimeFormatOptions)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {(!selectedDiagnostico.recomendaciones || selectedDiagnostico.recomendaciones.length === 0) && (
                  <p className="text-sm text-gray-500 p-4 border rounded-md bg-gray-50 text-center dark:text-gray-300 dark:border-gray-700 dark:bg-gray-800/50">No hay recomendaciones registradas para este diagnóstico.</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">No se ha seleccionado ningún diagnóstico o no hay datos para mostrar.</p>
              </div>
            )}
          </ScrollArea>

          {/* Pie de página del Modal */}
          <DialogFooter className="p-4 border-t bg-gray-50 rounded-b-lg flex flex-col sm:flex-row sm:justify-end gap-2 dark:border-gray-700 dark:bg-gray-800/80">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 w-full sm:w-auto dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cerrar
            </Button>
            {selectedDiagnostico && !modalLoading && (
              <Button
                onClick={handleDownloadPDFFromModal}
                disabled={pdfLoading}
                className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto dark:bg-teal-700 dark:hover:bg-teal-800"
              >
                {pdfLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                {pdfLoading ? "Generando PDF..." : "Descargar PDF"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
