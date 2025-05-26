import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/db';
import { DiagnosticoRepository, DiagnosticoRepositoryImpl, DiagnosisAIResult } from '../../../../lib/repositories/diagnosticoRepository';
import { LocalImageStorageService } from '../../../../lib/services/imageStorageService';

// Interfaz para el cuerpo esperado de la solicitud POST
interface DiagnosticoDashboardData {
    pacienteId: string | number; // Puede venir como string o number
    tipoExamen: string; // Asumiendo que este es el nombre del tipo de examen
    resultado: string; // Este campo ahora es parte de diagnosisAIResult.condition
    confianza: string | number; // Este campo ahora es parte de diagnosisAIResult.confidence
    userId: string | number; // ID del médico, puede venir como string o number
    aiDescripcionDetallada?: string;
    aiPronosticoTiempoRecuperacion?: string;
    aiPronosticoProbabilidadMejoria?: string;
    recomendaciones?: string[];
    imageBase64?: string | null;
    tipoImagen?: string | null;
    originalFileName?: string | null;
}

function validateDiagnosticoDashboardData(data: any) {
  if (!data || typeof data !== 'object') {
    return { error: 'Cuerpo de la solicitud inválido o vacío.', status: 400 };
  }
    const { pacienteId, tipoExamen, resultado, confianza, userId, aiDescripcionDetallada, aiPronosticoTiempoRecuperacion, aiPronosticoProbabilidadMejoria, recomendaciones, imageBase64, tipoImagen, originalFileName } = data;
    if (pacienteId === undefined || pacienteId === null) {
      return { error: 'Falta el campo obligatorio: pacienteId', status: 400 };
    }
    if (!tipoExamen) {
      return { error: 'Falta el campo obligatorio: tipoExamen', status: 400 };
    }
    // 'resultado' y 'confianza' ahora son parte de diagnosisAIResult, pero aún pueden ser validados aquí si son esenciales para la solicitud inicial.
    // Por ahora, los mantendremos como obligatorios para la validación básica.
    if (!resultado) {
      return { error: 'Falta el campo obligatorio: resultado (condición del diagnóstico)', status: 400 };
    }
    if (confianza === undefined || confianza === null) {
      return { error: 'Falta el campo obligatorio: confianza (nivel de confianza del diagnóstico)', status: 400 };
    }
    if (userId === undefined || userId === null) {
      return { error: 'Falta el campo obligatorio: userId (id_medico)', status: 400 };
    }
    return null;
  }

async function getDiagnosticoRepositoryInstance(): Promise<DiagnosticoRepository> {
  const dbClient = await getConnection();
  const imageStorageService = new LocalImageStorageService();
  return new DiagnosticoRepositoryImpl(dbClient, imageStorageService);
}

export async function GET(request: NextRequest) {
  try {
    console.log('API GET /api/dashboard/diagnosticos - Solicitud recibida.');
    const diagnosticoRepo = await getDiagnosticoRepositoryInstance();
    const diagnosticos = await diagnosticoRepo.getDiagnosticos();
    console.log(`API GET /api/dashboard/diagnosticos - ${diagnosticos.length} diagnósticos obtenidos.`);
    return NextResponse.json(diagnosticos);
  } catch (error: any) {
    console.error('Error en GET /api/dashboard/diagnosticos:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch diagnosticos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateDiagnosticoDashboardData(body);
    if (validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }
    const { pacienteId, tipoExamen, resultado, confianza, userId, aiDescripcionDetallada, aiPronosticoTiempoRecuperacion, aiPronosticoProbabilidadMejoria, recomendaciones, imageBase64, tipoImagen, originalFileName } = body as DiagnosticoDashboardData;

    const diagnosisAIResult: DiagnosisAIResult = {
      condition: resultado,
      confidence: Number(confianza),
      description: aiDescripcionDetallada,
      pronostico: {
        tiempo_recuperacion: aiPronosticoTiempoRecuperacion,
        probabilidad_mejoria: aiPronosticoProbabilidadMejoria,
      },
      recomendaciones: recomendaciones,
    };

    const diagnosticoData = {
      id_paciente: Number(pacienteId),
      id_medico: Number(userId),
      tipoExamenNombre: tipoExamen,
      imageBase64: imageBase64,
      tipoImagen: tipoImagen,
      originalFileName: originalFileName,
      diagnosisAIResult: diagnosisAIResult,
    };

    const diagnosticoRepo = await getDiagnosticoRepositoryInstance();
    const nuevoDiagnosticoId = await diagnosticoRepo.addDiagnosticoCompleto(diagnosticoData);

    return NextResponse.json({
      message: 'Diagnóstico guardado exitosamente',
      id_diagnostico: nuevoDiagnosticoId
    }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("no encontrado")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'Error al guardar el diagnóstico' }, { status: 500 });
  }
}
