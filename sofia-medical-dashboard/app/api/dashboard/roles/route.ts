import { NextRequest, NextResponse } from 'next/server';
import { getRoles } from '../../../../lib/db';

// GET: Obtener todos los roles
export async function GET(request: NextRequest) {
  try {
    const roles = await getRoles();
    return NextResponse.json({ roles });
  } catch (error: any) {
    console.error('[API Roles GET] Error obteniendo roles:', error.message, error.stack);
    return NextResponse.json({ error: error.message || 'Error al obtener roles' }, { status: 500 });
  }
}
