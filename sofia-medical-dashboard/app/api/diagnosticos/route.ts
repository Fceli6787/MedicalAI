import { type NextRequest, NextResponse } from 'next/server';
// Importar la función para guardar el diagnóstico completo y la función para obtenerlos
import { addDiagnosticoCompleto, getDiagnosticos } from '@/lib/db'; 

// Interfaz para el resultado del diagnóstico de la IA (debe coincidir con la de lib/db.ts y el frontend)
interface DiagnosisAIResult {
  condition?: string;
  confidence?: number;
  description?: string;
  recomendaciones?: string[];
  pronostico?: {
    tiempo_recuperacion?: string;
    probabilidad_mejoria?: string;
  };
}

// Interfaz para el cuerpo de la solicitud POST esperado (debe coincidir con el payload enviado desde handleSave)
interface DiagnosticoPostData {
  id_paciente: number;
  id_medico: number;
  tipoExamenNombre: string;
  imageBase64?: string | null;
  tipoImagen?: string | null;
  originalFileName?: string | null;
  diagnosisAIResult: DiagnosisAIResult;
}

function validateDiagnosticoPostData(data: any) {
  if (!data || typeof data !== 'object') {
    return { error: 'Cuerpo de la solicitud inválido o vacío.', status: 400 };
  }
  const { id_paciente, id_medico, tipoExamenNombre, diagnosisAIResult } = data;
  if (id_paciente === undefined || id_paciente === null) {
    return { error: 'Falta el campo obligatorio: id_paciente', status: 400 };
  }
  if (id_medico === undefined || id_medico === null) {
    return { error: 'Falta el campo obligatorio: id_medico', status: 400 };
  }
  if (!tipoExamenNombre) {
    return { error: 'Falta el campo obligatorio: tipoExamenNombre', status: 400 };
  }
  if (!diagnosisAIResult) {
    return { error: 'Falta el campo obligatorio: diagnosisAIResult', status: 400 };
  }
  if (diagnosisAIResult.condition === undefined && diagnosisAIResult.description === undefined) {
    return { error: 'El objeto diagnosisAIResult debe contener al menos condition o description.', status: 400 };
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    console.log('API POST /api/diagnosticos - Solicitud recibida.');
    // Esperar un cuerpo JSON
    const requestBody = await request.json(); 
    console.log('API POST /api/diagnosticos - Cuerpo de la solicitud:', JSON.stringify(requestBody, null, 2));

    const validation = validateDiagnosticoPostData(requestBody);
    if (validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    // Extraer datos del cuerpo JSON
    const {
      id_paciente,
      id_medico,
      tipoExamenNombre,
      imageBase64,
      tipoImagen,
      originalFileName,
      diagnosisAIResult,
    } = requestBody as DiagnosticoPostData;

    // Llamar a la función addDiagnosticoCompleto de lib/db.ts
    console.log('API POST /api/diagnosticos - Llamando a addDiagnosticoCompleto...');
    const nuevoDiagnosticoId = await addDiagnosticoCompleto({
      id_paciente: Number(id_paciente),
      id_medico: Number(id_medico),
      tipoExamenNombre,
      imageBase64: imageBase64 || null,
      tipoImagen: tipoImagen || null,
      originalFileName: originalFileName || null,
      diagnosisAIResult,
    });
    console.log(`API POST /api/diagnosticos - Diagnóstico completo guardado con ID: ${nuevoDiagnosticoId}`);

    // Respuesta exitosa
    return NextResponse.json(
      {
        message: 'Diagnóstico completo guardado exitosamente.',
        id_diagnostico: nuevoDiagnosticoId,
      },
      { status: 201 } // 201 Created es más apropiado para POST exitoso
    );

  } catch (error: any) {
    console.error('Error en el handler POST de /api/diagnosticos:', error);
    if (error.message.includes("no encontrado")) { // Error específico de tipo de examen no encontrado
        return NextResponse.json(
            { error: error.message },
            { status: 404 } 
        );
    }
    // Error genérico del servidor
    return NextResponse.json(
      { error: error.message || 'Error interno al guardar el diagnóstico completo.' },
      { status: 500 }
    );
  }
}

// El GET se mantiene igual para listar diagnósticos
export async function GET(request: NextRequest) { 
  try {
    console.log('API GET /api/diagnosticos - Solicitud recibida.');
    const diagnosticos = await getDiagnosticos();
    console.log(`API GET /api/diagnosticos - ${diagnosticos.length} diagnósticos obtenidos.`);
    return NextResponse.json(diagnosticos);
  } catch (error: any) {
    console.error('Error en GET /api/diagnosticos:', error);
    return NextResponse.json(
      { error: error.message || 'Error al leer los diagnósticos de la base de datos.' },
      { status: 500 }
    );
  }
}
