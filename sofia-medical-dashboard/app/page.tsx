import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export default function Home() {
  // Redireccionar a login si no hay sesión (simulado)
  const isAuthenticated = false

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white p-4">
        <div className="w-full max-w-5xl space-y-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="relative h-24 w-24">
              <Image
                src="/placeholder.svg?height=96&width=96"
                alt="SOFIA AI Medical Logo"
                width={96}
                height={96}
                className="rounded-xl bg-teal-500 p-2"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-teal-800 sm:text-5xl">SOFIA AI Medical</h1>
            <p className="max-w-2xl text-lg text-gray-600">
              Sistema de diagnóstico médico asistido por inteligencia artificial
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="border-teal-100 shadow-md transition-all hover:shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-teal-700">Diagnóstico Preciso</CardTitle>
                <CardDescription>Análisis avanzado de imágenes médicas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Nuestra IA analiza imágenes médicas con alta precisión, identificando patrones y anomalías que podrían
                  pasar desapercibidas.
                </p>
              </CardContent>
            </Card>

            <Card className="border-teal-100 shadow-md transition-all hover:shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-teal-700">Resultados Rápidos</CardTitle>
                <CardDescription>Diagnósticos en segundos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Obtenga resultados en tiempo real, permitiendo decisiones médicas más rápidas y eficientes para sus
                  pacientes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-teal-100 shadow-md transition-all hover:shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-teal-700">Historial Completo</CardTitle>
                <CardDescription>Seguimiento de diagnósticos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Mantenga un registro detallado de todos los diagnósticos realizados, facilitando el seguimiento y la
                  comparación.
                </p>
              </CardContent>
            </Card>

            <Card className="border-teal-100 shadow-md transition-all hover:shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-teal-700">Interfaz Intuitiva</CardTitle>
                <CardDescription>Diseñada para profesionales médicos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Una interfaz fácil de usar que se integra perfectamente en su flujo de trabajo clínico diario.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col items-center space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0">
            <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700">
              <a href="/login">Iniciar Sesión</a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-teal-600 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
            >
              <a href="/register">Registrarse</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return redirect("/dashboard")
}
