import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';

import { User } from "../lib/types"; // Importar la interfaz User centralizada

interface OnboardingStep {
  title: string;
  description: string;
  isLastStep?: boolean;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: "Bienvenido a Sofia Medical Dashboard",
    description: "Esta guía rápida te ayudará a familiarizarte con las funciones clave de la plataforma. ¡Empecemos!",
  },
  {
    title: "Métricas Clave",
    description: "En la parte superior, encontrarás un resumen de métricas importantes como el total de diagnósticos, pacientes registrados y la precisión de la IA. Esto te da una visión general rápida del rendimiento.",
  },
  {
    title: "Diagnósticos Recientes",
    description: "La primera pestaña muestra tus diagnósticos más recientes. Aquí puedes ver rápidamente los últimos casos y su nivel de confianza.",
  },
  {
    title: "Estadísticas Detalladas",
    description: "La pestaña de 'Estadísticas' te ofrece gráficos interactivos sobre la distribución de diagnósticos por tipo de examen, pacientes por género y resultados generales. ¡Explora tus datos!",
  },
  {
    title: "Navegación Lateral",
    description: "Usa la barra lateral izquierda para navegar entre las diferentes secciones de la aplicación: Dashboard, Historial, Pacientes, Nuevo Diagnóstico y Configuración.",
  },
  {
    title: "Gestión de Pacientes",
    description: "En la sección 'Pacientes', puedes ver, añadir y gestionar la información de todos tus pacientes. ¡Pronto podrás importar pacientes en masa!",
  },
  {
    title: "Creación de Diagnósticos",
    description: "Ve a 'Nuevo Diagnóstico' para iniciar un nuevo análisis. Podrás subir imágenes y obtener diagnósticos asistidos por IA.",
  },
  {
    title: "Configuración de Cuenta",
    description: "En 'Configuración', puedes ajustar tus preferencias, gestionar tu perfil y configurar opciones de seguridad como la autenticación de dos factores (MFA).",
  },
  {
    title: "¡Listo para Empezar!",
    description: "Has completado el tour. Esperamos que esta guía te sea útil. ¡Ahora estás listo para explorar todas las funcionalidades de Sofia Medical Dashboard!",
    isLastStep: true,
  },
];

export const useOnboardingTour = (user: User | null) => {
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    if (user && user.fecha_registro) {
      const registrationDate = dayjs(user.fecha_registro);
      const now = dayjs();
      const daysSinceRegistration = now.diff(registrationDate, 'day');
      const NEW_USER_THRESHOLD_DAYS = 7; // Considerar "nuevo" si se registró en los últimos 7 días

      const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');

      if (daysSinceRegistration <= NEW_USER_THRESHOLD_DAYS && !hasSeenTour) {
        setShowOnboardingTour(true);
      } else {
        setShowOnboardingTour(false);
        localStorage.setItem('hasSeenOnboardingTour', 'true');
      }
    } else {
      setShowOnboardingTour(false);
    }
  }, [user]);

  const handleNextTourStep = useCallback(() => {
    if (currentTourStep < onboardingSteps.length - 1) {
      setCurrentTourStep(prev => prev + 1);
    } else {
      setShowOnboardingTour(false);
      localStorage.setItem('hasSeenOnboardingTour', 'true');
      setShowFeedbackModal(true); // Mostrar modal de feedback al final
    }
  }, [currentTourStep]);

  const handleSkipTour = useCallback(() => {
    setShowOnboardingTour(false);
    localStorage.setItem('hasSeenOnboardingTour', 'true');
    setShowFeedbackModal(true); // Mostrar modal de feedback al saltar
  }, []);

  return {
    showOnboardingTour,
    currentTourStep,
    onboardingSteps,
    handleNextTourStep,
    handleSkipTour,
    showFeedbackModal,
    setShowFeedbackModal,
  };
};
