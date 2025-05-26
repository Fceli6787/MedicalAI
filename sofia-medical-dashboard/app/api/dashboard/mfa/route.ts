import { NextRequest, NextResponse } from 'next/server';
import { getMfaByUserId } from '../../../../lib/db';

// GET: Obtener configuración MFA de un usuario por ID
export async function GET(request: NextRequest) {
  try {
    const id_usuario = request.nextUrl.searchParams.get('id_usuario');
    if (!id_usuario) {
      return NextResponse.json({ error: 'Falta el parámetro id_usuario' }, { status: 400 });
    }
    const mfaConfig = await getMfaByUserId(Number(id_usuario));
    return NextResponse.json({ mfaConfig });
  } catch (error: any) {
    console.error('[API MFA GET] Error obteniendo configuración MFA:', error.message, error.stack);
    return NextResponse.json({ error: error.message || 'Error al obtener configuración MFA' }, { status: 500 });
  }
}
