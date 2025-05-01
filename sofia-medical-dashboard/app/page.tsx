import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export default function Home() {
  // Redireccionar a login si no hay sesión (simulado)
  const isAuthenticated = false

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-teal-50 to-white">
        {/* Header */}
        <header className="sticky top-0 z-10 w-full bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="relative h-10 w-10">
                <Image
                  src="/Logo_sofia.png"
                  alt="SOFIA AI Medical Logo"
                  width={40}
                  height={40}
                />
              </div>
              <span className="text-xl font-bold text-teal-800">SOFIA AI Medical</span>
            </div>
            <nav className="hidden md:block">
              <ul className="flex space-x-6">
                <li><a href="#caracteristicas" className="text-gray-600 hover:text-teal-700">Características</a></li>
                <li><a href="#beneficios" className="text-gray-600 hover:text-teal-700">Beneficios</a></li>
                <li><a href="#contacto" className="text-gray-600 hover:text-teal-700">Contacto</a></li>
              </ul>
            </nav>
            <div className="flex space-x-3">
              <Button asChild variant="outline" size="sm" className="border-teal-600 text-teal-600 hover:bg-teal-50 hover:text-teal-700">
                <a href="/login">Iniciar Sesión</a>
              </Button>
              <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700">
                <a href="/register">Registrarse</a>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="relative h-24 w-24">
                <Image
                  src="/Logo_sofia.png"
                  alt="SOFIA AI Medical Logo"
                  width={96}
                  height={96}
                />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-teal-800 sm:text-5xl md:text-6xl">
                SOFIA AI Medical
              </h1>
              <p className="max-w-2xl text-lg text-gray-600 md:text-xl">
                Sistema de diagnóstico médico asistido por inteligencia artificial
              </p>
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700">
                  <a href="/register">Comenzar ahora</a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-teal-600 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                >
                  <a href="#caracteristicas">Conocer más</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="caracteristicas" className="py-16 bg-teal-50/50">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-teal-800">Características principales</h2>
              <p className="mt-3 text-gray-600">Descubra por qué SOFIA AI Medical es la solución ideal para profesionales médicos</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="py-16">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-teal-800">Beneficios para su práctica médica</h2>
              <p className="mt-3 text-gray-600">SOFIA AI Medical mejora la eficiencia y precisión de su trabajo</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-teal-100 p-4">
                  {/* Ícono aquí (puedes usar un SVG o una imagen) */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-teal-700">Ahorro de tiempo</h3>
                <p className="mt-2 text-gray-600">
                  Reduzca el tiempo dedicado al análisis de imágenes y aumente la productividad de su consulta médica.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-teal-100 p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-teal-700">Mayor precisión</h3>
                <p className="mt-2 text-gray-600">
                  Reduzca errores diagnósticos con el apoyo de algoritmos de inteligencia artificial avanzados.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-teal-100 p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-teal-700">Datos organizados</h3>
                <p className="mt-2 text-gray-600">
                  Mantenga todos los historiales médicos y diagnósticos perfectamente organizados y accesibles.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-teal-600">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center space-y-6 text-center">
              <h2 className="text-3xl font-bold text-white">¿Listo para transformar su práctica médica?</h2>
              <p className="max-w-2xl text-lg text-teal-50">
                Únase a miles de profesionales médicos que ya utilizan SOFIA AI Medical para mejorar sus diagnósticos.
              </p>
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Button asChild size="lg" className="bg-white text-teal-700 hover:bg-teal-50">
                  <a href="/register">Registrarse ahora</a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-teal-700"
                >
                  <a href="/login">Iniciar sesión</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="contacto" className="bg-teal-800 py-12 text-teal-100">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <div className="flex items-center space-x-3">
                  <div className="relative h-10 w-10">
                    <Image
                      src="/Logo_sofia.png"
                      alt="SOFIA AI Medical Logo"
                      width={40}
                      height={40}
                    />
                  </div>
                  <span className="text-xl font-bold text-white">SOFIA AI Medical</span>
                </div>
                <p className="mt-4">
                  Sistema de diagnóstico médico asistido por inteligencia artificial, diseñado para profesionales de la salud.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Enlaces rápidos</h3>
                <ul className="space-y-2">
                  <li><a href="/about" className="hover:text-white">Sobre nosotros</a></li>
                  <li><a href="/pricing" className="hover:text-white">Planes y precios</a></li>
                  <li><a href="/support" className="hover:text-white">Soporte técnico</a></li>
                  <li><a href="/privacy" className="hover:text-white">Política de privacidad</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Contacto</h3>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>+1 (555) 123-4567</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>contacto@sofiamedical.com</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Av. Medicina 123, Ciudad Salud</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-teal-700 pt-8 text-center">
              <p>© {new Date().getFullYear()} SOFIA AI Medical. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  return redirect("/dashboard")
}