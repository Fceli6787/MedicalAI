import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Users, Clock, BarChart3, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Bienvenido a SOFIA AI Medical</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-teal-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Diagnósticos Totales</CardTitle>
            <Activity className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">1,248</div>
            <p className="text-xs text-green-600">+12% respecto al mes anterior</p>
          </CardContent>
        </Card>

        <Card className="border-teal-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pacientes Registrados</CardTitle>
            <Users className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">843</div>
            <p className="text-xs text-green-600">+5% respecto al mes anterior</p>
          </CardContent>
        </Card>

        <Card className="border-teal-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">2.4s</div>
            <p className="text-xs text-green-600">-0.3s respecto al mes anterior</p>
          </CardContent>
        </Card>

        <Card className="border-teal-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Precisión</CardTitle>
            <BarChart3 className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">94.8%</div>
            <p className="text-xs text-green-600">+1.2% respecto al mes anterior</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recientes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recientes">Diagnósticos Recientes</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="recientes" className="space-y-4">
          <Card className="border-teal-100">
            <CardHeader>
              <CardTitle>Diagnósticos Recientes</CardTitle>
              <CardDescription>Los últimos 5 diagnósticos realizados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg border border-gray-200 p-3">
                    <div className="h-10 w-10 rounded-md bg-teal-100 p-2">
                      <TrendingUp className="h-6 w-6 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Paciente #{Math.floor(Math.random() * 1000)}</div>
                      <div className="text-sm text-gray-500">
                        {
                          ["Radiografía Torácica", "Resonancia Magnética", "Tomografía", "Ecografía"][
                            Math.floor(Math.random() * 4)
                          ]
                        }
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-teal-600">{Math.floor(Math.random() * 30) + 70}% confianza</div>
                      <div className="text-sm text-gray-500">Hace {Math.floor(Math.random() * 24)} horas</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-4">
          <Card className="border-teal-100">
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
