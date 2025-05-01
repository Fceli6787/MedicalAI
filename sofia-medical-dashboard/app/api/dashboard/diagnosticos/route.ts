import { NextRequest, NextResponse } from 'next/server';
import { getDiagnosticos, addDiagnostico } from '../../../../lib/db';
import { auth } from '../../../../lib/firebase'; // Importar auth para obtener el usuario autenticado en el servidor
import { validateUserRole } from '../../../../lib/db'; // Importar validateUserRole

export async function GET(request: NextRequest) {
  try {
    const diagnosticos = await getDiagnosticos();
    return NextResponse.json(diagnosticos);
  } catch (error: any) {
    console.error('Error fetching diagnosticos:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch diagnosticos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pacienteId, tipoExamen, resultado, confianza, userId } = await request.json();

    // Validar que los datos necesarios estén presentes
    if (!pacienteId || !tipoExamen || !resultado || confianza === undefined || userId === undefined) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Validar que el usuario esté autenticado y tenga permisos (opcional, dependiendo de la lógica de auth en el backend)
    // Si usas Firebase Admin SDK, puedes verificar el token aquí.
    // Por ahora, asumimos que el userId proporcionado es válido y verificamos el rol si es necesario.
    // const user = await auth.verifyIdToken(token); // Ejemplo con Firebase Admin SDK


    const diagnostico = {
      id_paciente: parseInt(pacienteId),
      id_medico: parseInt(userId), // Usar el userId recibido del cliente
      tipoExamenNombre: tipoExamen,
      resultado,
      nivel_confianza: confianza,
    };

    await addDiagnostico(diagnostico);

    return NextResponse.json({ message: 'Diagnóstico guardado exitosamente' }, { status: 200 });
  } catch (error: any) {
    console.error('Error saving diagnostico:', error);
    return NextResponse.json({ error: error.message || 'Error al guardar el diagnóstico' }, { status: 500 });
  }
}
