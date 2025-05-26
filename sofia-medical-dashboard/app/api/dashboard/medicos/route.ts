import { NextRequest, NextResponse } from 'next/server';
import { getMedicos } from '../../../../lib/db';

// GET: Obtener todos los médicos
export async function GET(request: NextRequest) {
  try {
    const medicos = await getMedicos();
    return NextResponse.json({ medicos });
  } catch (error: any) {
    console.error('[API Medicos GET] Error obteniendo médicos:', error.message, error.stack);
    return NextResponse.json({ error: error.message || 'Error al obtener médicos' }, { status: 500 });
  }
}
