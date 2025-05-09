import { NextRequest, NextResponse } from 'next/server';
// Importar funciones y tipo desde lib/db
import { searchPacientes, getPacientes, type SearchedPatient } from '../../../../lib/db'; 

// *** NOTA: La interfaz Paciente completa (con más detalles) debería definirse en un lugar común si es necesario ***
// Por ahora, asumimos que tanto searchPacientes como getPacientes devuelven al menos los campos de SearchedPatient
// O idealmente, ambas devuelven la estructura completa que necesita la tabla del frontend.
// Vamos a asumir que getPacientes devuelve la estructura completa y la usaremos.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search'); 
    console.log(`/api/dashboard/pacientes GET - Search term: ${searchTerm}`);

    let pacientesResult: any[]; // Usar 'any[]' temporalmente o una interfaz más completa

    if (searchTerm && searchTerm.trim().length >= 2) {
      // Idealmente, searchPacientes también devolvería la estructura completa
      // Si no, tendrías que hacer otra consulta aquí para obtener detalles completos
      pacientesResult = await searchPacientes(searchTerm.trim()); 
      console.log(`/api/dashboard/pacientes GET - Found ${pacientesResult.length} patients matching "${searchTerm}"`);
    } else {
      // Cuando no hay búsqueda, obtener todos los pacientes con detalles completos
      pacientesResult = await getPacientes(); // getPacientes devuelve la estructura detallada
      console.log(`/api/dashboard/pacientes GET - No search term, returning ${pacientesResult.length} total patients.`);
    }

    // *** CORRECCIÓN: Devolver los resultados dentro de un objeto con la clave 'pacientes' ***
    return NextResponse.json({ pacientes: pacientesResult }); 

  } catch (error: any) {
    console.error('Error fetching/searching pacientes:', error);
    // Devolver error en formato JSON también
    return NextResponse.json({ error: error.message || 'Failed to fetch/search pacientes' }, { status: 500 });
  }
}

// El POST original no parece relevante para la búsqueda, lo dejo comentado
/*
export async function POST(request: NextRequest) {
  // ... tu lógica POST si la necesitas ...
}
*/
