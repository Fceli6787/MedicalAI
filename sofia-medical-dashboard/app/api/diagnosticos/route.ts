import { NextResponse } from 'next/server';
import { getDiagnosticos, addDiagnostico } from '@/lib/db'; // Importar funciones de lib/db

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    // La lógica de manejo de imágenes debe ser adaptada si se desea guardar en la DB.
    // Por ahora, solo procesaremos los datos del diagnóstico.
    const diagnosticoData = JSON.parse(formData.get('diagnostico') as string);

    // Validar datos requeridos para addDiagnostico
    if (!diagnosticoData.id_paciente || !diagnosticoData.tipoExamenNombre || !diagnosticoData.resultado || diagnosticoData.nivel_confianza === undefined || !diagnosticoData.id_medico) {
       return NextResponse.json({ error: 'Faltan campos obligatorios para el diagnóstico' }, { status: 400 });
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
    return NextResponse.json({ message: 'Diagnóstico guardado exitosamente en la base de datos' }, { status: 201 });

  } catch (error: any) {
    console.error('Error en el handler POST de diagnosticos:', error);
    return NextResponse.json(
      { error: error.message || 'Error al guardar el diagnóstico en la base de datos' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Llamar a la función getDiagnosticos de lib/db.ts
    const diagnosticos = await getDiagnosticos();
    return NextResponse.json(diagnosticos);
  } catch (error: any) {
    console.error('Error fetching diagnosticos:', error);
    return NextResponse.json(
      { error: error.message || 'Error al leer los diagnósticos de la base de datos' },
      { status: 500 }
    );
  }
}
