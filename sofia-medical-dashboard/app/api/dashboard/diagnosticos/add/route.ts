import { NextResponse } from 'next/server';
import { addDiagnostico } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const diagnosticoData = await request.json();

    // Validar datos requeridos
    const requiredFields = ["id_paciente", "tipoExamenNombre", "resultado", "nivel_confianza", "id_medico"] // Agregado id_medico como campo requerido
    for (const field of requiredFields) {
      if (diagnosticoData[field] === undefined) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Crear diagnóstico en la base de datos
    const diagnostico = await addDiagnostico({
      ...diagnosticoData,
      diagnostico_json: diagnosticoData.diagnostico || {}
    });

    return NextResponse.json(diagnostico, { status: 201 });
  } catch (error: any) {
    console.error('Error al guardar el diagnóstico en la API:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor al guardar el diagnóstico.' }, { status: 500 });
  }
}
