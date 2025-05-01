import { NextRequest, NextResponse } from 'next/server';
import { getPacientes } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const pacientes = await getPacientes();
    return NextResponse.json({ pacientes }); // Envolver el array en un objeto con la clave 'pacientes'
  } catch (error: any) {
    console.error('Error fetching pacientes:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch pacientes' }, { status: 500 });
  }
}
