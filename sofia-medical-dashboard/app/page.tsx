"use client"; 

import { useEffect, useState } from 'react'; 
import { useRouter } from "next/navigation"; 
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext"; 
import {
  HeartPulse,
  Brain,
  Clock,
  FileText,
  ShieldCheck,
  Users,
  TrendingUp,
  Lightbulb,
  Mail,
  Phone,
  MapPin,
  Menu, 
  X 
} from "lucide-react";

// Componente de Icono para Beneficios
const BenefitIcon = ({ icon: Icon }: { icon: React.ElementType }) => (
  <div className="mb-4 rounded-full bg-teal-100 dark:bg-teal-800/30 p-4 shadow-md transition-all duration-300 hover:bg-teal-200 dark:hover:bg-teal-700/50 hover:shadow-lg">
    <Icon className="h-10 w-10 text-teal-600 dark:text-teal-400" />
  </div>
);

// Componente de Tarjeta de Característica
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  details: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, details }) => (
  <Card className="flex h-full transform flex-col overflow-hidden rounded-xl border-teal-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl dark:hover:shadow-teal-900/50">
    <CardHeader className="bg-teal-50 dark:bg-gray-700/50 p-6">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 dark:bg-teal-700 text-white">
        <Icon size={28} />
      </div>
      <CardTitle className="text-2xl font-bold text-teal-800 dark:text-teal-300">{title}</CardTitle>
      <CardDescription className="text-sm text-teal-700 dark:text-teal-400">{description}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow p-6">
      <p className="text-gray-600 dark:text-gray-300">{details}</p>
    </CardContent>
  </Card>
);

export default function Home() {
  const { user, loading: authLoading } = useAuth(); 
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        console.log("[HomePage] Usuario autenticado, redirigiendo al dashboard...");
        router.push("/dashboard");
      } else {
        console.log("[HomePage] Usuario no autenticado, mostrando landing page.");
      }
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 font-sans">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-teal-600 dark:text-teal-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl font-semibold text-teal-700 dark:text-teal-300">Cargando SOFIA AI...</p>
        </div>
      </div>
    );
  }

  if (user) { 
    console.log("[HomePage] Usuario autenticado, esperando redirección por useEffect...");
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 font-sans">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-teal-600 dark:text-teal-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl font-semibold text-teal-700 dark:text-teal-300">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-teal-100 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/80 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="relative h-12 w-12">
              <Image
                src="/Logo_sofia.png"
                alt="SOFIA AI Medical Logo"
                width={48}
                height={48}
                className="rounded-full" 
              />
            </div>
            <span className="text-2xl font-bold text-teal-700 dark:text-teal-400">SOFIA AI</span>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <a href="#caracteristicas" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-300">Características</a>
            <a href="#beneficios" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-300">Beneficios</a>
            <a href="#testimonios" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-300">Testimonios</a>
            <a href="#contacto" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-300">Contacto</a>
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <Button asChild variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50 hover:text-teal-700 dark:border-teal-500 dark:text-teal-400 dark:hover:bg-gray-700 dark:hover:text-teal-300 transition-all duration-300 rounded-lg shadow-sm hover:shadow-md">
              <a href="/login">Iniciar Sesión</a>
            </Button>
            <Button asChild className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white transition-all duration-300 rounded-lg shadow-sm hover:shadow-md">
              <a href="/register">Registrarse</a>
            </Button>
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Abrir menú">
              {isMobileMenuOpen ? <X className="h-6 w-6 text-teal-700 dark:text-teal-400" /> : <Menu className="h-6 w-6 text-teal-700 dark:text-teal-400" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 shadow-lg absolute w-full left-0 top-full border-t dark:border-gray-700">
            <nav className="flex flex-col space-y-2 p-4">
              <a href="#caracteristicas" className="block py-2 px-3 rounded-md text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-700 hover:text-teal-600 dark:hover:text-teal-400" onClick={() => setIsMobileMenuOpen(false)}>Características</a>
              <a href="#beneficios" className="block py-2 px-3 rounded-md text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-700 hover:text-teal-600 dark:hover:text-teal-400" onClick={() => setIsMobileMenuOpen(false)}>Beneficios</a>
              <a href="#testimonios" className="block py-2 px-3 rounded-md text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-700 hover:text-teal-600 dark:hover:text-teal-400" onClick={() => setIsMobileMenuOpen(false)}>Testimonios</a>
              <a href="#contacto" className="block py-2 px-3 rounded-md text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-700 hover:text-teal-600 dark:hover:text-teal-400" onClick={() => setIsMobileMenuOpen(false)}>Contacto</a>
              <Button asChild variant="outline" className="w-full mt-2 border-teal-600 text-teal-600 hover:bg-teal-50 hover:text-teal-700 dark:border-teal-500 dark:text-teal-400 dark:hover:bg-gray-700 dark:hover:text-teal-300 transition-all duration-300 rounded-lg">
                <a href="/login" onClick={() => setIsMobileMenuOpen(false)}>Iniciar Sesión</a>
              </Button>
              <Button asChild className="w-full mt-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white transition-all duration-300 rounded-lg">
                <a href="/register" onClick={() => setIsMobileMenuOpen(false)}>Registrarse</a>
              </Button>
            </nav>
          </div>
        )}
      </header>

      <section className="relative py-20 md:py-32 bg-cover bg-center" style={{ backgroundImage: "url('/background.jpg')" }}>
        <div className="absolute inset-0 bg-teal-700 dark:bg-teal-800 opacity-60 dark:opacity-70"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl text-center mx-auto">
            <div className="mb-8 inline-block p-4 bg-white/20 dark:bg-white/10 rounded-full shadow-xl">
              <Image
                src="/Logo_sofia.png"
                alt="SOFIA AI Medical Logo"
                width={100}
                height={100}
                className="rounded-full"
              />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-lg">
              SOFIA AI Medical
            </h1>
            <p className="mt-6 max-w-xl mx-auto text-lg text-teal-100 dark:text-teal-200 md:text-xl drop-shadow-sm">
              Revolucionando el diagnóstico médico con la precisión y velocidad de la Inteligencia Artificial.
            </p>
            <div className="mt-10 flex flex-col items-center space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
              <Button asChild size="lg" className="bg-white text-teal-700 hover:bg-teal-50 dark:bg-teal-500 dark:text-white dark:hover:bg-teal-400 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-3 rounded-lg">
                <a href="/register">Comenzar Ahora</a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/20 dark:border-teal-300 dark:text-teal-200 dark:hover:bg-teal-600/50 dark:hover:text-white hover:text-white transition-all duration-300 transform hover:scale-105 px-8 py-3 rounded-lg"
              >
                <a href="#caracteristicas">Descubrir Más</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="caracteristicas" className="py-16 lg:py-24 bg-white dark:bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-teal-800 dark:text-teal-300 sm:text-4xl">Características Innovadoras</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Descubra cómo SOFIA AI Medical potencia a los profesionales de la salud con tecnología de vanguardia.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={Brain}
              title="Diagnóstico Preciso"
              description="Análisis avanzado de imágenes"
              details="Nuestra IA identifica patrones sutiles y anomalías en imágenes médicas con una precisión excepcional, asistiendo en diagnósticos complejos."
            />
            <FeatureCard
              icon={Clock}
              title="Resultados Rápidos"
              description="Diagnósticos en segundos"
              details="Obtenga análisis y resultados en tiempo real, optimizando el flujo de trabajo clínico y agilizando la toma de decisiones médicas."
            />
            <FeatureCard
              icon={FileText}
              title="Historial Detallado"
              description="Seguimiento integral"
              details="Mantenga un registro completo y organizado de todos los diagnósticos, facilitando el seguimiento evolutivo y la comparación de estudios."
            />
            <FeatureCard
              icon={Users}
              title="Interfaz Intuitiva"
              description="Diseñada para médicos"
              details="Una plataforma amigable y fácil de usar, que se integra sin fricciones en su práctica diaria, minimizando la curva de aprendizaje."
            />
          </div>
        </div>
      </section>

      <section id="beneficios" className="py-16 lg:py-24 bg-teal-50/70 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-teal-800 dark:text-teal-300 sm:text-4xl">Beneficios Clave para su Práctica</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Vea cómo SOFIA AI Medical transforma la eficiencia, precisión y cuidado al paciente.
            </p>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-700/60 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 dark:hover:shadow-teal-900/50">
              <BenefitIcon icon={TrendingUp} />
              <h3 className="text-xl font-semibold text-teal-700 dark:text-teal-400 mb-2">Optimización del Tiempo</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Reduzca significativamente el tiempo dedicado al análisis de imágenes y tareas repetitivas, permitiendo un enfoque mayor en el paciente.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-700/60 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 dark:hover:shadow-teal-900/50">
              <BenefitIcon icon={ShieldCheck} />
              <h3 className="text-xl font-semibold text-teal-700 dark:text-teal-400 mb-2">Mayor Precisión Diagnóstica</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Minimice errores y mejore la fiabilidad de los diagnósticos con el soporte de algoritmos de IA entrenados con millones de datos.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-700/60 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 dark:hover:shadow-teal-900/50">
              <BenefitIcon icon={Lightbulb} />
              <h3 className="text-xl font-semibold text-teal-700 dark:text-teal-400 mb-2">Mejora en la Toma de Decisiones</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Acceda a insights valiosos y datos estructurados que apoyan decisiones clínicas más informadas y personalizadas para cada paciente.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <section id="testimonios" className="py-16 lg:py-24 bg-white dark:bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-teal-800 dark:text-teal-300 sm:text-4xl">Lo que dicen los profesionales</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Historias reales de médicos que han transformado su práctica con SOFIA AI Medical.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-teal-50/50 dark:bg-gray-700/60 border-teal-100 dark:border-gray-700 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <Image src="https://placehold.co/50x50/7DD3FC/FFFFFF?text=Dr.A" alt="Doctor Ana Pérez" width={50} height={50} className="rounded-full mr-4"/>
                  <div>
                    <p className="font-semibold text-teal-700 dark:text-teal-400">Dra. Ana Pérez</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cardióloga, Clínica Corazón Sano</p>
                  </div>
                </div>
                <blockquote className="text-gray-600 dark:text-gray-300 italic">
                  "SOFIA AI ha sido un cambio de juego. La velocidad y precisión en el análisis de ecocardiogramas nos permite atender a más pacientes con mayor confianza."
                </blockquote>
              </CardContent>
            </Card>
            <Card className="bg-teal-50/50 dark:bg-gray-700/60 border-teal-100 dark:border-gray-700 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <Image src="https://placehold.co/50x50/FDBA74/FFFFFF?text=Dr.L" alt="Doctor Luis Gómez" width={50} height={50} className="rounded-full mr-4"/>
                  <div>
                    <p className="font-semibold text-teal-700 dark:text-teal-400">Dr. Luis Gómez</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Radiólogo, Centro Imagen Avanzada</p>
                  </div>
                </div>
                <blockquote className="text-gray-600 dark:text-gray-300 italic">
                  "La integración de SOFIA AI en nuestro flujo de trabajo fue sorprendentemente sencilla. La capacidad de detectar hallazgos tempranos es invaluable."
                </blockquote>
              </CardContent>
            </Card>
              <Card className="bg-teal-50/50 dark:bg-gray-700/60 border-teal-100 dark:border-gray-700 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <Image src="https://placehold.co/50x50/86EFAC/FFFFFF?text=Dr.C" alt="Doctor Carlos Ruiz" width={50} height={50} className="rounded-full mr-4"/>
                  <div>
                    <p className="font-semibold text-teal-700 dark:text-teal-400">Dr. Carlos Ruiz</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Oncólogo, Instituto Vida Plena</p>
                  </div>
                </div>
                <blockquote className="text-gray-600 dark:text-gray-300 italic">
                  "El soporte para el seguimiento de pacientes oncológicos es excepcional. SOFIA AI nos ayuda a personalizar tratamientos con mayor eficacia."
                </blockquote>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-teal-600 to-emerald-700 dark:from-teal-700 dark:to-emerald-800">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl drop-shadow-md">
              ¿Listo para transformar su práctica médica con IA?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-teal-100 dark:text-teal-200 drop-shadow-sm">
              Únase a la vanguardia de la medicina digital. Pruebe SOFIA AI Medical y experimente el futuro del diagnóstico.
            </p>
            <div className="mt-10 flex flex-col items-center space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
              <Button asChild size="lg" className="bg-white text-teal-700 hover:bg-teal-50 dark:bg-teal-500 dark:text-white dark:hover:bg-teal-400 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-3 rounded-lg">
                <a href="/register">Solicitar una Demo Gratuita</a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/20 dark:border-teal-300 dark:text-teal-200 dark:hover:bg-teal-600/50 dark:hover:text-white hover:text-white transition-all duration-300 transform hover:scale-105 px-8 py-3 rounded-lg"
              >
                <a href="#contacto">Hablar con un Experto</a> 
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer id="contacto" className="bg-teal-800 dark:bg-gray-900 py-16 text-teal-100 dark:text-gray-300">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 mb-10">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative h-10 w-10">
                    <Image
                      src="/Logo_sofia.png" // Assuming you want the main logo here too
                      alt="SOFIA AI Medical Logo"
                      width={40}
                      height={40}
                      className="rounded-md bg-white p-1" // Added white bg for logo visibility
                    />
                </div>
                <span className="text-xl font-bold text-white">SOFIA AI Medical</span>
              </div>
              <p className="text-sm text-teal-200 dark:text-gray-400">
                Innovación en diagnóstico médico asistido por IA para profesionales de la salud.
              </p>
              <div className="mt-6 flex space-x-4">
                <a href="#" aria-label="Facebook de SOFIA AI Medical" className="text-teal-300 dark:text-gray-400 hover:text-white dark:hover:text-teal-400 transition-colors"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg></a>
                <a href="#" aria-label="Twitter de SOFIA AI Medical" className="text-teal-300 dark:text-gray-400 hover:text-white dark:hover:text-teal-400 transition-colors"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg></a>
                <a href="#" aria-label="LinkedIn de SOFIA AI Medical" className="text-teal-300 dark:text-gray-400 hover:text-white dark:hover:text-teal-400 transition-colors"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg></a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Navegación</h3>
              <ul className="space-y-2">
                <li><a href="#caracteristicas" className="hover:text-white text-teal-200 dark:text-gray-400 dark:hover:text-teal-300 transition-colors">Características</a></li>
                <li><a href="#beneficios" className="hover:text-white text-teal-200 dark:text-gray-400 dark:hover:text-teal-300 transition-colors">Beneficios</a></li>
                <li><a href="/blog" className="hover:text-white text-teal-200 dark:text-gray-400 dark:hover:text-teal-300 transition-colors">Blog</a></li>
                <li><a href="/faq" className="hover:text-white text-teal-200 dark:text-gray-400 dark:hover:text-teal-300 transition-colors">Preguntas Frecuentes</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="/privacy" className="hover:text-white text-teal-200 dark:text-gray-400 dark:hover:text-teal-300 transition-colors">Política de Privacidad</a></li>
                <li><a href="/terms" className="hover:text-white text-teal-200 dark:text-gray-400 dark:hover:text-teal-300 transition-colors">Términos de Servicio</a></li>
                <li><a href="/cookies" className="hover:text-white text-teal-200 dark:text-gray-400 dark:hover:text-teal-300 transition-colors">Política de Cookies</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Contacto Directo</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2 text-teal-200 dark:text-gray-400">
                  <Mail size={20} className="mt-1 text-teal-300 dark:text-teal-500 flex-shrink-0" />
                  <a href="mailto:contacto@sofiamedical.com" className="hover:text-white dark:hover:text-teal-300 transition-colors">contacto@sofiamedical.com</a>
                </li>
                <li className="flex items-start space-x-2 text-teal-200 dark:text-gray-400">
                  <Phone size={20} className="mt-1 text-teal-300 dark:text-teal-500 flex-shrink-0" />
                  <a href="tel:+15551234567" className="hover:text-white dark:hover:text-teal-300 transition-colors">+1 (555) 123-4567</a>
                </li>
                <li className="flex items-start space-x-2 text-teal-200 dark:text-gray-400">
                  <MapPin size={20} className="mt-1 text-teal-300 dark:text-teal-500 flex-shrink-0" />
                  <span>Av. Innovación Médica 123, Ciudad Salud, CP 01010</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-teal-700 dark:border-gray-700 pt-8 text-center">
            <p className="text-sm text-teal-300 dark:text-gray-400">
              © {new Date().getFullYear()} SOFIA AI Medical. Todos los derechos reservados.
            </p>
            <p className="text-xs text-teal-400 dark:text-gray-500 mt-1">
              Diseñado con <HeartPulse size={14} className="inline text-teal-300 dark:text-teal-500 align-middle" /> para la comunidad médica.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
