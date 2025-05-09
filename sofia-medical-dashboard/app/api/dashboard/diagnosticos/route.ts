import { NextRequest, NextResponse } from 'next/server';
import { getDiagnosticos, addDiagnosticoBasico } from '../../../../lib/db'; 
// import { auth } from '../../../../lib/firebase'; // Comentado si no se usa para validar token aquí
// import { validateUserRole } from '../../../../lib/db'; // Comentado porque no está definido/usado

// Interfaz para el cuerpo esperado de la solicitud POST
interface DiagnosticoDashboardData {
    pacienteId: string | number; // Puede venir como string o number
    tipoExamen: string; // Asumiendo que este es el nombre del tipo de examen
    resultado: string;
    confianza: string | number; // Puede venir como string o number
    userId: string | number; // ID del médico, puede venir como string o number
}

export async function GET(request: NextRequest) {
  try {
    console.log('API GET /api/dashboard/diagnosticos - Solicitud recibida.');
    const diagnosticos = await getDiagnosticos();
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
    console.log('/api/dashboard/diagnosticos POST - Datos recibidos:', body);
    const { pacienteId, tipoExamen, resultado, confianza, userId } = body as DiagnosticoDashboardData;

    // Validar que los datos necesarios estén presentes
    if (pacienteId === undefined || pacienteId === null) {
         return NextResponse.json({ error: 'Falta el campo obligatorio: pacienteId' }, { status: 400 });
    }
    if (!tipoExamen) {
         return NextResponse.json({ error: 'Falta el campo obligatorio: tipoExamen' }, { status: 400 });
    }
     if (!resultado) {
         return NextResponse.json({ error: 'Falta el campo obligatorio: resultado' }, { status: 400 });
    }
    if (confianza === undefined || confianza === null) {
        return NextResponse.json({ error: 'Falta el campo obligatorio: confianza' }, { status: 400 });
    }
    if (userId === undefined || userId === null) {
        return NextResponse.json({ error: 'Falta el campo obligatorio: userId (id_medico)' }, { status: 400 });
    }

    // Preparar datos para addDiagnosticoBasico
    const diagnostico = {
      id_paciente: Number(pacienteId), // Convertir a número
      id_medico: Number(userId),     // Convertir a número
      tipoExamenNombre: tipoExamen,  // Usar directamente
      resultado: resultado,
      nivel_confianza: Number(confianza), // Convertir a número
    };
    console.log('/api/dashboard/diagnosticos POST - Datos preparados para DB:', diagnostico);


    // Llamar a la función addDiagnosticoBasico
    const nuevoDiagnosticoId = await addDiagnosticoBasico(diagnostico);
    console.log(`/api/dashboard/diagnosticos POST - Diagnóstico básico guardado con ID: ${nuevoDiagnosticoId}`);


    return NextResponse.json({ 
        message: 'Diagnóstico guardado exitosamente',
        id_diagnostico: nuevoDiagnosticoId
     }, { status: 200 }); // Status 200 o 201 (Created) son apropiados

  } catch (error: any) {
    console.error('Error en POST /api/dashboard/diagnosticos:', error);
     if (error.message.includes("no encontrado")) {
        return NextResponse.json(
            { error: error.message },
            { status: 404 } // O 400 si se considera error de input
        );
    }
    return NextResponse.json({ error: error.message || 'Error al guardar el diagnóstico' }, { status: 500 });
  }
}
