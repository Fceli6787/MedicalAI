"use client"

import { useState, useEffect, useContext, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Activity, Users, Clock, BarChart3, TrendingUp, AlertTriangle, Loader2, PieChartIcon } from "lucide-react"
import { AuthContext } from "../../context/AuthContext"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent
} from "@/components/ui/chart"
import {
    Bar,
    BarChart,
    Pie,
    PieChart as RechartsPieChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Cell
} from "recharts"
import dayjs from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');

// Interfaz para los datos de diagnóstico
interface Diagnostico {
  id_diagnostico: number;
  nombre_paciente: string | null;
  nombre_medico: string | null;
  nombre_tipo_examen: string | null;
  resultado: string | null;
  nivel_confianza: number | null;
  fecha_diagnostico: string;
  estado: string | null;
}

// Interfaz para los datos de paciente
interface Paciente {
  id_usuario: number;
  primer_nombre?: string;
  primer_apellido?: string;
  fecha_registro_usuario?: string;
  genero?: string; // Añadido el campo genero
}

// Tipos para los datos de los gráficos
type DiagnosticosPorTipoData = { name: string; total: number; fill: string }[];
type DiagnosticosPorEstadoData = { name: string; value: number; fill: string }[];
type DiagnosticosPorResultadoData = { name: string; value: number; fill: string }[];
type PacientesPorGeneroData = { name: string; value: number; fill: string }[]; // Nuevo tipo para el gráfico de género

// Paleta de Colores Actualizada
const CHART_COLORS = {
  TIPO_EXAMEN: [
    "hsl(170, 70%, 45%)", // Teal
    "hsl(200, 80%, 55%)", // Azul
    "hsl(340, 80%, 60%)", // Magenta/Rosa
    "hsl(40, 90%, 60%)",  // Naranja
    "hsl(260, 70%, 65%)", // Púrpura
    "hsl(120, 60%, 40%)", // Verde oscuro
    "hsl(30, 70%, 50%)",  // Marrón claro
  ],
  ESTADO: {
    Completado: "hsl(140, 60%, 45%)", // Verde
    Pendiente: "hsl(45, 90%, 55%)",  // Amarillo/Naranja
    Anulado: "hsl(0, 70%, 55%)",     // Rojo
    Default: "hsl(220, 10%, 60%)"    // Gris para Desconocido/Default
  },
  RESULTADO_DIAGNOSTICO: [
    "hsl(220, 75%, 60%)", // Azul oscuro
    "hsl(150, 65%, 50%)", // Verde mar
    "hsl(30, 85%, 55%)",  // Naranja oscuro
    "hsl(300, 70%, 60%)", // Púrpura brillante
    "hsl(60, 80%, 50%)",  // Amarillo vivo
    "hsl(0, 75%, 65%)",   // Rojo coral
    "hsl(180, 60%, 40%)", // Cian oscuro
    "hsl(270, 70%, 70%)", // Lavanda
    "hsl(90, 55%, 50%)",  // Verde lima
    "hsl(330, 70%, 65%)", // Rosa fuerte
  ],
};

export default function DashboardPage() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  const { user } = context

  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([])
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pacientesResponse, diagnosticosResponse] = await Promise.all([
          fetch("/api/dashboard/pacientes"),
          fetch("/api/dashboard/diagnosticos"),
        ]);

        if (!pacientesResponse.ok) throw new Error(`Error al cargar pacientes: ${pacientesResponse.statusText} (${pacientesResponse.status})`);
        const pacientesData = await pacientesResponse.json();
        setPacientes((pacientesData.pacientes || []).map((p: any) => ({
            ...p,
            fecha_registro_usuario: p.fecha_registro_usuario || p.fecha_registro
        })));

        if (!diagnosticosResponse.ok) throw new Error(`Error al cargar diagnósticos: ${diagnosticosResponse.statusText} (${diagnosticosResponse.status})`);
        const diagnosticosData = await diagnosticosResponse.json();
        setDiagnosticos(Array.isArray(diagnosticosData) ? diagnosticosData : []);

      } catch (error: any) {
        console.error("Error cargando datos del dashboard:", error);
        setError(error.message || "Error al cargar los datos del dashboard.");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
        cargarDatos();
    } else {
        setLoading(false);
    }
  }, [user]);

  // Procesamiento de datos para gráficos
  const diagnosticosPorTipo: DiagnosticosPorTipoData = useMemo(() => {
    if (loading || !diagnosticos.length) return [];
    const counts: { [key: string]: number } = {};
    diagnosticos.forEach(diag => {
      const tipo = diag.nombre_tipo_examen || "Desconocido";
      counts[tipo] = (counts[tipo] || 0) + 1;
    });
    return Object.entries(counts).map(([name, total], index) => ({
      name,
      total,
      fill: CHART_COLORS.TIPO_EXAMEN[index % CHART_COLORS.TIPO_EXAMEN.length],
    })).sort((a, b) => b.total - a.total);
  }, [diagnosticos, loading]);

  const diagnosticosPorEstado: DiagnosticosPorEstadoData = useMemo(() => {
    if (loading || !diagnosticos.length) return [];
    const counts: { [key: string]: number } = {};
    diagnosticos.forEach(diag => {
      const estado = diag.estado || "Desconocido";
      counts[estado] = (counts[estado] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: CHART_COLORS.ESTADO[name as keyof typeof CHART_COLORS.ESTADO] || CHART_COLORS.ESTADO.Default,
    }));
  }, [diagnosticos, loading]);

  // Nuevo procesamiento de datos para pacientes por género
  const pacientesPorGenero: PacientesPorGeneroData = useMemo(() => {
    if (loading || !pacientes.length) return [];
    const counts: { [key: string]: number } = {};
    pacientes.forEach(paciente => {
      let generoNormalizado = "Desconocido";
      if (paciente.genero) {
        const generoLower = paciente.genero.toLowerCase();
        if (generoLower === "masculino" || generoLower === "m") {
          generoNormalizado = "Masculino";
        } else if (generoLower === "femenino" || generoLower === "f") {
          generoNormalizado = "Femenino";
        } else {
          generoNormalizado = "Otro";
        }
      }
      counts[generoNormalizado] = (counts[generoNormalizado] || 0) + 1;
    });
    // Asignar colores de forma consistente
    const genderColors: { [key: string]: string } = {
      Masculino: "hsl(200, 80%, 55%)", // Azul
      Femenino: "hsl(340, 80%, 60%)",  // Magenta/Rosa
      Otro: "hsl(40, 90%, 60%)",       // Naranja (un color diferente para 'Otro')
      Desconocido: "hsl(220, 10%, 60%)" // Gris
    };
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: genderColors[name] || genderColors.Desconocido,
    }));
  }, [pacientes, loading]);

  const diagnosticosPorResultado: DiagnosticosPorResultadoData = useMemo(() => {
    if (loading || !diagnosticos.length) return [];
    const counts: { [key: string]: number } = {};
    diagnosticos.forEach(diag => {
      const resultado = diag.resultado || "No especificado";
      counts[resultado] = (counts[resultado] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      fill: CHART_COLORS.RESULTADO_DIAGNOSTICO[index % CHART_COLORS.RESULTADO_DIAGNOSTICO.length],
    })).sort((a,b) => b.value - a.value);
  }, [diagnosticos, loading]);

  if (!user && !loading) {
    return (
      <div className="flex items-center justify-center h-screen p-6 text-center">
        <div>
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-700 text-xl">Debe iniciar sesión para ver el dashboard.</p>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="flex items-center justify-center h-screen p-6 text-center">
        <div>
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-xl">{error}</p>
        </div>
      </div>
    );
  }

  const isLoadingMetrics = loading && (!diagnosticos.length || !pacientes.length);

  const precisionPromedio = useMemo(() => {
    if (!diagnosticos.length) return 0;
    const confianzas = diagnosticos
      .map(d => {
        const valor = d.nivel_confianza;
        if (valor === null) return null;
        return Math.min(Math.max(valor, 0), 1);
      })
      .filter((n): n is number => n !== null);
    if (!confianzas.length) return 0;
    const promedio = confianzas.reduce((a, b) => a + b, 0) / confianzas.length;
    const porcentaje = Math.min(promedio * 100, 100);
    return Number(porcentaje.toFixed(2));
  }, [diagnosticos]);

  const diagnosticosRecientes = [...diagnosticos]
    .sort((a, b) => dayjs(b.fecha_diagnostico).valueOf() - dayjs(a.fecha_diagnostico).valueOf())
    .slice(0, 5);

  return (
    <div className="space-y-6 w-full px-4 sm:px-6 py-8 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-800 dark:text-white">Dashboard Principal</h1>
            <p className="text-gray-600 dark:text-white mt-1">Bienvenido de nuevo, {user?.primer_nombre || "Usuario"}.</p>
        </div>
        <div className="flex items-center gap-2">
            <img src="/Logo_sofia.png" alt="Logo de SOFIA AI" className="h-9" />
            <span className="text-sm text-gray-500 font-medium">SOFIA AI Medical</span>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Diagnósticos Totales", value: isLoadingMetrics ? <Loader2 className="h-5 w-5 animate-spin" /> : (diagnosticos.length.toLocaleString()), icon: <Activity className="h-5 w-5 text-teal-600" />, description: "Total acumulado en el sistema" },
          { title: "Pacientes Registrados", value: isLoadingMetrics ? <Loader2 className="h-5 w-5 animate-spin" /> : pacientes.length.toLocaleString(), icon: <Users className="h-5 w-5 text-teal-600" />, description: "Pacientes únicos activos" },
          { title: "Tiempo Promedio Diag.", value: isLoadingMetrics ? <Loader2 className="h-5 w-5 animate-spin" /> : "2.4s", icon: <Clock className="h-5 w-5 text-teal-600" />, description: "Estimado por análisis IA" },
          { title: "Precisión IA (promedio)", value: isLoadingMetrics ? <Loader2 className="h-5 w-5 animate-spin" /> : `${precisionPromedio}%`, icon: <BarChart3 className="h-5 w-5 text-teal-600" />, description: "Promedio de confianza en diagnósticos" },
        ].map((metric, idx) => (
          <Card key={idx} className="border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-white">{metric.title}</CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{metric.value}</div>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="recientes" className="space-y-4">
        <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <TabsTrigger value="recientes" className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white dark:text-gray-400">
            Diagnósticos Recientes
          </TabsTrigger>
          <TabsTrigger value="estadisticas" className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white dark:text-gray-400">
            Estadísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recientes" className="space-y-4">
          <Card className="border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b dark:border-gray-700">
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Últimos Diagnósticos</CardTitle>
              <CardDescription className="text-sm text-gray-500 dark:text-gray-300">Los 5 diagnósticos más recientes.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {loading ? (
                  <div className="h-40 flex items-center justify-center text-gray-500 dark:text-gray-300">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando diagnósticos...
                  </div>
                ) : diagnosticosRecientes.length > 0 ? (
                  diagnosticosRecientes.map((diag) => (
                    <div key={diag.id_diagnostico} className="flex items-center gap-4 p-3 sm:p-4 border-b last:border-b-0 hover:bg-gray-50/50 transition-colors dark:border-gray-700 dark:hover:bg-gray-700/50">
                      <div className="h-10 w-10 rounded-md bg-teal-100 dark:bg-teal-800 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-800 dark:text-white truncate">
                          Paciente: {diag.nombre_paciente || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-300 truncate">
                          {diag.nombre_tipo_examen || "Examen no especificado"} - {diag.resultado || "Resultado pendiente"}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className={`text-sm font-semibold ${ diag.nivel_confianza && diag.nivel_confianza >= 0.8 ? 'text-green-600 dark:text-green-400' : diag.nivel_confianza && diag.nivel_confianza >=0.5 ? 'text-yellow-600 dark:text-yellow-400' : diag.nivel_confianza !== null ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-300' }`}>
                            {diag.nivel_confianza !== null ? `${(diag.nivel_confianza * 100).toFixed(0)}%` : "N/A"}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                            {dayjs(diag.fecha_diagnostico).format('DD MMM YY')}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-500 dark:text-gray-300">
                    No hay diagnósticos recientes para mostrar.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-6">
            {loading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Card><CardHeader><CardTitle>Diagnósticos por Tipo</CardTitle></CardHeader><CardContent className="h-[350px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></CardContent></Card>
                   <Card><CardHeader><CardTitle>Pacientes por Género</CardTitle></CardHeader><CardContent className="h-[300px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></CardContent></Card>
                   <Card className="md:col-span-2"><CardHeader><CardTitle>Resultados de Diagnósticos</CardTitle></CardHeader><CardContent className="h-[300px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></CardContent></Card>
                 </div>
            ) : error ? (
                 <Card className="border-red-200 bg-red-50">
                     <CardHeader><CardTitle className="text-red-700">Error al cargar estadísticas</CardTitle></CardHeader>
                     <CardContent><p className="text-red-600">{error}</p></CardContent>
                 </Card>
            ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Gráfico 1: Diagnósticos por Tipo de Examen (Barras Verticales) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-teal-600" />
                                Diagnósticos por Tipo de Examen
                            </CardTitle>
                            <CardDescription>Distribución de diagnósticos según el tipo de examen realizado.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {diagnosticosPorTipo.length > 0 ? (
                                <ChartContainer config={{}} className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={diagnosticosPorTipo} margin={{ top: 5, right: 20, left: 5, bottom: 100 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                type="category"
                                                interval={0}
                                                angle={-60}
                                                textAnchor="end"
                                                tick={{ fontSize: 10 }}
                                                height={90}
                                            />
                                            <YAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                            <ChartTooltip
                                                cursor={{ fill: 'hsl(var(--muted) / 0.3)'}}
                                                content={<ChartTooltipContent hideLabel />}
                                            />
                                            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                                {diagnosticosPorTipo.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            ) : <p className="text-sm text-gray-500 text-center py-10">No hay datos suficientes para este gráfico.</p>}
                        </CardContent>
                    </Card>

                    {/* Gráfico 2: Pacientes por Género (PieChart) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-teal-600" />
                                Pacientes por Género
                            </CardTitle>
                            <CardDescription>Distribución de pacientes según su género.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pacientesPorGenero.length > 0 ? (
                                <ChartContainer config={{}} className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                            <Pie data={pacientesPorGenero} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent, value }) => `${name} (${value}) ${(percent * 100).toFixed(0)}%`}
                                                style={{ fontSize: '10px' }}
                                            >
                                                {pacientesPorGenero.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            ) : <p className="text-sm text-gray-500 text-center py-10">No hay datos suficientes para este gráfico.</p>}
                        </CardContent>
                    </Card>

                    {/* Gráfico 3: Resultados de Diagnósticos (PieChart) */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-teal-600" />
                                Resultados de Diagnósticos
                            </CardTitle>
                            <CardDescription>Distribución de los diferentes resultados de diagnósticos emitidos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {diagnosticosPorResultado.length > 0 ? (
                                <ChartContainer config={{}} className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                            <Pie data={diagnosticosPorResultado} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent, value }) => `${(percent * 100).toFixed(0)}%`}
                                                style={{ fontSize: '10px' }}
                                            >
                                                {diagnosticosPorResultado.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            ) : <p className="text-sm text-gray-500 text-center py-10">No hay datos suficientes para este gráfico.</p>}
                        </CardContent>
                    </Card>
                 </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
