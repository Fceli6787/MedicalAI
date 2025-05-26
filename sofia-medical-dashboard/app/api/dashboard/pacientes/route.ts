import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/db';
import { IPacienteRepository, PacienteRepository } from '../../../../lib/repositories/pacienteRepository';
import { IMetadataRepository, MetadataRepository } from '../../../../lib/repositories/metadataRepository';
import { IUserRepository, UserRepository } from '../../../../lib/repositories/userRepository';
import { type SearchedPatient } from '../../../../lib/db';

// *** NOTA: La interfaz Paciente completa (con más detalles) debería definirse en un lugar común si es necesario ***
// Por ahora, asumimos que tanto searchPacientes como getPacientes devuelven al menos los campos de SearchedPatient
// O idealmente, ambas devuelven la estructura completa que necesita la tabla del frontend.
// Vamos a asumir que getPacientes devuelve la estructura completa y la usaremos.

async function getPacienteRepositoryInstance(): Promise<IPacienteRepository> {
  const dbClient = await getConnection();
  const metadataRepository = new MetadataRepository(dbClient);
  const userRepository = new UserRepository(dbClient);
  return new PacienteRepository(dbClient, metadataRepository, userRepository);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search'); 
    console.log(`/api/dashboard/pacientes GET - Search term: ${searchTerm}`);

    const pacienteRepo = await getPacienteRepositoryInstance();
    let pacientesResult: any[]; 

    if (searchTerm && searchTerm.trim().length >= 2) {
      pacientesResult = await pacienteRepo.searchPacientes(searchTerm.trim()); 
      console.log(`/api/dashboard/pacientes GET - Found ${pacientesResult.length} patients matching "${searchTerm}"`);
    } else {
      pacientesResult = await pacienteRepo.getPacientes(); 
      console.log(`/api/dashboard/pacientes GET - No search term, returning ${pacientesResult.length} total patients.`);
    }

    return NextResponse.json({ pacientes: pacientesResult }); 

  } catch (error: any) {
    console.error('Error fetching/searching pacientes:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch/search pacientes' }, { status: 500 });
  }
}

// El POST original no parece relevante para la búsqueda, lo dejo comentado
/*
export async function POST(request: NextRequest) {
  // ... tu lógica POST si la necesitas ...
}
*/
