import { type NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/db';
import { PacienteRepository } from '../../../../lib/repositories/pacienteRepository';
import { MetadataRepository } from '../../../../lib/repositories/metadataRepository';
import { UserRepository } from '../../../../lib/repositories/userRepository';
import { PacienteUserData, PacienteDetails } from '../../../../lib/types'; // Importar tipos

// Definir interfaces para los resultados
interface SuccessfulRecord {
  record: any;
  id_usuario: number;
}

interface FailedRecord {
  record: any;
  reason: string;
  errors: string[]; // Para almacenar múltiples errores de validación
}

// Funciones de utilidad para validación
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhoneNumber = (phone: string): boolean => {
  // Regex simple para números de 7 a 15 dígitos, opcionalmente con + al inicio
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  return phoneRegex.test(phone);
};

const isValidDate = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch (e) {
    return false;
  }
};

async function getPacienteRepositoryInstance() {
  const dbClient = await getConnection();
  const metadataRepository = new MetadataRepository(dbClient);
  const userRepository = new UserRepository(dbClient);
  return new PacienteRepository(dbClient, metadataRepository, userRepository);
}

export async function POST(request: NextRequest) {
  console.log('[API POST /api/pacientes/bulk-register] - Solicitud recibida.');

  try {
    const formData = await request.formData();
    const csvFile = formData.get('csvFile') as Blob | null;

    if (!csvFile) {
      console.warn('[API POST /api/pacientes/bulk-register] - Error: No se proporcionó archivo CSV.');
      return NextResponse.json({ error: 'No se proporcionó archivo CSV.' }, { status: 400 });
    }

    const fileContent = await csvFile.text();
    console.log('[API POST /api/pacientes/bulk-register] - Archivo CSV leído.');

    // --- Parseo manual básico del CSV ---
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
      console.warn('[API POST /api/pacientes/bulk-register] - No se encontraron registros en el CSV.');
      return NextResponse.json({ message: 'No se encontraron registros en el archivo CSV.' }, { status: 200 });
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const records: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const record: any = {};
      headers.forEach((header, index) => {
        record[header] = values[index];
      });
      records.push(record);
    }
    // --- Fin Parseo manual básico ---

    if (!records || records.length === 0) {
      console.warn('[API POST /api/pacientes/bulk-register] - No se encontraron registros en el CSV.');
      return NextResponse.json({ message: 'No se encontraron registros en el archivo CSV.' }, { status: 200 });
    }

    // --- VALIDACIÓN GLOBAL ---
    const validationResults: { record: any, errors: string[] }[] = [];
    for (const record of records) {
      const { nombre, id, contacto, fecha_nacimiento, genero, direccion, grupo_sanguineo, ocupacion, info_seguro, contacto_emergencia, alergias, antecedentes_medicos, historial_visitas } = record;
      const errors: string[] = [];

      // Validación de campos requeridos
      if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        errors.push('El campo "nombre" es requerido y debe ser una cadena de texto no vacía.');
      }
      if (!id || typeof id !== 'string' || id.trim() === '') {
        errors.push('El campo "id" (NUI) es requerido y debe ser una cadena de texto no vacía.');
      }
      if (!contacto || typeof contacto !== 'string' || contacto.trim() === '') {
        errors.push('El campo "contacto" es requerido.');
      } else {
        // Validar si es email o teléfono
        if (!isValidEmail(contacto) && !isValidPhoneNumber(contacto)) {
          errors.push('El campo "contacto" debe ser un email o un número de teléfono válido.');
        }
      }

      // Validación de fecha de nacimiento
      if (fecha_nacimiento) {
        if (!isValidDate(fecha_nacimiento)) {
          errors.push('El campo "fecha_nacimiento" debe ser una fecha válida (YYYY-MM-DD).');
        }
      }

      // Validación de género
      const validGenders = ['Masculino', 'Femenino', 'Otro', 'No especificado'];
      if (genero && !validGenders.includes(genero)) {
        errors.push(`El campo "genero" debe ser uno de: ${validGenders.join(', ')}.`);
      }

      validationResults.push({ record, errors });
    }

    // Si hay algún error, NO guardar nada y devolver todos los errores
    const failed = validationResults.filter(r => r.errors.length > 0);
    if (failed.length > 0) {
      return NextResponse.json({
        message: 'Errores de validación en uno o más registros. No se guardó ningún paciente.',
        summary: {
          successfulCount: 0,
          failedCount: failed.length,
        },
        details: {
          successful: [],
          failed: failed.map(f => ({
            record: f.record,
            reason: 'Errores de validación de datos.',
            errors: f.errors,
          })),
        },
      }, { status: 200 });
    }

    // --- SI TODOS SON VÁLIDOS, INSERTAR ---
    const pacienteRepo = await getPacienteRepositoryInstance();
    const results: { successful: SuccessfulRecord[]; failed: FailedRecord[] } = {
      successful: [],
      failed: [],
    };

    for (const { record } of validationResults) {
      const { nombre, id, contacto, fecha_nacimiento, genero, direccion, grupo_sanguineo, ocupacion, info_seguro, contacto_emergencia, alergias, antecedentes_medicos, historial_visitas } = record;

      try {
        const [primer_nombre, ...restOfName] = nombre.split(' ');
        const primer_apellido = restOfName.join(' ');
        const email = isValidEmail(contacto) ? contacto : undefined;
        const telefono_contacto = isValidPhoneNumber(contacto) ? contacto : undefined;

        // Valores por defecto para tipo de documento y país
        const defaultTipoDocumentoCodigo = 'CC'; // Cédula de Ciudadanía
        const defaultPaisCodigo = 'COL'; // Colombia

        const pacienteUserData: PacienteUserData = {
          nui: id,
          primer_nombre: primer_nombre || '',
          primer_apellido: primer_apellido || '',
          email: email || `temp_${id}@example.com`,
          tipoDocumentoCodigo: defaultTipoDocumentoCodigo,
          paisCodigo: defaultPaisCodigo,
          estado: 'Activo',
          roles: ['paciente'],
        };

        let parsedFechaNacimiento: Date | null = null;
        if (fecha_nacimiento && isValidDate(fecha_nacimiento)) {
          parsedFechaNacimiento = new Date(fecha_nacimiento);
        }

        const pacienteDetails: PacienteDetails = {
          fecha_nacimiento: parsedFechaNacimiento
            ? parsedFechaNacimiento.toISOString().slice(0, 10)
            : null,
          genero: genero || null,
          telefono_contacto: telefono_contacto || null,
          direccion_residencial: direccion || null,
          grupo_sanguineo: grupo_sanguineo || null,
          ocupacion: ocupacion || null,
          info_seguro_medico: info_seguro || null,
          contacto_emergencia: contacto_emergencia || null,
          alergias: alergias || null,
          antecedentes_medicos: antecedentes_medicos || null,
          historial_visitas: historial_visitas || null,
        };

        const newPatientId = await pacienteRepo.insertPacienteCompleto(pacienteUserData, pacienteDetails);
        results.successful.push({ record, id_usuario: newPatientId });
        console.log(`[API POST /api/pacientes/bulk-register] - Paciente ${nombre} (${id}) registrado con ID: ${newPatientId}`);
      } catch (insertError: any) {
        console.error(`[API POST /api/pacientes/bulk-register] - Error al insertar paciente ${nombre} (${id}):`, insertError);
        results.failed.push({ record, reason: insertError.message, errors: [insertError.message] });
      }
    }

    console.log(`[API POST /api/pacientes/bulk-register] - Proceso de importación finalizado. Exitosos: ${results.successful.length}, Fallidos: ${results.failed.length}`);
    return NextResponse.json({
      message: 'Proceso de importación de pacientes finalizado.',
      summary: {
        successfulCount: results.successful.length,
        failedCount: results.failed.length,
      },
      details: results,
    }, { status: 200 });

  } catch (error: any) {
    console.error(`[API POST /api/pacientes/bulk-register] - Error catastrófico:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el archivo CSV.', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}