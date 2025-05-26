// Contenido de app/api/diagnosticos/[id_diagnostico]/route.ts

import { type NextRequest, NextResponse } from 'next/server';
import { type DiagnosticoDetallado, getConnection } from '../../../../lib/db';
import { DiagnosticoRepository, DiagnosticoRepositoryImpl } from '../../../../lib/repositories/diagnosticoRepository';
import { LocalImageStorageService } from '../../../../lib/services/imageStorageService';

async function getDiagnosticoRepositoryInstance(): Promise<DiagnosticoRepository> {
  const dbClient = await getConnection();
  const imageStorageService = new LocalImageStorageService();
  return new DiagnosticoRepositoryImpl(dbClient, imageStorageService);
}

export async function GET(
  request: NextRequest,
  context: { params: { id_diagnostico: string } }
) {
  const params = await context.params;
  const id_diagnostico_str = params.id_diagnostico;
  console.log(`[API GET /api/diagnosticos/${id_diagnostico_str}] - Solicitud recibida.`);

  try {
    if (!id_diagnostico_str) {
      console.warn(`[API GET /api/diagnosticos/${id_diagnostico_str}] - Error: Falta el ID del diagnóstico.`);
      return NextResponse.json({ error: 'Falta el ID del diagnóstico en la ruta.' }, { status: 400 });
    }

    const id_diagnostico = parseInt(id_diagnostico_str, 10);
    if (isNaN(id_diagnostico)) {
      console.warn(`[API GET /api/diagnosticos/${id_diagnostico_str}] - Error: El ID no es un número.`);
      return NextResponse.json({ error: 'El ID del diagnóstico debe ser un número.' }, { status: 400 });
    }

    console.log(`[API GET /api/diagnosticos/${id_diagnostico}] - Llamando a getDiagnosticoDetalladoById...`);
    const diagnosticoRepo = await getDiagnosticoRepositoryInstance();
    const diagnosticoDetallado: DiagnosticoDetallado | null = await diagnosticoRepo.getDiagnosticoDetalladoById(id_diagnostico);

    if (!diagnosticoDetallado) {
      console.warn(`[API GET /api/diagnosticos/${id_diagnostico}] - Diagnóstico no encontrado en la BD.`);
      return NextResponse.json({ error: 'Diagnóstico no encontrado.' }, { status: 404 });
    }
    console.log(`[API GET /api/diagnosticos/${id_diagnostico}] - Diagnóstico encontrado. imagen_url de BD: "${diagnosticoDetallado.imagen_url}", tipo: "${diagnosticoDetallado.imagen_tipo}"`);

    console.log(`[API GET /api/diagnosticos/${id_diagnostico}] - Enviando respuesta al frontend. imagen_url final (primeros 60 chars si es string): ${typeof diagnosticoDetallado.imagen_url === 'string' ? diagnosticoDetallado.imagen_url.substring(0,60) + '...' : diagnosticoDetallado.imagen_url}`);
    return NextResponse.json(diagnosticoDetallado);

  } catch (error: any) {
    console.error(`[API GET /api/diagnosticos/${id_diagnostico_str}] - Error catastrófico:`, error);
    return NextResponse.json(
      { error: 'Error interno al obtener los detalles del diagnóstico.', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id_diagnostico: string } } // <--- CAMBIO AQUÍ
) {
  const id_diagnostico_str = context.params.id_diagnostico; // <--- CAMBIO AQUÍ
  console.log(`API DELETE /api/diagnosticos/${id_diagnostico_str}] - Solicitud recibida.`);
  try {
    if (!id_diagnostico_str) {
      console.warn(`[API DELETE /api/diagnosticos/${id_diagnostico_str}] - Error: Falta el ID.`);
      return NextResponse.json({ error: 'Falta el ID del diagnóstico en la ruta.' }, { status: 400 });
    }

    const id_diagnostico = parseInt(id_diagnostico_str, 10);
    if (isNaN(id_diagnostico)) {
      console.warn(`[API DELETE /api/diagnosticos/${id_diagnostico_str}] - Error: El ID no es un número.`);
      return NextResponse.json({ error: 'El ID del diagnóstico debe ser un número.' }, { status: 400 });
    }

    console.log(`[API DELETE /api/diagnosticos/${id_diagnostico}] - Llamando a deleteDiagnosticoCompletoById...`);
    const diagnosticoRepo = await getDiagnosticoRepositoryInstance();
    const deleteResult = await diagnosticoRepo.deleteDiagnosticoCompletoById(id_diagnostico);

    if (deleteResult.success) {
      console.log(`[API DELETE /api/diagnosticos/${id_diagnostico}] - Eliminación exitosa.`);
      return NextResponse.json({ message: deleteResult.message }, { status: 200 }); 
    } else {
      const status = deleteResult.message.toLowerCase().includes("no se encontró") ? 404 : 500;
      console.warn(`[API DELETE /api/diagnosticos/${id_diagnostico}] - Falló la eliminación: ${deleteResult.message}`);
      return NextResponse.json({ error: deleteResult.message }, { status });
    }

  } catch (error: any) {
    console.error(`[API DELETE /api/diagnosticos/${id_diagnostico_str}] - Error catastrófico:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor al intentar eliminar el diagnóstico.', details: error.message },
      { status: 500 }
    );
  }
}
