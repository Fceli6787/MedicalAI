"use client"

import React, { useRef, useState, useEffect } from "react"
import * as dicomParser from 'dicom-parser'
import * as cornerstone from 'cornerstone-core'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Upload, AlertCircle, CheckCircle2, Download, Save } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { analyzeImageWithOpenRouter } from "@/lib/openrouter"
import { generateDiagnosisPDF } from "@/lib/generate-pdf"
import { saveDiagnostico } from "@/lib/utils"
import { addDiagnostico } from "@/lib/db";

export default function NuevoDiagnosticoPage() {
  const [activeTab, setActiveTab] = useState("cargar");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [medicoId, setMedicoId] = useState<string | null>(null);
  const [tipoExamen, setTipoExamen] = useState<string | null>(null);
  const [confianza, setConfianza] = useState<number | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);

  const { user } = useAuth();

  const hasPermissions =
    user?.role === "admin" || user?.role === "medico";

  useEffect(() => {
    if (diagnosisResult?.confidence) {
      setConfianza(diagnosisResult.confidence);
    }
    if (diagnosisResult?.condition) {
      setResultado(diagnosisResult.condition);
    }
  }, [diagnosisResult]);
  const imageRef = useRef<HTMLDivElement>(null)
  const [region, setRegion] = useState("torax")
  const [imageType, setImageType] = useState("Radiografía")

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const isDicom = file.name.toLowerCase().endsWith('.dcm') || 
                     file.type === 'application/dicom'

      if (isDicom) {
        try {
          // Procesar archivo DICOM
          setError(null)
          setUploadProgress(30) // Indica inicio de conversión
          
          const arrayBuffer = await file.arrayBuffer()
          const byteArray = new Uint8Array(arrayBuffer)
          const dataSet = dicomParser.parseDicom(byteArray)
          
          // Configurar cornerstone
          cornerstone.metaData.addProvider((type, imageId) => {
            if (type === 'dicom') return dataSet
            return null
          }, 1000)
          
          // Extraer datos básicos del DICOM
          const width = dataSet.uint16('x00280011') || 512
          const height = dataSet.uint16('x00280010') || 512
          const pixelDataElement = dataSet.elements.x7fe00010
          const pixelData = new Uint8Array(arrayBuffer, pixelDataElement.dataOffset, pixelDataElement.length)
          
          // Crear canvas para conversión
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          
          if (!ctx) throw new Error('No se pudo crear contexto de canvas')
          
          // Convertir datos DICOM a ImageData
          const imageData = ctx.createImageData(width, height)
          for (let i = 0; i < pixelData.length; i++) {
            imageData.data[i] = pixelData[i]
          }
          
          // Aplicar ajuste de ventana/level mejorado para DICOM
          const applyWindowLevel = (data: Uint8ClampedArray) => {
            // Obtener parámetros DICOM (con valores por defecto razonables)
            const windowCenter = dataSet.int16('x00281050') || 50
            const windowWidth = dataSet.int16('x00281051') || 400
            const slope = parseFloat(dataSet.string('x00281053') || '1')
            const intercept = parseFloat(dataSet.string('x00281052') || '0')
            const bitsStored = dataSet.uint16('x00280101') || 16
            const pixelRepresentation = dataSet.uint16('x00280103') || 0 // 0=unsigned, 1=signed
            
            // Calcular rango de valores posibles
            const maxValue = Math.pow(2, bitsStored) - 1
            const minValue = pixelRepresentation === 1 ? -maxValue / 2 : 0
            
            // Aplicar transformación a cada píxel
            for (let i = 0; i < data.length; i += 4) {
              // Aplicar rescale slope/intercept
              let value = (data[i] * slope) + intercept
              
              // Asegurar que el valor esté dentro del rango posible
              value = Math.max(minValue, Math.min(maxValue, value))
              
              // Calcular ventana de visualización
              const windowMin = windowCenter - (windowWidth / 2)
              const windowMax = windowCenter + (windowWidth / 2)
              
              // Normalizar a rango 0-255
              let normalized = 0
              if (value <= windowMin) {
                normalized = 0
              } else if (value >= windowMax) {
                normalized = 255
              } else {
                normalized = Math.round(((value - windowMin) / windowWidth) * 255)
              }
              
              // Asignar a canales RGB (escala de grises)
              data[i] = data[i+1] = data[i+2] = normalized
              data[i+3] = 255 // Alpha
            }
          }
          
          // Verificar si los datos DICOM están comprimidos
          const transferSyntax = dataSet.string('x00020010') || '1.2.840.10008.1.2' // Implicit VR Little Endian
          if (transferSyntax.includes('1.2.840.10008.1.2.4')) {
            throw new Error('Archivos DICOM comprimidos no soportados. Use un archivo sin compresión.')
          }

          applyWindowLevel(imageData.data)
          ctx.putImageData(imageData, 0, 0)
          
          // Obtener PNG como base64
          setUploadProgress(80) // Indica conversión completada
          const pngUrl = canvas.toDataURL('image/png', 0.95) // Calidad 95%
          const pngBase64 = pngUrl.split(',')[1]
          
          setImageBase64(pngBase64)
          setImagePreview(pngUrl)
          setUploadProgress(100)
        } catch (err) {
          console.error('Error procesando DICOM:', err)
          setError('Error al procesar archivo DICOM. Asegúrese que es un archivo válido.')
          setIsUploading(false)
          return
        }
      } else {
        // Procesar imagen normal (PNG/JPG)
        const previewUrl = URL.createObjectURL(file)
        setImagePreview(previewUrl)

        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(",")[1]
          setImageBase64(base64String)
        }
        reader.readAsDataURL(file)
      }

      // Simular progreso de carga
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
      const result = await analyzeImageWithOpenRouter(imageBase64)
      // Transformar la respuesta al formato esperado
      setDiagnosisResult({
        condition: result.condition,
        confidence: result.confidence,
        description: result.description,
        // Proporcionar arrays vacíos por defecto para evitar errores
        areas: [],
        recommendations: []
      })
      setAnalysisComplete(true)
    } catch (err) {
      setError("Error al analizar la imagen. Por favor, intente nuevamente.")
    } finally {
      setIsAnalyzing(false)
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
        examDate: (document.getElementById("examDate") as HTMLInputElement)?.value || new Date().toISOString().split("T")[0],
        clinicalHistory: (document.getElementById("clinicalHistory") as HTMLTextAreaElement)?.value || ""
      },
      diagnosis: {
        condition: diagnosisResult.condition,
        confidence: diagnosisResult.confidence,
        description: diagnosisResult.description
      }
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
    e.preventDefault();
    if (!confianza || !resultado || !tipoExamen || !pacienteId || !medicoId) {
      setError("Todos los campos son obligatorios");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error("Usuario no autenticado");
      }
      const diagnostico = {
        id_paciente: parseInt(pacienteId),
        id_medico: parseInt(user?.id),
        id_tipo_examen: parseInt(tipoExamen),
        resultado,
        nivel_confianza: confianza,
      };

      const response = await addDiagnostico(diagnostico);
      setLoading(false);
      if (response) {
        alert("Diagnóstico guardado exitosamente");
      } else {
        throw new Error("Error al guardar el diagnostico");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al guardar el diagnóstico"
      );
      console.error("Error al guardar:", err);
    } finally {
      setLoading(false);
    }

      /*const response = await fetch('/api/diagnosticos', {
        method: 'POST',*/

      if (!response.ok) {
        throw new Error('Error al guardar el diagnóstico');
      }

      // Mostrar alerta de éxito
      setError(null);
      alert("Diagnóstico guardado exitosamente");
  };

  if (!hasPermissions) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">No tienes permisos para ver esta página</h1>
      </div>
    )
  };

  return (
    <div className="space-y-6">
      {loading && <div>Cargando...</div>}
      {error && <div>Error: {error}</div>}
      {!loading && !error && (
        <div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Nuevo Diagnóstico</h1>
            <p className="text-gray-500">Cargue una imagen médica para análisis por IA</p>

            <TabsContent value="cargar" className="space-y-4">
              <Card className="border-teal-100">
                <CardHeader>
                  <CardTitle>Cargar Imagen Médica</CardTitle>
                  <CardDescription>Formatos soportados: DICOM, PNG, JPG</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition-all hover:border-teal-400">
                    {imagePreview ? (
                      <div className="relative w-full">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Imagen médica"
                          className="mx-auto max-h-[300px] rounded-md object-contain"
                        />
                        {isUploading && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Cargando imagen...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-4 py-4">
                        <div className="rounded-full bg-teal-100 p-3">
                          <Upload className="h-6 w-6 text-teal-600" />
                        </div>
                        <div className="space-y-1 text-center">
                          <p className="text-sm font-medium text-gray-900">Arrastre y suelte su imagen aquí</p>
                          <p className="text-xs text-gray-500">o haga clic para seleccionar un archivo</p>
                        </div>
                        <Button variant="outline" size="sm" className="relative">
                          Seleccionar Archivo
                          <Input
                            type="file"
                            className="absolute inset-0 cursor-pointer opacity-0"
                            accept=".dcm,.png,.jpg,.jpeg"
                            onChange={handleFileChange}
                          />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageType">Tipo de Imagen</Label>
                    <Select defaultValue="radiografia" onValueChange={setImageType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el tipo de imagen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="radiografia">Radiografía</SelectItem>
                        <SelectItem value="resonancia">Resonancia Magnética</SelectItem>
                        <SelectItem value="tomografia">Tomografía Computarizada</SelectItem>
                        <SelectItem value="ecografia">Ecografía</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Región Anatómica</Label>
                    <RadioGroup defaultValue="torax" onValueChange={setRegion}>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="torax" id="torax" />
                          <Label htmlFor="torax">Tórax</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="abdomen" id="abdomen" />
                          <Label htmlFor="abdomen">Abdomen</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="craneo" id="craneo" />
                          <Label htmlFor="craneo">Cráneo</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="extremidades" id="extremidades" />
                          <Label htmlFor="extremidades">Extremidades</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Cancelar</Button>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!imagePreview || isUploading}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {isUploading ? "Cargando..." : "Analizar Imagen"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="resultados" className="space-y-4">
              <Card className="border-teal-100">
                <CardHeader>
                  <CardTitle>Resultados del Análisis</CardTitle>
                  <div className="flex items-center justify-center gap-2">
                    <span>Diagnóstico generado por</span>
                    <img src="/Logo_sofia.png" alt="SOFIA AI" className="h-6" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-12">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600"></div>
                      <p className="text-center text-gray-600">
                        Analizando imagen médica...
                        <br />
                        <span className="text-sm text-gray-500">Esto puede tomar unos segundos</span>
                      </p>
                    </div>
                  ) : analysisComplete && diagnosisResult ? (
                    <div className="space-y-6">
                      <Alert className="border-green-100 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Análisis Completado</AlertTitle>
                        <AlertDescription className="text-green-700">
                          El análisis de la imagen se ha completado con éxito.
                        </AlertDescription>
                      </Alert>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <div ref={imageRef}>
                            <img
                              src={imagePreview! || "/placeholder.svg"}
                              alt="Imagen médica analizada"
                              className="rounded-md border border-gray-200"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Diagnóstico</h3>
                            <p className="text-2xl font-bold text-teal-700">{diagnosisResult.condition}</p>
                            <p className="mt-2 text-gray-600">{diagnosisResult.description}</p>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Nivel de Confianza</h3>
                            <div className="mt-1 flex items-center gap-2">
                              <Progress value={diagnosisResult.confidence} className="h-2" />
                              <span className="text-sm font-medium">{diagnosisResult.confidence}%</span>
                            </div>
                          </div>

                          {diagnosisResult.areas && diagnosisResult.areas.length > 0 && (
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Áreas de Interés</h3>
                              <ul className="mt-1 space-y-1 text-sm">
                                {diagnosisResult.areas.map((area: any, i: number) => (
                                  <li key={i} className="text-gray-700">
                                    • {area.description}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {diagnosisResult.recommendations && diagnosisResult.recommendations.length > 0 && (
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Recomendaciones</h3>
                              <ul className="mt-1 space-y-1 text-sm">
                                {diagnosisResult.recommendations.map((rec: string, i: number) => (
                                  <li key={i} className="text-gray-700">
                                    • {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4 py-12">
                      <AlertCircle className="h-12 w-12 text-gray-300" />
                      <p className="text-center text-gray-500">
                        No hay resultados disponibles.
                        <br />
                        <span className="text-sm">Cargue una imagen y realice el análisis.</span>
                      </p>
                    </div>
                  )}
                </CardContent>
                {analysisComplete && diagnosisResult && (
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab("cargar")}>
                      Volver
                    </Button>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSave}
                            className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700"
                          >
                            <Save className="h-4 w-4" />
                            <span>Guardar</span>
                          </Button>
                          <Button onClick={handleDownloadReport} className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700">
                            <Download className="h-4 w-4" />
                            <span>Descargar Informe</span>
                          </Button>
                        </div>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card className="border-teal-100">
            <CardHeader>
              <CardTitle>Datos del Paciente</CardTitle>
              <CardDescription>Información del paciente para el diagnóstico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientId">ID del Paciente</Label>
                <Input id="patientId" placeholder="Ej: PAC-12345" onChange={(e) => setPacienteId(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/*<div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input id="firstName" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input id="lastName" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Edad</Label>
                  <Input id="age" type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Género</Label>
                  <Select>
                    <SelectTrigger id="gender">
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
                <Label htmlFor="examDate">Fecha del Examen</Label>
                <Input id="examDate" type="date" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicalHistory">Historia Clínica</Label>
                <Textarea id="clinicalHistory" placeholder="Ingrese antecedentes relevantes del paciente" rows={4} />
              </div>*/}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
  );
}
