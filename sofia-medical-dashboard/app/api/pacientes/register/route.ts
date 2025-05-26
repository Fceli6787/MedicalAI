import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/db';
import { IPacienteRepository, PacienteRepository } from '../../../../lib/repositories/pacienteRepository';
import { IMetadataRepository, MetadataRepository } from '../../../../lib/repositories/metadataRepository';
import { IUserRepository, UserRepository } from '../../../../lib/repositories/userRepository';

async function getPacienteRepositoryInstance(): Promise<IPacienteRepository> {
  const dbClient = await getConnection();
  const metadataRepository = new MetadataRepository(dbClient);
  const userRepository = new UserRepository(dbClient);
  return new PacienteRepository(dbClient, metadataRepository, userRepository);
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    console.log('API /api/pacientes POST - Received request body:', JSON.stringify(requestBody, null, 2));

    const pacienteDataForDb = {
      tipoDocumentoCodigo: requestBody.tipoDocumentoCodigo,
      paisCodigo: requestBody.paisCodigo,
      primer_nombre: requestBody.primer_nombre,
      segundo_nombre: requestBody.segundo_nombre,
      primer_apellido: requestBody.primer_apellido,
      segundo_apellido: requestBody.segundo_apellido,
      correo: requestBody.email,
      nui: requestBody.nui,
      firebase_uid: null, // firebase_uid no es requerido para pacientes
    };

    if (!pacienteDataForDb.tipoDocumentoCodigo || !pacienteDataForDb.paisCodigo || !pacienteDataForDb.primer_nombre || !pacienteDataForDb.primer_apellido || !pacienteDataForDb.correo || !pacienteDataForDb.nui) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos para usuario. Asegúrate de enviar: tipoDocumentoCodigo, paisCodigo, nui, primer_nombre, primer_apellido, email (correo).' },
        { status: 400 }
      );
    }

    const pacienteDetails = {
      fecha_nacimiento: requestBody.fecha_nacimiento || null,
      genero: requestBody.genero || null,
      telefono_contacto: requestBody.telefono_contacto || null,
      direccion_residencial: requestBody.direccion_residencial || null,
      grupo_sanguineo: requestBody.grupo_sanguineo || null,
      ocupacion: requestBody.ocupacion || null,
      info_seguro_medico: requestBody.info_seguro_medico || null,
      contacto_emergencia: requestBody.contacto_emergencia || null,
      alergias: requestBody.alergias || null,
      antecedentes_medicos: requestBody.antecedentes_medicos || null,
      historial_visitas: requestBody.historial_visitas || null,
    };

    const pacienteRepo = await getPacienteRepositoryInstance();
    const newPacienteUserId = await pacienteRepo.insertPacienteCompleto(pacienteDataForDb, pacienteDetails);
    console.log(`API /api/pacientes POST - Usuario con id ${newPacienteUserId} registrado exitosamente.`);

    return NextResponse.json({ message: 'Paciente registrado exitosamente (usuario y detalles)', userId: newPacienteUserId }, { status: 201 });
  } catch (error: any) {
    console.error('Error in API /api/pacientes POST (main try-catch):', error.message, error.stack);

    if (error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'El correo electrónico o NUI ya están registrados.' },
        { status: 409 }
      );
    }
    if (error.message.includes('FOREIGN KEY constraint failed')) {
      return NextResponse.json(
        { error: 'Error de referencia en la base de datos (ej. tipo de documento o país no válido).' },
        { status: 400 }
      );
    }
    if (error.message.includes('no encontrado') || error.message.includes('Failed to retrieve new user ID')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    if (error.message.includes('NOT NULL constraint failed')) {
      return NextResponse.json(
        { error: `Un campo requerido no fue proporcionado o fue nulo. Detalle: ${error.message}` },
        { status: 400 }
      );
    }
    if (error.message.includes('Wrong number of parameters')) {
      return NextResponse.json(
        { error: 'Error interno del driver de base de datos al procesar parámetros.', details: error.message },
        { status: 500 }
      );
    }
    if (error.message.includes('ERR_CONNECTION_ERROR') || error.message.toLowerCase().includes('connection error') || error.message.toLowerCase().includes('econreset')) {
      return NextResponse.json({ error: 'Error de conexión con la base de datos.', details: error.message }, { status: 503 });
    }

    return NextResponse.json({ error: 'Error interno del servidor al registrar paciente.', details: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const searchQuery = searchParams.get('search');

  try {
    const pacienteRepo = await getPacienteRepositoryInstance();

    if (searchQuery) {
      console.log(`API /api/pacientes GET - Buscando pacientes con término: "${searchQuery}"`);
      const pacientes = await pacienteRepo.searchPacientes(searchQuery);

      console.log(`API /api/pacientes GET - Encontrados ${pacientes?.length || 0} pacientes.`);
      return NextResponse.json(pacientes || [], { status: 200 });
    } else {
      console.log('API /api/pacientes GET - Obteniendo datos para selectores de formulario (tiposDocumento, paises).');
      const { tiposDocumento, paises } = await pacienteRepo.getTiposDocumentoYPaises();

      console.log(`API /api/pacientes GET - Devolviendo ${tiposDocumento.length} tipos de documento y ${paises.length} países.`);
      return NextResponse.json({ tiposDocumento, paises }, { status: 200 });
    }
  } catch (error: any) {
    console.error('API /api/pacientes GET - Error:', error.message, error.stack);
    if (error.errorCode === 'ERR_CONNECTION_ERROR' || error.message.toLowerCase().includes('connection error') || error.message.toLowerCase().includes('econreset')) {
      console.error('API /api/pacientes GET - Database Connection Error:', error.message, error.stack, error.cause);
      return NextResponse.json({ error: 'Error de conexión con la base de datos.', details: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Error al procesar la solicitud.', details: error.message }, { status: 500 });
  }
}
