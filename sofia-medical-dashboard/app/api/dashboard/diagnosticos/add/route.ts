import { type NextRequest, NextResponse } from 'next/server';
import { addDiagnostico } from '@/lib/db';

// Define la estructura esperada para un diagnóstico
interface DiagnosticoData {
  id_paciente: number;
  tipoExamenNombre: string;
  resultado: string;
  nivel_confianza: number;
  id_medico: number;
  // El campo diagnostico_json no está en la función addDiagnostico en lib/db.ts
  // Si es necesario, la función addDiagnostico debería ser actualizada para manejarlo.
}

export async function POST(request: NextRequest) {
  try {
    const diagnosticoData: DiagnosticoData = await request.json();

    // Validar datos requeridos
    const requiredFields: (keyof DiagnosticoData)[] = [
        "id_paciente",
        "tipoExamenNombre",
        "resultado",
        "nivel_confianza",
        "id_medico"
    ];
    for (const field of requiredFields) {
      if (!(field in diagnosticoData) || diagnosticoData[field] === undefined) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Llamar a la función addDiagnostico de lib/db.ts
    await addDiagnostico({
      id_paciente: diagnosticoData.id_paciente,
      id_medico: diagnosticoData.id_medico,
      tipoExamenNombre: diagnosticoData.tipoExamenNombre,
      resultado: diagnosticoData.resultado,
      nivel_confianza: diagnosticoData.nivel_confianza,
    });

    // Respuesta exitosa
    return NextResponse.json({ message: 'Diagnóstico guardado exitosamente' }, { status: 201 });

  } catch (error: any) {
    console.error('Error en el handler POST de diagnósticos:', error);
    return NextResponse.json({ error: error.message || 'Error al guardar el diagnóstico' }, { status: 500 });
  }
}
