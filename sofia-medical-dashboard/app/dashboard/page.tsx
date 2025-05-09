"use client"

import { useState, useEffect, useContext } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Activity, Users, Clock, BarChart3, TrendingUp, AlertTriangle, Loader2 } from "lucide-react" // Añadido Loader2
import { AuthContext, type User as AuthUser } from "../../context/AuthContext" // Importar User como AuthUser para evitar colisión

// Interfaz para los datos de diagnóstico que se esperan de la API
// Basada en lo que devuelve getDiagnosticos de lib/db.ts
interface Diagnostico {
  id_diagnostico: number; // Clave principal para la 'key' prop
  nombre_paciente: string | null;
  nombre_medico: string | null;
  nombre_tipo_examen: string | null; 
  resultado: string | null; 
  nivel_confianza: number | null; // Viene como decimal 0-1 de la IA, se multiplica por 100 para mostrar
  fecha_diagnostico: string; // La BD devuelve string para DATETIME
  estado: string | null;
}

// Interfaz para los datos de paciente que se esperan de la API
interface Paciente {
    id_usuario: number; // Asumiendo que este es el ID único
    primer_nombre?: string;
    primer_apellido?: string;
    // Añadir otros campos si son necesarios y vienen de la API /api/dashboard/pacientes
}

// Interfaz para los datos de usuario que se esperan de la API (diferente de AuthUser)
interface AppUser {
    id_usuario: number; // Asumiendo que este es el ID único
    primer_nombre?: string;
    // Añadir otros campos si son necesarios y vienen de la API /api/dashboard/users
}


export default function DashboardPage() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  const { user } = context // Este 'user' es de AuthContext (AuthUser)

  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]) // Usar interfaz Diagnostico
  const [pacientes, setPacientes] = useState<Paciente[]>([]) // Usar interfaz Paciente
  const [usuarios, setUsuarios] = useState<AppUser[]>([])   // Usar interfaz AppUser
  const [loadingDiagnosticos, setLoadingDiagnosticos] = useState(true)
  const [loadingPacientes, setLoadingPacientes] = useState(true)
  const [loadingUsuarios, setLoadingUsuarios] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarDatos = async () => {
      setLoadingDiagnosticos(true)
      setLoadingPacientes(true)
      setLoadingUsuarios(true)
      setError(null); 
      try {
        // Fetching data
        const [usuariosResponse, pacientesResponse, diagnosticosResponse] = await Promise.all([
          fetch("/api/dashboard/users"),
          fetch("/api/dashboard/pacientes"),
          fetch("/api/dashboard/diagnosticos"), // Este endpoint llama a getDiagnosticos
        ]);

        // Procesar usuarios
        if (!usuariosResponse.ok) throw new Error(`Error al cargar usuarios: ${usuariosResponse.statusText} (${usuariosResponse.status})`);
        const usuariosData = await usuariosResponse.json();
        setUsuarios(Array.isArray(usuariosData) ? usuariosData : usuariosData.users || []);

        // Procesar pacientes
        if (!pacientesResponse.ok) throw new Error(`Error al cargar pacientes: ${pacientesResponse.statusText} (${pacientesResponse.status})`);
        const pacientesData = await pacientesResponse.json();
        setPacientes(pacientesData.pacientes || []); // /api/dashboard/pacientes devuelve { pacientes: [...] }

        // Procesar diagnósticos
        if (!diagnosticosResponse.ok) throw new Error(`Error al cargar diagnósticos: ${diagnosticosResponse.statusText} (${diagnosticosResponse.status})`);
        const diagnosticosData = await diagnosticosResponse.json();
        // /api/diagnosticos devuelve un array directamente
        setDiagnosticos(Array.isArray(diagnosticosData) ? diagnosticosData : []); 

      } catch (error: any) {
        console.error("Error cargando datos del dashboard:", error);
        setError(error.message || "Error al cargar los datos del dashboard.");
      } finally {
        setLoadingDiagnosticos(false);
        setLoadingPacientes(false);
        setLoadingUsuarios(false);
      }
    }

    if (user) { // Solo cargar datos si el usuario está autenticado
        cargarDatos();
    } else { 
        setLoadingDiagnosticos(false);
        setLoadingPacientes(false);
        setLoadingUsuarios(false);
        // Opcional: podrías setear un error o mensaje si el usuario no está autenticado y no debería estar aquí
    }
  }, [user]); // Dependencia en 'user' para recargar si cambia el usuario

  if (!user && !loadingDiagnosticos && !loadingPacientes && !loadingUsuarios) { // Mostrar mensaje si la carga terminó y no hay usuario
    return (
      <div className="flex items-center justify-center h-screen p-6 text-center">
        <div>
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-700 text-xl">Debe iniciar sesión para ver el dashboard.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-6 text-center">
         <div>
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-xl">{error}</p>
        </div>
      </div>
    );
  }

  const precisionPromedio = 92.5;

  // Tomar solo los últimos 5 diagnósticos para la lista "Recientes"
  // Ordenar por fecha_diagnostico descendente antes de tomar los últimos 5
  const diagnosticosRecientes = [...diagnosticos]
    .sort((a, b) => new Date(b.fecha_diagnostico).getTime() - new Date(a.fecha_diagnostico).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 w-full px-4 sm:px-6 py-8 overflow-x-hidden">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-800">Dashboard Principal</h1>
            <p className="text-gray-600 mt-1">Bienvenido de nuevo, {user?.primer_nombre || "Usuario"}.</p>
        </div>
        <div className="flex items-center gap-2">
          <img src="/Logo_sofia.png" alt="SOFIA AI Logo" className="h-9" />
          <span className="text-sm text-gray-500 font-medium">SOFIA AI Medical</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Diagnósticos Totales",
            value: loadingDiagnosticos ? <Loader2 className="h-5 w-5 animate-spin" /> : (Array.isArray(diagnosticos) ? diagnosticos.length.toLocaleString() : "0"),
            icon: <Activity className="h-5 w-5 text-teal-600" />,
            description: "Total acumulado en el sistema",
          },
          {
            title: "Pacientes Registrados",
            value: loadingPacientes ? <Loader2 className="h-5 w-5 animate-spin" /> : Array.isArray(pacientes) ? pacientes.length.toLocaleString() : "0",
            icon: <Users className="h-5 w-5 text-teal-600" />,
            description: "Pacientes únicos activos",
          },
          {
            title: "Tiempo Promedio Diag.",
            value: loadingDiagnosticos ? <Loader2 className="h-5 w-5 animate-spin" /> : "2.4s",
            icon: <Clock className="h-5 w-5 text-teal-600" />,
            description: "Estimado por análisis IA",
          },
          {
            title: "Precisión IA (Simulada)",
            value: loadingDiagnosticos ? <Loader2 className="h-5 w-5 animate-spin" /> : `${precisionPromedio}%`,
            icon: <BarChart3 className="h-5 w-5 text-teal-600" />,
            description: "Basada en modelos de prueba",
          },
        ].map((metric, idx) => (
          <Card key={idx} className="border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700">{metric.title}</CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-3xl font-bold text-gray-900">{metric.value}</div>
              <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recientes" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="recientes"
            className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium"
          >
            Diagnósticos Recientes
          </TabsTrigger>
          <TabsTrigger
            value="estadisticas"
            className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium"
          >
            Estadísticas (Próximamente)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recientes" className="space-y-4">
          <Card className="border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b">
              <CardTitle className="text-lg font-semibold text-gray-800">Últimos Diagnósticos</CardTitle>
              <CardDescription className="text-sm text-gray-500">Los 5 diagnósticos más recientes.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {loadingDiagnosticos ? (
                  <div className="h-40 flex items-center justify-center text-gray-500">
                     <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando diagnósticos...
                  </div>
                ) : diagnosticosRecientes.length > 0 ? (
                  diagnosticosRecientes.map((diag) => ( 
                    <div
                      // *** CORRECCIÓN: Usar diag.id_diagnostico como key ***
                      key={diag.id_diagnostico} 
                      className="flex items-center gap-4 p-3 sm:p-4 border-b last:border-b-0 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-md bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-5 w-5 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* *** CORRECCIÓN: Usar propiedades correctas de la interfaz Diagnostico *** */}
                        <div className="font-medium text-sm text-gray-800 truncate">
                          Paciente: {diag.nombre_paciente || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {diag.nombre_tipo_examen || "Examen no especificado"} - {diag.resultado || "Resultado pendiente"}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2"> {/* ml-2 para un poco de espacio */}
                        <div className={`text-sm font-semibold ${
                            diag.nivel_confianza && diag.nivel_confianza >= 0.8 ? 'text-green-600' : 
                            diag.nivel_confianza && diag.nivel_confianza >=0.5 ? 'text-yellow-600' : 
                            diag.nivel_confianza !== null ? 'text-red-600' : 'text-gray-500' // Gris si es null
                        }`}>
                            {diag.nivel_confianza !== null ? `${(diag.nivel_confianza * 100).toFixed(0)}%` : "N/A"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(diag.fecha_diagnostico).toLocaleDateString('es-CO', {day: '2-digit', month: 'short', year: 'numeric'})}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-500">
                    No hay diagnósticos recientes para mostrar.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-4">
          <Card className="border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b">
              <CardTitle className="text-lg font-semibold text-gray-800">Estadísticas de Uso</CardTitle>
              <CardDescription className="text-sm text-gray-500">Análisis de uso del sistema (Próximamente).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full rounded-md border border-dashed border-gray-300 bg-gray-100 flex items-center justify-center my-6">
                <p className="text-gray-500">Gráfico de estadísticas (Próximamente)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
