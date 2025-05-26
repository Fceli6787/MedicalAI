import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../../../lib/db';
import { IPacienteRepository, PacienteRepository } from '../../../../../lib/repositories/pacienteRepository';
import { IMetadataRepository, MetadataRepository } from '../../../../../lib/repositories/metadataRepository';
import { IUserRepository, UserRepository } from '../../../../../lib/repositories/userRepository';

interface PacienteData {
  // Define aquí todos los campos que esperas recibir para actualizar un paciente
  // Coincide con los campos de 'editingPatientFormData' excepto id_usuario
  primer_nombre?: string;
  segundo_nombre?: string | null;
  primer_apellido?: string;
  segundo_apellido?: string | null;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  email?: string; // En la BD podría ser 'correo'
  telefono_contacto?: string | null;
  direccion_residencial?: string | null;
  tipoDocumentoCodigo?: string; // En la BD podría ser 'id_tipo_documento' si es un ID
  paisCodigo?: string; // En la BD podría ser 'id_pais'
  nui?: string;
  grupo_sanguineo?: string | null;
  ocupacion?: string | null;
  info_seguro_medico?: string | null;
  contacto_emergencia?: string | null;
  // No incluyas campos como firebase_uid, password (a menos que se maneje explícitamente el cambio)
}


async function getPacienteRepositoryInstance(): Promise<IPacienteRepository> {
  const dbClient = await getConnection();
  const metadataRepository = new MetadataRepository(dbClient);
  const userRepository = new UserRepository(dbClient);
  return new PacienteRepository(dbClient, metadataRepository, userRepository);
}

// GET: Obtener un paciente por ID
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id_usuario = parseInt(url.pathname.split('/').pop() || '', 10);
  if (isNaN(id_usuario)) {
    return NextResponse.json({ error: 'ID de usuario inválido.' }, { status: 400 });
  }

  try {
    const pacienteRepo = await getPacienteRepositoryInstance();
    const paciente = await pacienteRepo.getPacienteById(id_usuario);

    if (!paciente) {
      return NextResponse.json({ error: 'Paciente no encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ paciente });

  } catch (error: any) {
    console.error(`Error fetching paciente con ID ${id_usuario}:`, error);
    return NextResponse.json({ error: error.message || 'Error al obtener el paciente.' }, { status: 500 });
  }
}

// PUT: Actualizar un paciente por ID
export async function PUT(request: NextRequest) {
  const url = new URL(request.url);
  const id_usuario = parseInt(url.pathname.split('/').pop() || '', 10);
  if (isNaN(id_usuario)) {
    return NextResponse.json({ error: 'ID de usuario inválido.' }, { status: 400 });
  }

  try {
    const data = await request.json() as PacienteData;

    // Validaciones básicas (puedes expandirlas)
    if (!data.primer_nombre || !data.primer_apellido || !data.email || !data.nui || !data.tipoDocumentoCodigo || !data.paisCodigo) {
        return NextResponse.json({ error: 'Faltan campos requeridos para la actualización.' }, { status: 400 });
    }

    // Llama a tu función de base de datos para actualizar el paciente
    // Esta función necesitará manejar la actualización en 'usuarios' y 'pacientes'
    // y convertir códigos (tipoDocumentoCodigo, paisCodigo) a IDs si es necesario.
    const pacienteRepo = await getPacienteRepositoryInstance();
    const updatedPaciente = await pacienteRepo.updatePaciente(id_usuario, data);

    if (!updatedPaciente) {
      // Esto podría significar que el paciente no existía o la actualización falló por otra razón
      return NextResponse.json({ error: 'No se pudo actualizar el paciente o no fue encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Paciente actualizado exitosamente.', paciente: updatedPaciente });

  } catch (error: any) {
    console.error(`Error updating paciente con ID ${id_usuario}:`, error);
    return NextResponse.json({ error: error.message || 'Error al actualizar el paciente.' }, { status: 500 });
  }
}

// DELETE: Eliminar un paciente por ID
export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const id_usuario = parseInt(url.pathname.split('/').pop() || '', 10);
  if (isNaN(id_usuario)) {
    return NextResponse.json({ error: 'ID de usuario inválido.' }, { status: 400 });
  }

  try {
    // Llama a tu función de base de datos para eliminar el paciente
    // Asegúrate de manejar la eliminación en cascada o las dependencias correctamente.
    const pacienteRepo = await getPacienteRepositoryInstance();
    const success = await pacienteRepo.deletePaciente(id_usuario);

    if (!success) {
      // Podría ser que el paciente no existiera o la eliminación fallara.
      return NextResponse.json({ error: 'No se pudo eliminar el paciente o no fue encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Paciente eliminado exitosamente.' });

  } catch (error: any) {
    console.error(`Error deleting paciente con ID ${id_usuario}:`, error);
    return NextResponse.json({ error: error.message || 'Error al eliminar el paciente.' }, { status: 500 });
  }
}
