"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import * as dicomParser from "dicom-parser"
import * as cornerstone from "cornerstone-core"
import { analyzeImageWithOpenRouter } from "@/lib/openrouter"
import { generateDiagnosisPDF } from "@/lib/generate-pdf"
import { parseDicomFile, applyWindowLevel } from "@/src/lib/dicomService"

// UI Components
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
  Phone,
  MapPin,
  Briefcase,
  Shield,
} from "lucide-react"

// Interface for diagnosis result (matching OpenRouterImageResponse structure)
interface DiagnosticoResult {
  condition?: string;
  confidence?: number;
  description?: string;
  recomendaciones?: string[];
  pronostico?: {
    tiempo_recuperacion?: string;
    probabilidad_mejoria?: string;
  };
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
  const [searchResults, setSearchResults] = useState<
    Array<{
      id_paciente: number
      nombre: string
      apellido: string
      documento: string
    }>
  >([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [pacienteId, setPacienteId] = useState<string | null>(null)
  const [medicoId, setMedicoId] = useState<string | null>(null)
  const [tipoExamen, setTipoExamen] = useState<string>("Radiografía")
  const [confianza, setConfianza] = useState<number | null>(null)
  const [resultado, setResultado] = useState<string | null>(null)
  const [region, setRegion] = useState("torax")
  const [showSearchResults, setShowSearchResults] = useState(false)

  const { user } = useAuth()
  const imageRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Update confidence and result from diagnosis
    if (diagnosisResult?.confidence) {
      setConfianza(diagnosisResult.confidence);
    }
    if (diagnosisResult?.condition) { // Access condition directly
      setResultado(diagnosisResult.condition); // Access condition directly
    } else {
      setResultado(null);
    }
  }, [diagnosisResult]);

  // Click outside search results handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handlePatientSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)
    setShowSearchResults(true)

    if (!term || term.trim().length < 3) {
      setSearchResults([])
      return
    }

    try {
      setSearchLoading(true)
      setSearchError(null)

      // API search
      const response = await fetch(`/api/dashboard/pacientes?search=${encodeURIComponent(term)}`)

      if (!response.ok) {
        throw new Error("Error al buscar pacientes")
      }

      const data = await response.json()
      setSearchResults(data)
    } catch (err) {
      console.error("Error en búsqueda de pacientes:", err)
      setSearchError("No se pudieron cargar los resultados. Intente nuevamente.")
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const selectPatient = (patient: {
    id_paciente: number
    nombre: string
    apellido: string
    documento: string
  }) => {
    setPacienteId(patient.id_paciente.toString())

    // Update form fields
    const firstNameInput = document.getElementById("firstName") as HTMLInputElement
    const lastNameInput = document.getElementById("lastName") as HTMLInputElement

    if (firstNameInput) firstNameInput.value = patient.nombre
    if (lastNameInput) lastNameInput.value = patient.apellido

    // Clear search
    setSearchResults([])
    setSearchTerm("")
    setShowSearchResults(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const isDicom = file.name.toLowerCase().endsWith(".dcm") || file.type === "application/dicom"

      if (isDicom) {
        try {
          setError(null)
          setUploadProgress(30)

          // Use the DICOM service for parsing
          const dicomResult = await parseDicomFile(file)
          
          if (!dicomResult.success) {
            throw new Error(dicomResult.error)
          }

          const { data } = dicomResult
          const { width, height, pixelData, windowCenter, windowWidth, slope, intercept, bitsStored, pixelRepresentation } = data

          // Create canvas for conversion
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")

          if (!ctx) throw new Error("No se pudo crear contexto de canvas")

          // Convert DICOM data to ImageData
          const imageData = ctx.createImageData(width, height)
          for (let i = 0; i < pixelData.length; i++) {
            imageData.data[i] = pixelData[i]
          }

          // Apply window/level adjustment using the service function
          applyWindowLevel(
            imageData.data,
            windowCenter,
            windowWidth,
            slope,
            intercept,
            bitsStored,
            pixelRepresentation
          )

          // Put the adjusted image data on the canvas
          ctx.putImageData(imageData, 0, 0)

          // Get PNG as base64
          setUploadProgress(80)
          const pngUrl = canvas.toDataURL("image/png", 0.95)
          const pngBase64 = pngUrl.split(",")[1]

          setImageBase64(pngBase64)
          setImagePreview(pngUrl)
          setUploadProgress(100)
        } catch (err) {
          console.error("Error procesando DICOM:", err)
          setError("Error al procesar archivo DICOM. Asegúrese que es un archivo válido.")
          setIsUploading(false)
          return
        }
      } else {
        // Process regular image (PNG/JPG)
        const previewUrl = URL.createObjectURL(file)
        setImagePreview(previewUrl)

        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(",")[1]
          setImageBase64(base64String)
        }
        reader.readAsDataURL(file)
      }

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsUploading(false)
            return 100
          }
          return prev + 10
        })
      }, 200)
    } catch (err) {
      setError("Error al cargar la imagen")
      setIsUploading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!imageBase64) return

    setIsAnalyzing(true)
    setActiveTab("resultados")
    setError(null)

    try {
      const result = await analyzeImageWithOpenRouter(imageBase64);

      console.log("Resultado de analyzeImageWithOpenRouter:", result);

      // Simplificar la actualización del estado con el resultado directo
      setDiagnosisResult(result);
      setAnalysisComplete(true);

    } catch (err) {
      setError("Error al analizar la imagen. Por favor, intente nuevamente.");
      console.error("Error en handleAnalyze:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const handleDownloadReport = async () => {
    if (!diagnosisResult) return

    const reportData = {
      patientInfo: {
        id: (document.getElementById("patientId") as HTMLInputElement)?.value || "N/A",
        name: `${(document.getElementById("firstName") as HTMLInputElement)?.value || ""} ${(document.getElementById("lastName") as HTMLInputElement)?.value || ""}`,
        age: (document.getElementById("age") as HTMLInputElement)?.value || "N/A",
        gender: (document.getElementById("gender") as HTMLInputElement)?.value || "N/A",
        examDate:
          (document.getElementById("examDate") as HTMLInputElement)?.value || new Date().toISOString().split("T")[0],
        clinicalHistory: (document.getElementById("clinicalHistory") as HTMLTextAreaElement)?.value || "",
      },
      diagnosis: diagnosisResult,
    }

    try {
      const pdf = await generateDiagnosisPDF(reportData, imageRef.current || undefined)
      pdf.save("diagnostico-sofia-ai.pdf")
    } catch (error) {
      console.error("Error al generar el PDF:", error)
      setError("Error al generar el PDF. Por favor, intente nuevamente.")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!confianza || !resultado || !tipoExamen || !pacienteId || !user?.id_usuario) {
      setError("Faltan campos obligatorios (Diagnóstico, Confianza, Tipo de Examen, ID Paciente).")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const diagnosticoData = {
        id_paciente: Number.parseInt(pacienteId),
        id_medico: user.id_usuario,
        tipoExamenNombre: tipoExamen,
        resultado: resultado,
        nivel_confianza: confianza,
        diagnostico: diagnosisResult,
      }

      // Call API to save diagnosis
      const response = await fetch("/api/dashboard/diagnosticos/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(diagnosticoData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar el diagnóstico")
      }

      alert("Diagnóstico guardado exitosamente")
      // Clear form
      setPacienteId("")
      setResultado("")
      setConfianza(0)
      setTipoExamen("Radiografía")
      setImagePreview(null)
      setImageBase64(null)
      setDiagnosisResult(null)
      setAnalysisComplete(false)
    } catch (err: any) {
      setError(err.message || "Error al guardar el diagnóstico")
      console.error("Error al guardar:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600 mb-4"></div>
            <p className="text-gray-700">Guardando diagnóstico...</p>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Nuevo Diagnóstico</h1>
          <p className="text-gray-500 mt-1">Cargue una imagen médica para análisis por IA</p>
        </div>
        <div className="flex items-center gap-2">
          <img src="/Logo_sofia.png" alt="SOFIA AI" className="h-8" />
          <span className="text-sm text-gray-500 font-medium">Asistente de Diagnóstico</span>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="cargar" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
            <FileImage className="h-4 w-4 mr-2" />
            Cargar Imagen
          </TabsTrigger>
          <TabsTrigger
            value="resultados"
            disabled={!analysisComplete}
            className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700"
          >
            <Stethoscope className="h-4 w-4 mr-2" />
            Resultados
          </TabsTrigger>
        </TabsList>

        {/* Upload Image Tab */}
        <TabsContent value="cargar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column: Image upload */}
            <Card className="border-teal-100 shadow-sm">
              <CardHeader className="bg-teal-50/50 border-b border-teal-100">
                <CardTitle className="flex items-center text-teal-800">
                  <FileImage className="h-5 w-5 mr-2 text-teal-600" />
                  Cargar Imagen Médica
                </CardTitle>
                <CardDescription>Formatos soportados: DICOM, PNG, JPG</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Image upload area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors ${
                    isUploading ? "border-teal-300 bg-teal-50" : "border-gray-300 hover:border-teal-300"
                  }`}
                >
                  {imagePreview ? (
                    // Image preview
                    <div className="w-full flex flex-col items-center">
                      <div className="relative w-full max-h-[300px] overflow-hidden rounded-md mb-4">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Vista previa"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setImagePreview(null)
                          setImageBase64(null)
                        }}
                        className="text-sm"
                      >
                        Eliminar imagen
                      </Button>
                    </div>
                  ) : isUploading ? (
                    // Upload progress
                    <div className="w-full space-y-4 py-6">
                      <div className="flex justify-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600"></div>
                      </div>
                      <Progress value={uploadProgress} className="w-full h-2" />
                      <p className="text-center text-sm text-gray-500">
                        {uploadProgress < 100 ? "Procesando imagen..." : "Procesamiento completado"}
                      </p>
                    </div>
                  ) : (
                    // Drag & drop area
                    <div className="text-center py-8">
                      <Upload className="mx-auto h-12 w-12 text-teal-400" />
                      <p className="mt-4 text-base font-medium text-gray-900">Arrastre y suelte su imagen aquí</p>
                      <p className="mt-1 text-sm text-gray-500">o haga clic para seleccionar un archivo</p>
                      <Input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".dcm,image/dicom,image/png,image/jpeg,image/jpg"
                        onChange={handleFileChange}
                      />
                      <Button
                        variant="outline"
                        className="mt-6 border-teal-200 text-teal-700 hover:bg-teal-50"
                        onClick={() => {
                          document.getElementById("file-upload")?.click()
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar Archivo
                      </Button>
                    </div>
                  )}
                </div>

                {/* Image type selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="imageType" className="text-gray-700">
                      Tipo de Imagen
                    </Label>
                    <Select value={tipoExamen} onValueChange={(value) => setTipoExamen(value)}>
                      <SelectTrigger id="imageType" className="border-gray-300">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Radiografía">Radiografía</SelectItem>
                        <SelectItem value="Tomografía">Tomografía</SelectItem>
                        <SelectItem value="Resonancia">Resonancia Magnética</SelectItem>
                        <SelectItem value="Ecografía">Ecografía</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Anatomical region */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">Región Anatómica</Label>
                    <RadioGroup value={region} onValueChange={setRegion} className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="torax" id="torax" className="text-teal-600" />
                        <Label htmlFor="torax" className="text-sm">
                          Tórax
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="abdomen" id="abdomen" className="text-teal-600" />
                        <Label htmlFor="abdomen" className="text-sm">
                          Abdomen
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="craneo" id="craneo" className="text-teal-600" />
                        <Label htmlFor="craneo" className="text-sm">
                          Cráneo
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="extremidades" id="extremidades" className="text-teal-600" />
                        <Label htmlFor="extremidades" className="text-sm">
                          Extremidades
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t px-6 py-4">
                <Button
                  onClick={handleAnalyze}
                  disabled={!imageBase64 || isUploading}
                  className="ml-auto bg-teal-600 hover:bg-teal-700"
                >
                  Analizar Imagen
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="resultados" className="space-y-6">
          <Card className="border-teal-100 shadow-sm">
            <CardHeader className="bg-teal-50/50 border-b border-teal-100">
              <CardTitle className="flex items-center text-teal-800">
                <Stethoscope className="h-5 w-5 mr-2 text-teal-600" />
                Resultados del Análisis
              </CardTitle>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-sm text-gray-600">Diagnóstico generado por</span>
                <img src="/Logo_sofia.png" alt="SOFIA AI" className="h-6" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {isAnalyzing ? (
                // Analysis in progress indicator
                <div className="flex flex-col items-center justify-center space-y-4 py-16">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600"></div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-700">Analizando imagen médica...</p>
                    <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos segundos</p>
                  </div>
                </div>
              ) : analysisComplete && diagnosisResult ? (
                // Analysis results
                <div className="space-y-8">
                  <Alert className="border-green-100 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800 font-medium">Análisis Completado</AlertTitle>
                    <AlertDescription className="text-green-700">
                      El análisis de la imagen se ha completado con éxito.
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-8 md:grid-cols-2">
                    {/* Image column */}
                    <div>
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-2">
                        <div ref={imageRef} className="rounded overflow-hidden">
                          <img
                            src={imagePreview! || "/placeholder.svg"}
                            alt="Imagen médica analizada"
                            className="w-full object-contain max-h-[400px]"
                          />
                        </div>
                      </div>

                      <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Información del examen</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Tipo:</span>
                            <span className="font-medium">{tipoExamen}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Región:</span>
                            <span className="font-medium capitalize">{region}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Fecha:</span>
                            <span className="font-medium">
                              {(document.getElementById("examDate") as HTMLInputElement)?.value ||
                                new Date().toISOString().split("T")[0]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Confianza:</span>
                            <span className="font-medium">{confianza ? `${Math.round(confianza)}%` : "N/A"}</span> {/* Remove multiplication by 100 */}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Results column */}
                    <div className="space-y-6">
                      {/* Diagnosis section */}
                      {diagnosisResult?.condition && ( // Check for condition existence
                        <div className="bg-white rounded-lg border border-teal-100 overflow-hidden">
                          <div className="bg-teal-50 px-4 py-3 border-b border-teal-100">
                            <h3 className="text-lg font-medium text-teal-800">Diagnóstico</h3>
                          </div>
                          <div className="p-4">
                            <p className="text-2xl font-bold text-teal-700 mb-2">
                              {diagnosisResult.condition ?? "N/A"} {/* Access condition directly */}
                            </p>
                            {/* Note: Gravity is not directly available in OpenRouterImageResponse */}
                            {/* <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 mb-4">
                              Gravedad: {diagnosisResult.diagnostico.gravedad ?? "N/A"}
                            </div> */}

                            {diagnosisResult.description ? ( // Use description for findings
                              <div className="mt-3">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Hallazgos:</h4>
                                <p className="text-sm text-gray-700">{diagnosisResult.description}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 mt-2">No hay hallazgos específicos.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Recommendations section */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <h3 className="text-lg font-medium text-gray-800">Recomendaciones</h3>
                        </div>
                        <div className="p-4">
                          {diagnosisResult?.recomendaciones && diagnosisResult.recomendaciones.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                              {diagnosisResult.recomendaciones.map((rec: string | null, i: number) => (
                                <li key={i} className="flex items-start">
                                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-teal-100 flex items-center justify-center mr-2 mt-0.5">
                                    <span className="text-xs font-medium text-teal-800">{i + 1}</span>
                                  </div>
                                  <span className="text-gray-700">{rec ?? "N/A"}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">No hay recomendaciones específicas.</p>
                          )}
                        </div>
                      </div>

                      {/* Prognosis section */}
                      {diagnosisResult?.pronostico && (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800">Pronóstico</h3>
                          </div>
                          <div className="p-4 grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Tiempo de recuperación</p>
                              <p className="font-medium text-gray-800">
                                {diagnosisResult.pronostico.tiempo_recuperacion ?? "N/A"}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Probabilidad de mejoría</p>
                              <p className="font-medium text-gray-800">
                                {diagnosisResult.pronostico.probabilidad_mejoria ?? "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Patient data and Additional data forms */}
                  <div className="space-y-6">
                    <Card className="border-teal-100 shadow-sm">
                      <CardHeader className="bg-teal-50/50 border-b border-teal-100">
                        <CardTitle className="flex items-center text-teal-800">
                          <User className="h-5 w-5 mr-2 text-teal-600" />
                          Datos del Paciente
                        </CardTitle>
                        <CardDescription>Información del paciente para el diagnóstico</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        {/* Patient search */}
                        <div className="space-y-2 relative">
                          <Label htmlFor="searchPatient" className="text-gray-700">
                            Buscar Paciente
                          </Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="searchPatient"
                              ref={searchInputRef}
                              placeholder="Buscar por ID, nombre o documento..."
                              className="pl-10 border-gray-300"
                              value={searchTerm}
                              onChange={handlePatientSearch}
                              onFocus={() => setShowSearchResults(true)}
                            />
                          </div>

                          {showSearchResults && searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                              {searchResults.map((patient) => (
                                <div
                                  key={patient.id_paciente}
                                  className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-gray-100 last:border-0"
                                  onClick={() => selectPatient(patient)}
                                >
                                  <div className="font-medium text-gray-800">
                                    {patient.nombre} {patient.apellido}
                                  </div>
                                  <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                    <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full text-xs">
                                      ID: {patient.id_paciente}
                                    </span>
                                    <span>Documento: {patient.documento}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {searchLoading && <p className="text-sm text-gray-500 mt-2">Buscando pacientes...</p>}

                          {searchError && <p className="text-sm text-red-500 mt-2">{searchError}</p>}
                        </div>

                        {/* Patient basic info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-gray-700 flex items-center">
                              Nombre
                            </Label>
                            <Input id="firstName" className="border-gray-300" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-gray-700">
                              Apellido
                            </Label>
                            <Input id="lastName" className="border-gray-300" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="age" className="text-gray-700">
                              Edad
                            </Label>
                            <Input id="age" type="number" className="border-gray-300" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="gender" className="text-gray-700">
                              Género
                            </Label>
                            <Select>
                              <SelectTrigger id="gender" className="border-gray-300">
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
                          <Label htmlFor="examDate" className="text-gray-700 flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                            Fecha del Examen
                          </Label>
                          <Input id="examDate" type="date" className="border-gray-300" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="clinicalHistory" className="text-gray-700">
                            Historia Clínica
                          </Label>
                          <Textarea
                            id="clinicalHistory"
                            placeholder="Ingrese antecedentes relevantes del paciente"
                            rows={3}
                            className="border-gray-300 resize-none"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Additional data card */}
                    <Card className="border-teal-100 shadow-sm">
                      <CardHeader className="bg-teal-50/50 border-b border-teal-100 py-3">
                        <CardTitle className="text-sm flex items-center text-teal-800">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-teal-600" />
                            Datos Adicionales
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="telefono" className="text-gray-700 flex items-center text-sm">
                              <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                              Teléfono
                            </Label>
                            <Input id="telefono" placeholder="Ej: +57 300 123 4567" className="border-gray-300" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="direccion" className="text-gray-700 flex items-center text-sm">
                              <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                              Dirección
                            </Label>
                            <Input id="direccion" className="border-gray-300" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="ocupacion" className="text-gray-700 flex items-center text-sm">
                              <Briefcase className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                              Ocupación
                            </Label>
                            <Input id="ocupacion" className="border-gray-300" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="infoSeguro" className="text-gray-700 flex items-center text-sm">
                              <Shield className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                              Seguro Médico
                            </Label>
                            <Input id="infoSeguro" className="border-gray-300" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                // No results available
                <div className="flex flex-col items-center justify-center space-y-4 py-16">
                  <AlertCircle className="h-16 w-16 text-gray-300" />
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-600">No hay resultados disponibles.</p>
                    <p className="text-sm text-gray-500 mt-2">Cargue una imagen y realice el análisis.</p>
                  </div>
                </div>
              )}
            </CardContent>
            {analysisComplete && diagnosisResult && (
              <CardFooter className="flex justify-between bg-gray-50 border-t px-6 py-4">
                <Button variant="outline" onClick={() => setActiveTab("cargar")} className="border-gray-300">
                  Volver
                </Button>
                <div className="flex gap-3">
                  <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                  <Button onClick={handleDownloadReport} className="bg-teal-600 hover:bg-teal-700">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Informe
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
