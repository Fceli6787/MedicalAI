import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[API POST /api/feedback] - Solicitud recibida.');

  try {
    const { userId, feedback, page } = await request.json();

    if (!feedback) {
      console.warn('[API POST /api/feedback] - Error: Retroalimentación vacía.');
      return NextResponse.json({ error: 'La retroalimentación no puede estar vacía.' }, { status: 400 });
    }

    // Aquí se podría guardar la retroalimentación en una base de datos,
    // enviar a un servicio de logging, o a un sistema de tickets.
    // Por ahora, solo la imprimiremos en la consola.
    console.log('--- Nueva Retroalimentación Recibida ---');
    console.log(`Usuario ID: ${userId || 'Desconocido'}`);
    console.log(`Página: ${page || 'Desconocida'}`);
    console.log(`Comentario: ${feedback}`);
    console.log('---------------------------------------');

    return NextResponse.json({ message: 'Retroalimentación recibida exitosamente.' }, { status: 200 });

  } catch (error: any) {
    console.error(`[API POST /api/feedback] - Error catastrófico:`, error);
    return NextResponse.json(
      { error: 'Error interno al procesar la retroalimentación.', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
