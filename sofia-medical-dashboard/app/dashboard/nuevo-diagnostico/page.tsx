"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/AuthContext" 
import { analyzeImageWithOpenRouter } from "@/lib/openrouter" 
import { generateDiagnosisPDF } from "@/lib/generate-pdf" 
import { parseDicomFile, applyWindowLevel, type DicomData, type DicomResult } from "@/src/lib/dicomService"; 
import type { SearchedPatient } from "@/lib/db"; 

// UI Components
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  Save,
  Download,
  AlertCircle,
  CheckCircle2,
  Search,
  User,
  FileImage,
  Stethoscope,
  Calendar,
  FileText, 
} from "lucide-react"

// Interface for diagnosis result
interface DiagnosticoResult {
  condition?: string
  confidence?: number 
  description?: string
  recomendaciones?: string[]
  pronostico?: {
    tiempo_recuperacion?: string
    probabilidad_mejoria?: string
  }
}

export default function NuevoDiagnosticoPage() {
  const [activeTab, setActiveTab] = useState("cargar")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosticoResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [searchResults, setSearchResults] = useState<SearchedPatient[]>([]) 
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)

  const [pacienteId, setPacienteId] = useState<string | null>(null)
  const [tipoExamen, setTipoExamen] = useState<string>("Radiografía")
  const [confianzaIA, setConfianzaIA] = useState<number | null>(null)
  const [resultadoIA, setResultadoIA] = useState<string | null>(null)
  const [region, setRegion] = useState("torax") 

  const [originalFileName, setOriginalFileName] = useState<string | null>(null)
  const [processedFileType, setProcessedFileType] = useState<string | null>(null)

  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientLastName, setPatientLastName] = useState("");
  const [patientNui, setPatientNui] = useState("");
  const [examDate, setExamDate] = useState(new Date().toISOString().split("T")[0]); 
  const [clinicalHistory, setClinicalHistory] = useState(""); 

  const { user } = useAuth() 
  const imageRef = useRef<HTMLDivElement>(null) 
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchResultsRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    if (diagnosisResult) {
      setConfianzaIA(diagnosisResult.confidence !== undefined ? diagnosisResult.confidence : null)
      setResultadoIA(diagnosisResult.condition || null)
    } else {
      setConfianzaIA(null)
      setResultadoIA(null)
    }
  }, [diagnosisResult])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) { 
      if (
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node) &&
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target as Node) 
      ) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, []) 

  const handlePatientSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)
    console.log("[handlePatientSearch] Término de búsqueda:", term);

    if (!term || term.trim().length < 2) { 
      setSearchResults([])
      setShowSearchResults(false)
      setPacienteId(null); 
      setPatientFirstName("");
      setPatientLastName("");
      setPatientNui("");
      console.log("[handlePatientSearch] Término corto, ocultando resultados.");
      return
    }
    setShowSearchResults(true)
    console.log("[handlePatientSearch] Estableciendo showSearchResults a true.");

    try {
      setSearchLoading(true)
      setSearchError(null)
      console.log(`[handlePatientSearch] Llamando a API: /api/dashboard/pacientes?search=${encodeURIComponent(term)}`);
      
      const response = await fetch(`/api/dashboard/pacientes?search=${encodeURIComponent(term)}`) 
      console.log("[handlePatientSearch] Respuesta de API recibida, status:", response.status);

      if (!response.ok) {
        let errorMsg = "Error al buscar pacientes";
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
          console.error("[handlePatientSearch] ErrorData de API:", errorData);
        } catch (jsonError) {
          errorMsg = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      // --- CORRECCIÓN AQUÍ ---
      const responseData = await response.json(); 
      console.log("[handlePatientSearch] responseData de API:", responseData); 
      
      if (responseData && Array.isArray(responseData.pacientes)) {
        setSearchResults(responseData.pacientes);
        console.log("[handlePatientSearch] Pacientes asignados a searchResults:", responseData.pacientes);
      } else {
        // Si la estructura es directamente un array (como en algunos casos anteriores)
        if (Array.isArray(responseData)) {
            setSearchResults(responseData);
            console.log("[handlePatientSearch] Pacientes asignados directamente (array) a searchResults:", responseData);
        } else {
            console.warn("[handlePatientSearch] La respuesta de la API no tiene el formato esperado (falta .pacientes o no es un array):", responseData);
            setSearchResults([]); 
        }
      }
      // --- FIN DE CORRECCIÓN ---

    } catch (err: any) {
      console.error("[handlePatientSearch] Catch error:", err);
      setSearchError(err.message || "No se pudieron cargar los resultados.")
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
      console.log("[handlePatientSearch] Finalizando búsqueda.");
    }
  }

  const selectPatient = (patient: SearchedPatient) => { 
    console.log("[selectPatient] Seleccionando paciente:", patient); 
    setPacienteId(patient.id_usuario.toString()); 
    setPatientFirstName(patient.primer_nombre);
    setPatientLastName(patient.primer_apellido);
    setPatientNui(patient.nui);
    
    setSearchTerm(`${patient.primer_nombre} ${patient.primer_apellido} (${patient.nui})`); 
    setShowSearchResults(false); 
    setSearchResults([]); 
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    setImagePreview(null)
    setImageBase64(null)
    setOriginalFileName(file.name) 
    setProcessedFileType(null) 

    let currentProgress = 0
    const progressInterval = setInterval(() => {
      currentProgress += 10
      if (currentProgress <= 100) {
        setUploadProgress(currentProgress)
      } else {
        clearInterval(progressInterval)
      }
    }, 100)


    try {
      const isDicom = file.name.toLowerCase().endsWith(".dcm") || file.type === "application/dicom"

      if (isDicom) {
        try {
          console.log("Procesando archivo DICOM...");
          const dicomParseResult: DicomResult = await parseDicomFile(file) 
          
          if (!dicomParseResult.success) { 
            throw new Error(dicomParseResult.error || "Error desconocido al parsear DICOM.");
          }
          const dicomData: DicomData = dicomParseResult.data; 
          console.log("DICOM parseado, generando PNG...");
          
          const {
            width,
            height,
            pixelData: rawPixelData, 
            windowCenter,
            windowWidth,
            slope,
            intercept,
          } = dicomData;

          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (!ctx) throw new Error("No se pudo crear contexto de canvas")

          const imageData = ctx.createImageData(width, height) 
          
          applyWindowLevel(
            imageData.data, 
            rawPixelData,   
            width,
            height,
            windowCenter,
            windowWidth,
            slope,
            intercept       
          );

          ctx.putImageData(imageData, 0, 0)
          const pngUrl = canvas.toDataURL("image/png", 0.95) 
          const pngBase64 = pngUrl.split(",")[1]

          setImageBase64(pngBase64)
          setImagePreview(pngUrl)
          setProcessedFileType("PNG") 
          console.log("PNG generado desde DICOM.");

        } catch (err: any) {
          console.error("Error procesando DICOM:", err)
          setError(`Error al procesar archivo DICOM: ${err.message}. Asegúrese que es un archivo válido y soportado.`)
          setIsUploading(false)
          setOriginalFileName(null)
          clearInterval(progressInterval)
          setUploadProgress(0)
          return
        }
      } else if (file.type.startsWith("image/")) { 
        console.log("Procesando archivo de imagen estándar...");
        const previewUrl = URL.createObjectURL(file)
        setImagePreview(previewUrl)

        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(",")[1]
          setImageBase64(base64String)
          if (file.type === "image/png") setProcessedFileType("PNG");
          else if (file.type === "image/jpeg") setProcessedFileType("JPG");
          else setProcessedFileType(file.type.split('/')[1]?.toUpperCase() || "IMG"); 
          console.log("Imagen estándar procesada.");
        }
        reader.readAsDataURL(file)
      } else {
        throw new Error("Formato de archivo no soportado. Use DICOM, PNG o JPG.");
      }

      clearInterval(progressInterval) 
      setUploadProgress(100) 
      setIsUploading(false)

    } catch (err: any) {
      console.error("Error en handleFileChange:", err)
      setError(err.message || "Error al cargar el archivo.")
      setIsUploading(false)
      setOriginalFileName(null)
      setProcessedFileType(null)
      clearInterval(progressInterval)
      setUploadProgress(0)
    }
  }

  const handleAnalyze = async () => {
    if (!imageBase64) {
      setError("No hay imagen cargada para analizar.")
      return
    }

    setIsAnalyzing(true)
    setActiveTab("resultados")
    setError(null)
    setAnalysisComplete(false)
    setDiagnosisResult(null)

    try {
      console.log("Enviando imagen a analizar con OpenRouter...");
      const result = await analyzeImageWithOpenRouter(imageBase64)
      console.log("Resultado de analyzeImageWithOpenRouter:", result)

      if (!result || (result.condition === undefined && result.description === undefined)) {
          throw new Error("La respuesta de la IA no contiene 'condition' ni 'description'.");
      }

      setDiagnosisResult(result)
      setAnalysisComplete(true)
      console.log("Análisis completado y resultado establecido.");
    } catch (err: any) {
      setError(`Error al analizar la imagen: ${err.message}. Por favor, intente nuevamente.`)
      console.error("Error en handleAnalyze:", err)
      setActiveTab("cargar") 
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDownloadReport = async () => {
      if (!diagnosisResult || !pacienteId) {
        setError("No hay diagnóstico completo o paciente seleccionado para generar el reporte.")
        return
    }

    const reportData = {
      patientInfo: {
        id: pacienteId,
        name: `${patientFirstName} ${patientLastName}`.trim(),
        nui: patientNui,
        examDate: examDate, 
        clinicalHistory: clinicalHistory, 
      },
      diagnosis: diagnosisResult,
      imageFileName: originalFileName || "imagen_medica",
      examType: tipoExamen,
    }

    try {
      setLoading(true) 
      console.log("Generando PDF con datos:", reportData);
      const pdf = await generateDiagnosisPDF(reportData, imageRef.current || undefined) 
      pdf.save(`diagnostico_${reportData.patientInfo.name.replace(/\s+/g, '_') || 'paciente'}.pdf`)
      console.log("PDF generado y descarga iniciada.");
    } catch (error) {
      console.error("Error al generar el PDF:", error)
      setError("Error al generar el PDF. Por favor, intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    console.log("[handleSave] Iniciando proceso de guardado..."); 

    console.log("[handleSave] Validando datos:", { pacienteId, userId: user?.id_usuario, analysisComplete, diagnosisResult, resultadoIA });

    if (!pacienteId) {
      setError("Por favor, busque y seleccione un paciente.")
      console.error("[handleSave] Error: Falta pacienteId"); 
      return
    }
    if (!user?.id_usuario) {
      setError("No se pudo identificar al médico. Por favor, inicie sesión nuevamente.")
      console.error("[handleSave] Error: Falta user.id_usuario o user es null/undefined", {user}); // Loguear el objeto user
      return
    }
    if (!analysisComplete || !diagnosisResult) {
      setError("El análisis de la imagen no se ha completado o no hay resultados.")
        console.error("[handleSave] Error: Análisis no completo o sin resultados"); 
      return
    }
    if (!diagnosisResult.condition && !diagnosisResult.description) { 
        setError("El resultado del análisis de IA (condición o descripción) es obligatorio.")
        console.error("[handleSave] Error: Falta condition y description en diagnosisResult"); 
        return
    }


    setLoading(true)

    const payload = {
      id_paciente: parseInt(pacienteId, 10),
      id_medico: user.id_usuario, 
      tipoExamenNombre: tipoExamen,
      imageBase64: imageBase64, 
      tipoImagen: processedFileType, 
      originalFileName: originalFileName,
      diagnosisAIResult: diagnosisResult, 
    }

    console.log("[handleSave] Enviando payload:", JSON.stringify(payload, null, 2))

    try {
      console.log("[handleSave] Realizando fetch a /api/diagnosticos...");
      const response = await fetch("/api/diagnosticos", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log("[handleSave] Respuesta recibida:", response);

      const result = await response.json(); 
      console.log("[handleSave] Resultado parseado:", result);

      if (!response.ok) {
        console.error("[handleSave] Respuesta no OK:", { status: response.status, statusText: response.statusText, result });
        throw new Error(result.error || `Error del servidor: ${response.status}`) 
      }

      console.log("[handleSave] Diagnóstico guardado exitosamente:", result);
      alert(`Diagnóstico guardado exitosamente con ID: ${result.id_diagnostico}`) 
      
      // Limpiar formulario y estados
      setPacienteId(null)
      setSearchTerm("")
      setPatientFirstName("");
      setPatientLastName("");
      setPatientNui("");
      setExamDate(new Date().toISOString().split("T")[0]); 
      setClinicalHistory(""); 
      
      setImagePreview(null)
      setImageBase64(null)
      setOriginalFileName(null)
      setProcessedFileType(null)
      setDiagnosisResult(null)
      setAnalysisComplete(false)
      setResultadoIA(null)
      setConfianzaIA(null)
      setTipoExamen("Radiografía")
      setRegion("torax")
      setActiveTab("cargar")

    } catch (err: any) {
      console.error("[handleSave] Error en el bloque try/catch:", err);
      if (err instanceof SyntaxError && err.message.includes("Unexpected token '<'")) {
          setError("Error de comunicación con el servidor (posiblemente ruta no encontrada).");
      } else {
          setError(err.message || "Error desconocido al guardar el diagnóstico.");
      }
    } finally {
      console.log("[handleSave] Finalizando setLoading a false.");
      setLoading(false) 
    }
  }

  // --- Renderizado del componente JSX ---
  return (
    <div className="w-full py-8 space-y-8 bg-slate-50 min-h-screen"> 
      {loading && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center space-y-3">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600"></div>
            <p className="text-gray-700 font-medium">Procesando...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 sm:px-6"> 
            <Alert variant="destructive" className="mb-6 border-red-500 bg-red-50 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-semibold">Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
      )}

      <header className="px-4 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-200"> 
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">Nuevo Diagnóstico Asistido por IA</h1>
          <p className="text-gray-500 mt-1">Cargue una imagen médica, analícela y guarde el diagnóstico.</p>
        </div>
        <div className="flex items-center gap-2">
          <img src="/Logo_sofia.png" alt="Logo SOFIA AI" className="h-10" /> 
          <span className="text-sm text-gray-600 font-medium">SOFIA AI</span>
        </div>
      </header>

      <div className="px-4 sm:px-6"> 
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-2 mb-8 bg-gray-100 p-1 rounded-lg shadow-sm">
            <TabsTrigger value="cargar" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md py-2.5">
                <FileImage className="h-5 w-5 mr-2" />
                1. Cargar y Configurar
            </TabsTrigger>
            <TabsTrigger
                value="resultados"
                disabled={!analysisComplete && !isAnalyzing} 
                className="data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md py-2.5"
            >
                <Stethoscope className="h-5 w-5 mr-2" />
                2. Resultados y Guardado
            </TabsTrigger>
            </TabsList>

            {/* Pestaña Cargar Imagen */}
            <TabsContent value="cargar" className="space-y-6"> 
            <Card className="w-full border-gray-200 shadow-lg rounded-xl overflow-hidden">
                <CardHeader className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <CardTitle className="flex items-center text-xl font-semibold text-teal-700">
                    <Upload className="h-6 w-6 mr-3 text-teal-600" />
                    Cargar Imagen Médica
                </CardTitle>
                <CardDescription className="text-gray-500 mt-1">Soporta DICOM (.dcm), PNG, JPG. Tamaño máximo: 10MB.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                <div
                    className={`border-2 border-dashed rounded-lg p-6 sm:p-8 flex flex-col items-center justify-center transition-colors min-h-[250px] ${
                    isUploading ? "border-teal-400 bg-teal-50" : imagePreview ? "border-gray-300" : "border-gray-300 hover:border-teal-400 bg-gray-50"
                    }`}
                >
                    {imagePreview ? (
                    <div className="w-full flex flex-col items-center text-center">
                        <div className="relative w-full max-h-[280px] sm:max-h-[350px] overflow-hidden rounded-md mb-4 shadow-md border border-gray-200 bg-white">
                        <img
                            src={imagePreview}
                            alt="Vista previa de la imagen médica"
                            className="w-full h-full object-contain"
                        />
                        </div>
                        {originalFileName && (
                            <div className="mb-3 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md inline-flex items-center">
                                <FileText size={16} className="mr-2 text-gray-500"/> {originalFileName}
                            </div>
                        )}
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setImagePreview(null); setImageBase64(null); setOriginalFileName(null); setProcessedFileType(null);
                            (document.getElementById("file-upload") as HTMLInputElement).value = ""; 
                        }}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                        Eliminar imagen
                        </Button>
                    </div>
                    ) : isUploading ? (
                    <div className="w-full space-y-4 py-6 text-center">
                        <div className="flex justify-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600"></div>
                        </div>
                        <Progress value={uploadProgress} className="w-full h-2.5 rounded-full [&>div]:bg-teal-500" />
                        <p className="text-sm text-gray-600">
                        {uploadProgress < 100 ? `Procesando: ${uploadProgress}%` : "Procesamiento casi listo..."}
                        </p>
                    </div>
                    ) : (
                    <div className="text-center py-8">
                        <Upload className="mx-auto h-16 w-16 text-teal-400 mb-4" />
                        <p className="mt-2 text-lg font-medium text-gray-700">Arrastre y suelte su imagen aquí</p>
                        <p className="mt-1 text-sm text-gray-500">o haga clic para seleccionar un archivo</p>
                        <Input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".dcm,application/dicom,image/png,image/jpeg,image/jpg"
                        onChange={handleFileChange}
                        />
                        <Button
                        variant="outline"
                        className="mt-6 bg-white border-teal-500 text-teal-600 hover:bg-teal-50 hover:border-teal-600 font-semibold px-6 py-2.5"
                        onClick={() => document.getElementById("file-upload")?.click()}
                        >
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar Archivo
                        </Button>
                    </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-1.5">
                    <Label htmlFor="imageType" className="text-gray-700 font-medium">Tipo de Examen</Label>
                    <Select value={tipoExamen} onValueChange={setTipoExamen}>
                        <SelectTrigger id="imageType" className="border-gray-300 h-11">
                        <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Radiografía">Radiografía</SelectItem>
                        <SelectItem value="Tomografía">Tomografía Computarizada (TC)</SelectItem>
                        <SelectItem value="Resonancia">Resonancia Magnética (RM)</SelectItem>
                        <SelectItem value="Ecografía">Ecografía</SelectItem>
                        <SelectItem value="Mamografía">Mamografía</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="space-y-1.5">
                    <Label htmlFor="anatomicalRegion" className="text-gray-700 font-medium">Región Anatómica Principal</Label> 
                    <Select value={region} onValueChange={setRegion}>
                        <SelectTrigger id="anatomicalRegion" className="border-gray-300 h-11">
                            <SelectValue placeholder="Seleccionar región"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="torax">Tórax</SelectItem>
                            <SelectItem value="abdomen">Abdomen</SelectItem>
                            <SelectItem value="craneo">Cráneo/Cerebro</SelectItem>
                            <SelectItem value="columna">Columna Vertebral</SelectItem>
                            <SelectItem value="extremidades_superiores">Extremidades Superiores</SelectItem>
                            <SelectItem value="extremidades_inferiores">Extremidades Inferiores</SelectItem>
                            <SelectItem value="pelvis">Pelvis</SelectItem>
                            <SelectItem value="cuello">Cuello</SelectItem>
                            <SelectItem value="mama">Mama</SelectItem>
                            <SelectItem value="otro">Otra</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t px-6 py-4">
                <Button
                    onClick={handleAnalyze}
                    disabled={!imageBase64 || isUploading || isAnalyzing}
                    className="ml-auto bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2.5 text-base"
                >
                    {isAnalyzing ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white mr-2"></div>
                            Analizando...
                        </>
                    ) : "Analizar Imagen con IA"}
                </Button>
                </CardFooter>
            </Card>
            </TabsContent>

            {/* Pestaña Resultados y Guardado */}
            <TabsContent value="resultados" className="space-y-6"> 
            <Card className="w-full border-gray-200 shadow-lg rounded-xl overflow-hidden"> 
                <CardHeader className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <CardTitle className="flex items-center text-xl font-semibold text-teal-700">
                    <Stethoscope className="h-6 w-6 mr-3 text-teal-600" />
                    Resultados del Análisis y Registro
                </CardTitle>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                    <span>Diagnóstico asistido por</span>
                    <img src="/Logo_sofia.png" alt="SOFIA AI" className="h-4" />
                </div>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600"></div>
                    <p className="text-lg font-medium text-gray-700">Analizando imagen médica...</p>
                    <p className="text-sm text-gray-500 mt-1">Esto puede tomar unos segundos. Por favor, espere.</p>
                    </div>
                ) : analysisComplete && diagnosisResult ? (
                    <form onSubmit={handleSave} className="space-y-8">
                    {/* Sección de Resultados de IA y Vista de Imagen */}
                    <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-start">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Resumen del Análisis IA</h3>
                            {imagePreview && (
                                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-1 shadow-sm">
                                    <div ref={imageRef} className="rounded overflow-hidden">
                                    <img
                                        src={imagePreview}
                                        alt="Imagen médica analizada"
                                        className="w-full object-contain max-h-[300px] lg:max-h-[350px]"
                                    />
                                    </div>
                                </div>
                            )}
                            {originalFileName && (
                                <p className="text-xs text-gray-500 text-center">Archivo: {originalFileName}</p>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="bg-teal-50 p-4 rounded-lg border border-teal-200 shadow-sm">
                                <h4 className="text-md font-semibold text-teal-800 mb-1.5">Condición Principal Detectada:</h4>
                                <p className="text-xl font-bold text-teal-700">
                                    {diagnosisResult.condition || "No especificada"}
                                </p>
                                {diagnosisResult.confidence !== undefined && (
                                    <p className="text-sm text-teal-600 mt-1">
                                        Nivel de Confianza IA: <span className="font-semibold">{(diagnosisResult.confidence * 100).toFixed(1)}%</span>
                                    </p>
                                )}
                            </div>

                            {diagnosisResult.description && (
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-md font-semibold text-gray-700 mb-1.5">Descripción / Hallazgos Adicionales:</h4>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{diagnosisResult.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recomendaciones y Pronóstico */}
                    <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                        {diagnosisResult.recomendaciones && diagnosisResult.recomendaciones.length > 0 && (
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h4 className="text-md font-semibold text-gray-700 mb-2">Recomendaciones Sugeridas por IA:</h4>
                                <ul className="space-y-1.5 text-sm list-disc list-inside pl-2 text-gray-600">
                                {diagnosisResult.recomendaciones.map((rec, i) => (
                                    <li key={i}>{rec || "N/A"}</li>
                                ))}
                                </ul>
                            </div>
                        )}
                        {diagnosisResult.pronostico && (
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h4 className="text-md font-semibold text-gray-700 mb-2">Pronóstico Estimado por IA:</h4>
                                <div className="space-y-1 text-sm">
                                    <p><strong>Tiempo de recuperación:</strong> {diagnosisResult.pronostico.tiempo_recuperacion || "N/A"}</p>
                                    <p><strong>Probabilidad de mejoría:</strong> {diagnosisResult.pronostico.probabilidad_mejoria || "N/A"}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <Separator className="my-6" />

                    {/* Formulario de Datos del Paciente */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Información del Paciente y Examen</h3>
                        <div className="space-y-2 relative">
                        <Label htmlFor="searchPatient" className="text-gray-700 font-medium">Buscar y Seleccionar Paciente*</Label>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /> 
                            <Input
                            id="searchPatient"
                            ref={searchInputRef}
                            placeholder="Buscar por NUI, nombre o apellido..."
                            className="pl-11 border-gray-300 h-11"
                            value={searchTerm} // Controlado por estado
                            onChange={handlePatientSearch}
                            onFocus={() => setShowSearchResults(true)}
                            required={!pacienteId} 
                            />
                        </div>
                        {searchLoading && <p className="text-xs text-gray-500 mt-1.5">Buscando...</p>}
                        {searchError && <p className="text-xs text-red-500 mt-1.5">{searchError}</p>}
                        
                        {/* Desplegable de resultados de búsqueda */}
                        {console.log("[Render] showSearchResults:", showSearchResults, "searchResults:", searchResults)}
                        {showSearchResults && searchResults.length > 0 && (
                            <div 
                                ref={searchResultsRef} 
                                className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
                            >
                            {searchResults.map((patient) => (
                                <div
                                key={patient.id_usuario}
                                className="px-4 py-2.5 hover:bg-teal-50 cursor-pointer border-b border-gray-100 last:border-0"
                                onClick={() => selectPatient(patient)}
                                >
                                <div className="font-medium text-gray-800 text-sm">{patient.primer_nombre} {patient.primer_apellido}</div>
                                <div className="text-xs text-gray-500">NUI: {patient.nui}</div>
                                </div>
                            ))}
                            </div>
                        )}
                        {pacienteId && <p className="text-xs text-green-600 mt-1">Paciente seleccionado (ID: {pacienteId}).</p>}
                        </div>

                        {/* Campos de Paciente (controlados por estado) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="patientFirstName" className="text-gray-700">Nombre(s)</Label>
                            <Input 
                                id="patientFirstName" 
                                value={patientFirstName} 
                                onChange={(e) => setPatientFirstName(e.target.value)} 
                                className="border-gray-300 bg-gray-100" 
                                readOnly 
                                placeholder="Automático al seleccionar"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="patientLastName" className="text-gray-700">Apellido(s)</Label>
                            <Input 
                                id="patientLastName" 
                                value={patientLastName} 
                                onChange={(e) => setPatientLastName(e.target.value)} 
                                className="border-gray-300 bg-gray-100" 
                                readOnly 
                                placeholder="Automático al seleccionar"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="patientNui" className="text-gray-700">NUI/Documento</Label>
                            <Input 
                                id="patientNui" 
                                value={patientNui} 
                                onChange={(e) => setPatientNui(e.target.value)} 
                                className="border-gray-300 bg-gray-100" 
                                readOnly 
                                placeholder="Automático al seleccionar"
                            />
                        </div>
                        </div>
                    
                        {/* Campo Fecha Examen (controlado por estado) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5 md:col-span-1"> 
                                <Label htmlFor="examDate" className="text-gray-700">Fecha del Examen</Label>
                                <Input 
                                    id="examDate" 
                                    type="date" 
                                    value={examDate}
                                    onChange={(e) => setExamDate(e.target.value)}
                                    className="border-gray-300" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="clinicalHistory" className="text-gray-700">Breve Historia Clínica Relevante (Opcional)</Label>
                            <Textarea
                                id="clinicalHistory"
                                value={clinicalHistory}
                                onChange={(e) => setClinicalHistory(e.target.value)}
                                placeholder="Ej: Paciente con tos persistente por 2 semanas, sin fiebre..."
                                rows={3}
                                className="border-gray-300 resize-y min-h-[80px]"
                            />
                        </div>
                    </div>
                    <CardFooter className="bg-gray-50 border-t px-0 py-0 mt-8 -mx-6 -mb-6 rounded-b-xl">
                        <div className="flex flex-col sm:flex-row justify-between items-center w-full p-6 gap-3">
                            <Button type="button" variant="outline" onClick={() => setActiveTab("cargar")} className="w-full sm:w-auto">
                                Volver a Cargar Imagen
                            </Button>
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <Button 
                                    type="button" 
                                    onClick={handleDownloadReport} 
                                    variant="outline"
                                    className="border-teal-500 text-teal-600 hover:bg-teal-50 w-full sm:w-auto"
                                    disabled={!pacienteId || !diagnosisResult}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar PDF
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold w-full sm:w-auto"
                                    disabled={loading || !pacienteId || !analysisComplete || !diagnosisResult}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {loading ? "Guardando..." : "Guardar Diagnóstico"}
                                </Button>
                            </div>
                        </div>
                    </CardFooter>
                    </form>
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
                    <AlertCircle className="h-16 w-16 text-gray-400" />
                    <p className="text-lg font-medium text-gray-600">Resultados no disponibles.</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Por favor, cargue una imagen y ejecute el análisis en la pestaña anterior.
                    </p>
                    <Button variant="outline" onClick={() => setActiveTab("cargar")} className="mt-4">
                            Ir a Cargar Imagen
                        </Button>
                    </div>
                )}
                </CardContent>
            </Card>
            </TabsContent>
        </Tabs>
      </div> 
    </div>
  )
}
