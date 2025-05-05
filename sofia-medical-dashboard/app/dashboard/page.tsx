"use client"

import { useState, useEffect, useContext } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Activity, Users, Clock, BarChart3, TrendingUp, AlertTriangle } from "lucide-react"
import { AuthContext } from "../../context/AuthContext"

export default function DashboardPage() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  const { user } = context
  const [diagnosticos, setDiagnosticos] = useState<any[]>([])
  const [pacientes, setPacientes] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loadingDiagnosticos, setLoadingDiagnosticos] = useState(true)
  const [loadingPacientes, setLoadingPacientes] = useState(true)
  const [loadingUsuarios, setLoadingUsuarios] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarDatos = async () => {
      setLoadingDiagnosticos(true)
      setLoadingPacientes(true)
      setLoadingUsuarios(true)
      try {
        const [usuariosData, pacientesData, diagnosticosData] = await Promise.all([
          fetch("/api/dashboard/users").then((res) => res.json()),
          fetch("/api/dashboard/pacientes").then((res) => res.json()),
          fetch("/api/dashboard/diagnosticos").then((res) => res.json()),
        ])
        setUsuarios(usuariosData)
        setPacientes(pacientesData)
        setDiagnosticos(diagnosticosData)
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error)
        setError("Error al cargar los datos")
      } finally {
        setLoadingDiagnosticos(false)
        setLoadingPacientes(false)
        setLoadingUsuarios(false)
      }
    }
    cargarDatos()
  }, [])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <AlertTriangle className="h-10 w-10 text-red-500 mr-2" />
        <p className="text-red-500 text-xl">No tienes permiso para ver esta pagina</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <AlertTriangle className="h-10 w-10 text-red-500 mr-2" />
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    )
  }

  const precisionPromedio = 85 // Example percentage, you can modify it

  // Amount to shift children left relative to container
  const shiftClass = "transform -translate-x-24"
  const recentDiagShiftClass = "transform -translate-x-4"

  return (
    <div className="space-y-6 w-full px-6 py-8 overflow-x-hidden">
      {/* Title section shifted left */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p>Bienvenido {user?.primer_nombre}</p>
        <div className="flex items-center gap-2">
          <img src="Logo_sofia.png" alt="SOFIA AI" className="h-8" />
          <span className="text-gray-500">Medical</span>
        </div>
      </div>

      {/* Metric cards shifted left */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Diagnósticos Totales",
            value: loadingDiagnosticos ? "..." : diagnosticos.length.toLocaleString(),
            icon: <Activity className="h-4 w-4 text-teal-600" />,
            description: "Total acumulado",
          },
          {
            title: "Pacientes Registrados",
            value: loadingPacientes ? "..." : Array.isArray(pacientes) ? pacientes.length.toLocaleString() : "0",
            icon: <Users className="h-4 w-4 text-teal-600" />,
            description: "Pacientes únicos",
          },
          {
            title: "Tiempo Promedio",
            value: loadingPacientes ? "..." : "2.4s",
            icon: <Clock className="h-4 w-4 text-teal-600" />,
            description: "Tiempo estimado",
          },
          {
            title: "Precisión",
            value: loadingPacientes ? "..." : `${precisionPromedio}%`,
            icon: <BarChart3 className="h-4 w-4 text-teal-600" />,
            description: "Precisión promedio",
          },
        ].map((metric, idx) => (
          <Card key={idx} className="border-teal-100 rounded-lg shadow-sm pl-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{metric.title}</CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              <p className="text-xs text-gray-500">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs shifted left */}
      <Tabs defaultValue="recientes" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger
            value="recientes"
            className="px-4 py-2 rounded-md hover:bg-gray-100 transition-colors duration-150"
          >
            Diagnósticos Recientes
          </TabsTrigger>
          <TabsTrigger
            value="estadisticas"
            className="px-4 py-2 rounded-md hover:bg-gray-100 transition-colors duration-150"
          >
            Estadísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recientes" className="space-y-4">
          <Card className="border-teal-100 rounded-lg shadow-sm pl-4">
            <CardHeader>
              <CardTitle>Diagnósticos Recientes</CardTitle>
              <CardDescription>Los últimos 5 diagnósticos realizados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingDiagnosticos ? (
                  <div className="h-24 flex items-center justify-center">
                    <p className="text-gray-500">Cargando diagnósticos...</p>
                  </div>
                ) : diagnosticos.length > 0 ? (
                  diagnosticos.map((diag) => (
                    <div
                      key={diag.id}
                      className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="h-10 w-10 rounded-md bg-teal-100 p-2">
                        <TrendingUp className="h-6 w-6 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{diag.pacienteNombre}</div>
                        <div className="text-sm text-gray-500 truncate">
                          {diag.tipo} - {diag.region}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-teal-600">{diag.confianza}% confianza</div>
                        <div className="text-sm text-gray-500">
                          {new Date(diag.fecha_diagnostico).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-24 flex items-center justify-center">
                    <p className="text-gray-500">No hay diagnósticos recientes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-4">
          <Card className="border-teal-100 rounded-lg shadow-sm pl-4">
            <CardHeader>
              <CardTitle>Estadísticas de Uso</CardTitle>
              <CardDescription>Análisis de uso del sistema en los últimos 30 días</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full rounded-md border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Gráfico de estadísticas de uso (simulado)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
