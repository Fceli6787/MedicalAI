import { Database } from '@sqlitecloud/drivers';

// --- Interfaz para el resultado de la búsqueda (debe coincidir con el frontend) ---
export interface SearchedPatient {
  id_usuario: number;
  primer_nombre: string;
  primer_apellido: string;
  nui: string;
}

let client: Database | null = null;
let clientInitializationTimestamp: number | null = null;

const getClient = async (): Promise<Database> => {
  const now = Date.now();
  if (client && clientInitializationTimestamp) {
    try {
      await client.sql('SELECT 1 AS test_query_on_reused_client');
      console.log(`getClient - Reusing existing client initialized at ${new Date(clientInitializationTimestamp).toISOString()}. Test query on reused client successful.`);
      return client;
    } catch (testError: any) {
      console.warn(`getClient - Existing client (initialized at ${new Date(clientInitializationTimestamp).toISOString()}) FAILED test query. Error: ${testError.message}. Re-initializing client.`);
      client = null;
      clientInitializationTimestamp = null;
    }
  }

  const dbUrl = process.env.NEXT_PUBLIC_SQLITECLOUD_URL;

  if (!dbUrl) {
    console.error("getClient - ERROR: Missing SQLITECLOUD_URL environment variable");
    throw new Error('Missing SQLITECLOUD_URL environment variable');
  }

  try {
    console.log("getClient - Attempting to create new Database instance...");
    client = new Database(dbUrl);
    clientInitializationTimestamp = now;
    console.log(`getClient - New SQLite Cloud client created and initialized at ${new Date(clientInitializationTimestamp).toISOString()}. Attempting to connect...`);
    await client.sql('SELECT 1 AS test_query_on_new_client');
    console.log('getClient - SQLite Cloud client connected and responsive (new client).');
    return client;
  } catch (error) {
    console.error('Error connecting to SQLite Cloud (during new client creation):', error);
    client = null;
    clientInitializationTimestamp = null;
    throw error;
  }
};

export async function getConnection() {
  return getClient();
}

export async function init() {
  // Lógica de inicialización... (sin cambios)
  if (typeof window !== 'undefined') {
    return;
  }
  try {
    const dbClient = await getClient();
    console.log('Database connected for init');

    const tablesExistResult = await dbClient.sql(`SELECT name FROM sqlite_master WHERE type='table' AND name='roles'`);
    const tablesExist = tablesExistResult && tablesExistResult.length > 0;

    if (!tablesExist) {
      console.error('Tables do not exist, attempting to initialize...');
      console.log('Database initialization logic expects tables to be pre-created.');
    } else {
      console.log('Tables exist, checking roles and admin user.');
      const rolesToEnsure = ['admin', 'medico', 'paciente'];
      for (const roleName of rolesToEnsure) {
        const roleRows = await dbClient.sql(`SELECT id_rol FROM roles WHERE nombre = ?`, [roleName]);
        if (roleRows && roleRows.length === 0) {
          await dbClient.sql(`INSERT INTO roles (nombre) VALUES (?)`, [roleName]);
          console.log(`Rol '${roleName}' creado.`);
        }
      }

      const adminEmail = 'admin@example.com';
      const adminUid = 'ADMIN_FIREBASE_UID';
      const adminRole = 'admin';

      const adminUserRows = await dbClient.sql(`SELECT id_usuario FROM usuarios WHERE correo = ?`, [adminEmail]);
      if (adminUserRows && adminUserRows.length === 0) {
        const tipoDocumentoResult = await dbClient.sql(`SELECT id_tipo_documento FROM tiposdocumento WHERE codigo = 'CC'`);
        const idTipoDocumento = tipoDocumentoResult?.[0]?.id_tipo_documento;

        const paisResult = await dbClient.sql(`SELECT id_pais FROM paises WHERE codigo = 'COL'`);
        const idPais = paisResult?.[0]?.id_pais;

        if (!idTipoDocumento || !idPais) {
          console.error('Could not find default tiposdocumento or paises for admin user creation. Ensure they exist in DB.');
        } else {
          const insertResult = await dbClient.sql(
            `INSERT INTO usuarios (id_tipo_documento, id_pais, nui, primer_nombre, primer_apellido, correo, firebase_uid, estado) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo') RETURNING id_usuario`,
            ...[idTipoDocumento, idPais, '0000000000', 'Admin', 'User', adminEmail, adminUid]
          );

          let adminUserId: number | undefined;
          if (insertResult && Array.isArray(insertResult) && insertResult.length > 0 && insertResult[0].id_usuario !== undefined) {
            adminUserId = Number(insertResult[0].id_usuario);
          } else if (insertResult && (insertResult as any).id_usuario !== undefined) {
            adminUserId = Number((insertResult as any).id_usuario);
          } else {
            const lastIdResult = await dbClient.sql('SELECT last_insert_rowid() as id'); 
            const adminUserIdValue = lastIdResult?.[0]?.id; 
            if (adminUserIdValue !== undefined && adminUserIdValue !== null) {
              adminUserId = Number(adminUserIdValue);
            }
          }
          
          if (adminUserId) {
            await dbClient.sql(`INSERT INTO usuariosroles (id_usuario, id_rol) VALUES (?, (SELECT id_rol FROM roles WHERE nombre = ?))`, ...[adminUserId, adminRole]);
            console.log('Admin user and role assignment created.');
          } else {
            console.error('Failed to retrieve new admin user ID after insertion. Admin user role not assigned.');
          }
        }
      } else if (adminUserRows && adminUserRows.length > 0) {
        console.log('Admin user already exists.');
      } else {
        console.log('Could not verify admin user existence due to query result structure.');
      }
    }
  } catch (error) {
    console.error('Error during database initialization check:', error);
  }
}

// Interfaz para el resultado del diagnóstico de la IA 
interface DiagnosisAIResult {
  condition?: string;
  confidence?: number;
  description?: string;
  recomendaciones?: string[];
  pronostico?: {
    tiempo_recuperacion?: string;
    probabilidad_mejoria?: string;
  };
}

// Interfaz para los datos necesarios para crear un diagnóstico completo
interface AddDiagnosticoCompletoData {
  id_paciente: number;
  id_medico: number;
  tipoExamenNombre: string; 
  imageBase64?: string | null; 
  tipoImagen?: string | null; 
  originalFileName?: string | null; 
  diagnosisAIResult: DiagnosisAIResult; 
}

// Interfaz para los datos de un diagnóstico básico
interface AddDiagnosticoBasicoData {
    id_paciente: number;
    id_medico: number;
    tipoExamenNombre: string;
    resultado: string;
    nivel_confianza: number;
}


/**
 * Obtiene el ID de un tipo de examen a partir de su nombre.
 * @param nombre El nombre del tipo de examen.
 * @returns El ID del tipo de examen o null si no se encuentra.
 */
export async function getTipoExamenPorNombre(nombre: string): Promise<number | null> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log(`[DEBUG] getTipoExamenPorNombre - Buscando tipo: "${nombre}"`);

    // *** DEBUG: Obtener todos los tipos de examen primero ***
    const allTiposResult = await dbClient.sql('SELECT id_tipo_examen, nombre FROM tiposexamen');
    console.log('[DEBUG] getTipoExamenPorNombre - Tipos obtenidos de DB:', JSON.stringify(allTiposResult, null, 2));

    if (!Array.isArray(allTiposResult)) {
        console.error('[DEBUG] getTipoExamenPorNombre - El resultado de la DB no es un array.');
        return null;
    }

    // *** DEBUG: Filtrar en JavaScript (case-insensitive) ***
    const nombreLower = nombre.toLowerCase();
    const foundTipo = allTiposResult.find(tipo => 
        typeof tipo.nombre === 'string' && tipo.nombre.toLowerCase() === nombreLower
    );

    if (foundTipo && foundTipo.id_tipo_examen !== undefined) {
      console.log(`[DEBUG] getTipoExamenPorNombre - Coincidencia encontrada en JS: ID=${foundTipo.id_tipo_examen}, Nombre DB="${foundTipo.nombre}", Buscado="${nombre}"`);
      return Number(foundTipo.id_tipo_examen);
    } else {
      console.warn(`[DEBUG] getTipoExamenPorNombre - No se encontró coincidencia en JS para "${nombre}"`);
      // Loguear los nombres exactos para comparar
      allTiposResult.forEach(tipo => console.log(`  - Nombre en DB: "${tipo.nombre}" (lower: "${tipo.nombre?.toLowerCase()}")`));
      console.log(`  - Nombre buscado (lower): "${nombreLower}"`);
      return null;
    }

  } catch (error: any) {
    console.error(`Error en getTipoExamenPorNombre para '${nombre}':`, error.message, error.stack);
    throw error;
  }
}

/**
 * Añade un diagnóstico básico a la base de datos.
 * @param data Los datos para el diagnóstico básico.
 * @returns El ID del diagnóstico creado.
 */
export async function addDiagnosticoBasico(data: AddDiagnosticoBasicoData): Promise<number> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log('addDiagnosticoBasico - Datos recibidos:', data);

    const id_tipo_examen = await getTipoExamenPorNombre(data.tipoExamenNombre);
    if (id_tipo_examen === null) {
      throw new Error(`Tipo de examen '${data.tipoExamenNombre}' no encontrado. No se puede crear el diagnóstico básico.`);
    }
    console.log(`addDiagnosticoBasico - id_tipo_examen obtenido: ${id_tipo_examen}`);

    const params = [
      data.id_paciente,
      data.id_medico,
      id_tipo_examen,
      data.resultado,
      data.nivel_confianza, 
      'Completado' 
    ];
    console.log('addDiagnosticoBasico - Parámetros para INSERT en diagnosticos:', params);

    const insertResult = await dbClient.sql(
      `INSERT INTO diagnosticos (id_paciente, id_medico, id_tipo_examen, resultado, nivel_confianza, fecha_diagnostico, estado)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?) RETURNING id_diagnostico`,
      ...params 
    );

    let nuevoId: number | undefined;
    if (insertResult && Array.isArray(insertResult) && insertResult.length > 0 && insertResult[0].id_diagnostico !== undefined) {
        nuevoId = Number(insertResult[0].id_diagnostico);
    } else if (insertResult && (insertResult as any).id_diagnostico !== undefined) {
        nuevoId = Number((insertResult as any).id_diagnostico);
    } else {
        const lastIdResult = await dbClient.sql('SELECT last_insert_rowid() as id');
        if (lastIdResult && lastIdResult.length > 0 && lastIdResult[0].id !== undefined) {
            nuevoId = Number(lastIdResult[0].id);
        }
    }

    if (nuevoId === undefined) {
      throw new Error('No se pudo obtener el ID del diagnóstico básico insertado.');
    }
    console.log(`addDiagnosticoBasico - Diagnóstico básico guardado con ID: ${nuevoId}.`);
    return nuevoId;

  } catch (error: any) {
    console.error('Error en addDiagnosticoBasico:', error.message, error.stack);
    throw error;
  }
}


/**
 * Añade un diagnóstico completo a la base de datos, incluyendo la imagen y las recomendaciones.
 * @param data Los datos para el diagnóstico completo.
 * @returns El ID del diagnóstico creado.
 */
export async function addDiagnosticoCompleto(data: AddDiagnosticoCompletoData): Promise<number> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log('addDiagnosticoCompleto - Iniciando proceso para guardar diagnóstico completo.');
    console.log('addDiagnosticoCompleto - Datos recibidos:', JSON.stringify(data, null, 2));

    // *** LLAMADA A LA FUNCIÓN MODIFICADA ***
    const id_tipo_examen = await getTipoExamenPorNombre(data.tipoExamenNombre); 
    if (id_tipo_examen === null) {
      // El error ya se loguea dentro de getTipoExamenPorNombre si no se encuentra
      throw new Error(`Tipo de examen '${data.tipoExamenNombre}' no encontrado. No se puede crear el diagnóstico.`);
    }
    console.log(`addDiagnosticoCompleto - id_tipo_examen obtenido: ${id_tipo_examen}`);

    const resultadoDiagnostico = data.diagnosisAIResult.condition || data.diagnosisAIResult.description || 'No especificado';
    const nivelConfianza = data.diagnosisAIResult.confidence !== undefined ? data.diagnosisAIResult.confidence : 0; 

    const diagnosticoInsertParams = [
      data.id_paciente,
      data.id_medico,
      id_tipo_examen,
      resultadoDiagnostico,
      nivelConfianza,
      'Completado' 
    ];
    console.log('addDiagnosticoCompleto - Parámetros para INSERT en diagnosticos:', diagnosticoInsertParams);

    const insertDiagnosticoResult = await dbClient.sql(
      `INSERT INTO diagnosticos (id_paciente, id_medico, id_tipo_examen, resultado, nivel_confianza, fecha_diagnostico, estado)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?) RETURNING id_diagnostico`,
      ...diagnosticoInsertParams
    );

    let id_diagnostico: number | undefined;
    if (insertDiagnosticoResult && Array.isArray(insertDiagnosticoResult) && insertDiagnosticoResult.length > 0 && insertDiagnosticoResult[0].id_diagnostico !== undefined) {
        id_diagnostico = Number(insertDiagnosticoResult[0].id_diagnostico);
    } else if (insertDiagnosticoResult && (insertDiagnosticoResult as any).id_diagnostico !== undefined) {
        id_diagnostico = Number((insertDiagnosticoResult as any).id_diagnostico);
    } else {
        const lastIdResult = await dbClient.sql('SELECT last_insert_rowid() as id');
        if (lastIdResult && lastIdResult.length > 0 && lastIdResult[0].id !== undefined) {
            id_diagnostico = Number(lastIdResult[0].id);
        }
    }
    
    if (id_diagnostico === undefined) {
      throw new Error('No se pudo obtener el ID del diagnóstico insertado.');
    }
    console.log(`addDiagnosticoCompleto - Diagnóstico insertado con id_diagnostico: ${id_diagnostico}`);

    if (data.imageBase64 && data.tipoImagen) {
      const metadataImagen = {
        imageBase64Provided: !!data.imageBase64, 
        originalFileName: data.originalFileName || 'N/A',
        aiAnalysisDetails: { 
            condition: data.diagnosisAIResult.condition,
            confidence: data.diagnosisAIResult.confidence,
            description: data.diagnosisAIResult.description,
            pronostico: data.diagnosisAIResult.pronostico 
        }
      };
      
      const imagenUrlPlaceholder = `generated_image_for_diag_${id_diagnostico}.${data.tipoImagen.toLowerCase().replace('jpeg', 'jpg')}`;

      const imagenInsertParams = [
        id_diagnostico,
        data.tipoImagen, 
        imagenUrlPlaceholder, 
        JSON.stringify(metadataImagen) 
      ];
      console.log('addDiagnosticoCompleto - Parámetros para INSERT en imagenesmedicas:', imagenInsertParams);

      const insertImagenResult = await dbClient.sql(
        `INSERT INTO imagenesmedicas (id_diagnostico, tipo, url, metadata, fecha_carga)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) RETURNING id_imagen`,
        ...imagenInsertParams
      );
      
      let id_imagen_medica: number | undefined;
       if (insertImagenResult && Array.isArray(insertImagenResult) && insertImagenResult.length > 0 && insertImagenResult[0].id_imagen !== undefined) {
        id_imagen_medica = Number(insertImagenResult[0].id_imagen);
      } else if (insertImagenResult && (insertImagenResult as any).id_imagen !== undefined) {
        id_imagen_medica = Number((insertImagenResult as any).id_imagen);
      } else {
          const lastIdImgResult = await dbClient.sql('SELECT last_insert_rowid() as id');
          if (lastIdImgResult && lastIdImgResult.length > 0 && lastIdImgResult[0].id !== undefined) {
              id_imagen_medica = Number(lastIdImgResult[0].id);
          }
      }

      if (id_imagen_medica === undefined) {
        console.warn('addDiagnosticoCompleto - No se pudo obtener el ID de la imagen médica insertada. Continuando sin él.');
      } else {
        console.log(`addDiagnosticoCompleto - Imagen médica insertada con id_imagen: ${id_imagen_medica}`);
      }
    } else {
        console.log('addDiagnosticoCompleto - No se proporcionó imageBase64 o tipoImagen. Omitiendo inserción en imagenesmedicas.');
    }

    if (data.diagnosisAIResult.recomendaciones && data.diagnosisAIResult.recomendaciones.length > 0) {
      for (const descRecomendacion of data.diagnosisAIResult.recomendaciones) {
        if (!descRecomendacion) continue; 

        const recomendacionInsertParams = [
          id_diagnostico,
          descRecomendacion,
          'Media' 
        ];
        console.log('addDiagnosticoCompleto - Parámetros para INSERT en recomendaciones:', recomendacionInsertParams);

        const insertRecomendacionResult = await dbClient.sql(
          `INSERT INTO recomendaciones (id_diagnostico, descripcion, prioridad, fecha_creacion)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP) RETURNING id_recomendacion`,
          ...recomendacionInsertParams
        );
        
        let id_recomendacion: number | undefined;

        if (insertRecomendacionResult && Array.isArray(insertRecomendacionResult) && insertRecomendacionResult.length > 0 && insertRecomendacionResult[0].id_recomendacion !== undefined) {
            id_recomendacion = Number(insertRecomendacionResult[0].id_recomendacion);
        } else if (insertRecomendacionResult && (insertRecomendacionResult as any).id_recomendacion !== undefined) {
            id_recomendacion = Number((insertRecomendacionResult as any).id_recomendacion);
        } else {
            const lastIdRecResult = await dbClient.sql('SELECT last_insert_rowid() as id');
            if (lastIdRecResult && lastIdRecResult.length > 0 && lastIdRecResult[0].id !== undefined) {
                id_recomendacion = Number(lastIdRecResult[0].id);
            }
        }

        if (id_recomendacion === undefined) {
          console.warn(`addDiagnosticoCompleto - No se pudo obtener el ID de la recomendación para: ${descRecomendacion}. Omitiendo seguimiento.`);
          continue;
        }
        console.log(`addDiagnosticoCompleto - Recomendación insertada con id_recomendacion: ${id_recomendacion}`);

        const seguimientoInsertParams = [
          id_recomendacion,
          'Pendiente', 
          'Seguimiento inicial generado automáticamente.'
        ];
        console.log('addDiagnosticoCompleto - Parámetros para INSERT en seguimientorecomendaciones:', seguimientoInsertParams);

        await dbClient.sql(
          `INSERT INTO seguimientorecomendaciones (id_recomendacion, estado, notas, fecha_actualizacion)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
          ...seguimientoInsertParams
        );
        console.log(`addDiagnosticoCompleto - Seguimiento para recomendación ${id_recomendacion} insertado.`);
      }
    } else {
      console.log('addDiagnosticoCompleto - No hay recomendaciones para guardar.');
    }

    console.log(`addDiagnosticoCompleto - Proceso completado exitosamente para diagnóstico ID: ${id_diagnostico}`);
    return id_diagnostico;

  } catch (error: any) {
    console.error('Error en addDiagnosticoCompleto:', error.message, error.stack);
    throw error; 
  }
}


// ... (resto de las funciones: registerMedico, registerPacienteBasico, getUsers, addUser, getPacientes, searchPacientes, getUserByFirebaseUid, getUser, getDiagnosticos) ...
// Asegúrate que todas las llamadas a dbClient.sql() que usan '?' y pasan parámetros usen el spread operator (...) si son INSERT, UPDATE o DELETE.
// Para SELECT con WHERE, pasar el array directamente suele funcionar.

export const registerMedico = async (userData: {
  tipoDocumentoCodigo: string;
  paisCodigo: string;
  nui: string;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  correo: string;
  firebase_uid: string;
  id_especialidad: number;
  numero_tarjeta_profesional: string;
  años_experiencia?: number | null;
}): Promise<number> => {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log('registerMedico - DB connection obtained.');
    console.log('registerMedico - Input data:', JSON.stringify(userData, null, 2));

    const tipoDocumentoResult = await dbClient.sql(`SELECT id_tipo_documento FROM tiposdocumento WHERE UPPER(codigo) = UPPER(?)`, [userData.tipoDocumentoCodigo]);
    const idTipoDocumento = tipoDocumentoResult?.[0]?.id_tipo_documento;
    if (!idTipoDocumento) {
      throw new Error(`Tipo de documento con código '${userData.tipoDocumentoCodigo}' no encontrado.`);
    }
    console.log(`registerMedico - idTipoDocumento: ${idTipoDocumento}`);

    const paisResult = await dbClient.sql(`SELECT id_pais FROM paises WHERE UPPER(codigo) = UPPER(?)`, [userData.paisCodigo]);
    const idPais = paisResult?.[0]?.id_pais;
    if (!idPais) {
      throw new Error(`País con código '${userData.paisCodigo}' no encontrado.`);
    }
    console.log(`registerMedico - idPais: ${idPais}`);
    
    const userInsertParams = [
      idTipoDocumento,
      idPais,
      userData.nui,
      userData.primer_nombre,
      userData.segundo_nombre || null,
      userData.primer_apellido,
      userData.segundo_apellido || null,
      userData.correo,
      userData.firebase_uid, 
      'Activo'
    ];
    console.log('registerMedico - Params for INSERT usuarios:', JSON.stringify(userInsertParams, null, 2));

    const insertUserResult = await dbClient.sql(
      `INSERT INTO usuarios (id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id_usuario`,
      ...userInsertParams
    );
    console.log('registerMedico - insertUserResult from usuarios:', JSON.stringify(insertUserResult, null, 2));
    
    let newUserId: number | undefined;
    if (insertUserResult && Array.isArray(insertUserResult) && insertUserResult.length > 0 && insertUserResult[0].id_usuario !== undefined) {
        newUserId = Number(insertUserResult[0].id_usuario);
    } else if (insertUserResult && (insertUserResult as any).id_usuario !== undefined) { 
        newUserId = Number((insertUserResult as any).id_usuario);
    } else {
        const lastIdResult = await dbClient.sql('SELECT last_insert_rowid() as id');
        console.log('registerMedico - last_insert_rowid() result for usuarios:', JSON.stringify(lastIdResult, null, 2));
        const newUserIdValue = lastIdResult?.[0]?.id;
        if (newUserIdValue !== undefined && newUserIdValue !== null) {
            newUserId = Number(newUserIdValue);
        }
    }

    if (newUserId === undefined) {
      throw new Error('Failed to retrieve new user ID after user insertion in registerMedico.');
    }
    console.log(`registerMedico - newUserId: ${newUserId}`);

    const roleRows = await dbClient.sql(`SELECT id_rol FROM roles WHERE nombre = ?`, ['medico']);
    const medicoRoleId = roleRows?.[0]?.id_rol;
    if (!medicoRoleId) {
      throw new Error('Role \'medico\' not found');
    }
    console.log(`registerMedico - medicoRoleId: ${medicoRoleId}`);

    await dbClient.sql(`INSERT INTO usuariosroles (id_usuario, id_rol) VALUES (?, ?)`, ...[newUserId, medicoRoleId]);
    console.log('registerMedico - Medico role assigned in usuariosroles.');

    const medicoInsertParams = [
        newUserId,
        userData.id_especialidad,
        userData.numero_tarjeta_profesional,
        userData.años_experiencia || null,
    ];
    console.log('registerMedico - Params for INSERT medicos:', JSON.stringify(medicoInsertParams, null, 2));
    await dbClient.sql(
      `INSERT INTO medicos (id_usuario, id_especialidad, numero_tarjeta_profesional, fecha_ingreso, años_experiencia) 
       VALUES (?, ?, ?, DATE('now'), ?)`,
      ...medicoInsertParams
    );
    console.log('registerMedico - Medico details inserted into medicos table.');

    return newUserId;
  } catch (error: any) {
    console.error('Error in registerMedico:', error.message, error.stack);
    throw error;
  }
};


export const registerPacienteBasico = async (paciente: {
  tipoDocumentoCodigo: string;
  paisCodigo: string;
  primer_nombre: string;
  primer_apellido: string;
  correo: string; 
  nui?: string; 
  segundo_nombre?: string | null;
  segundo_apellido?: string | null;
  firebase_uid?: string | null; 
}): Promise<number> => {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection(); 
    if (clientInitializationTimestamp) {
        console.log(`registerPacienteBasico - Using client initialized at ${new Date(clientInitializationTimestamp).toISOString()}`);
    } else {
        console.warn('registerPacienteBasico - Client initialization timestamp not found. Possible issue with client management.');
    }
    console.log('registerPacienteBasico - DB connection obtained.');
    console.log('registerPacienteBasico - Input data (firebase_uid will be ignored):', JSON.stringify(paciente, null, 2));

    console.log(`registerPacienteBasico - Fetching all tiposdocumento to filter for codigo: "${paciente.tipoDocumentoCodigo}"`);
    const allTiposDocumentoResult = await dbClient.sql('SELECT id_tipo_documento, codigo, descripcion, estado FROM tiposdocumento');

    let idTipoDocumento: number | undefined;
    if (Array.isArray(allTiposDocumentoResult)) {
        const foundTipoDoc = allTiposDocumentoResult.find(doc => doc.codigo === paciente.tipoDocumentoCodigo);
        if (foundTipoDoc) {
            idTipoDocumento = foundTipoDoc.id_tipo_documento;
            console.log(`registerPacienteBasico - Found tipoDocumento in-app: id=${idTipoDocumento}, codigo=${foundTipoDoc.codigo}`);
        }
    } else {
        console.warn('registerPacienteBasico - allTiposDocumentoResult is not an array. Cannot filter.');
    }
    
    if (!idTipoDocumento) {
      console.error(`registerPacienteBasico - Tipo de documento con código '${paciente.tipoDocumentoCodigo}' NO encontrado después de filtrar en la aplicación.`);
      throw new Error(`Tipo de documento con código '${paciente.tipoDocumentoCodigo}' no encontrado.`);
    }
    console.log(`registerPacienteBasico - Successfully determined idTipoDocumento: ${idTipoDocumento}`);

    console.log(`registerPacienteBasico - Fetching all paises to filter for codigo: "${paciente.paisCodigo}"`);
    const allPaisesResult = await dbClient.sql('SELECT id_pais, codigo, nombre, estado FROM paises');

    let idPais: number | undefined;
    if (Array.isArray(allPaisesResult)) {
        const foundPais = allPaisesResult.find(p => p.codigo === paciente.paisCodigo);
        if (foundPais) {
            idPais = foundPais.id_pais;
            console.log(`registerPacienteBasico - Found pais in-app: id=${idPais}, codigo=${foundPais.codigo}`);
        }
    } else {
        console.warn('registerPacienteBasico - allPaisesResult is not an array. Cannot filter.');
    }

    if (!idPais) {
      console.error(`registerPacienteBasico - País con código '${paciente.paisCodigo}' NO encontrado después de filtrar en la aplicación.`);
      throw new Error(`País con código '${paciente.paisCodigo}' no encontrado.`);
    }
    console.log(`registerPacienteBasico - Successfully determined idPais: ${idPais}`);

    const nuiToInsert = paciente.nui || `PACIENTE_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`registerPacienteBasico - nuiToInsert: ${nuiToInsert}`);

    const columns = ['id_tipo_documento', 'id_pais', 'nui', 'primer_nombre', 'primer_apellido', 'correo', 'estado'];
    const finalUserInsertParams: any[] = [
        idTipoDocumento,
        idPais,
        nuiToInsert,
        paciente.primer_nombre,
        paciente.primer_apellido,
        paciente.correo,
        'Activo' 
    ];

    const placeholders = columns.map(() => '?').join(', ');
    const columnNames = columns.join(', ');
    
    const insertUserQuery = `INSERT INTO usuarios (${columnNames}) VALUES (${placeholders}) RETURNING id_usuario`;

    console.log('registerPacienteBasico - Query for INSERT usuarios (Simplified):', insertUserQuery);
    console.log('registerPacienteBasico - Params for INSERT usuarios:', JSON.stringify(finalUserInsertParams, null, 2));
    console.log(`registerPacienteBasico - Number of columns in query: ${columns.length}`);
    const actualPlaceholderCount = (insertUserQuery.match(/\?/g) || []).length;
    console.log(`registerPacienteBasico - Number of placeholders in string: ${actualPlaceholderCount}`);
    console.log(`registerPacienteBasico - Number of parameters provided: ${finalUserInsertParams.length}`);
    
    if (columns.length !== actualPlaceholderCount || columns.length !== finalUserInsertParams.length) {
        const countErrorMsg = `CRITICAL MISMATCH: Columns=${columns.length}, Placeholders=${actualPlaceholderCount}, Params=${finalUserInsertParams.length}`;
        console.error(countErrorMsg);
        throw new Error(countErrorMsg); 
    }
    
    const insertUserResult = await dbClient.sql(insertUserQuery, ...finalUserInsertParams); 
    console.log('registerPacienteBasico - insertUserResult from usuarios (Simplified with RETURNING, using spread operator):', JSON.stringify(insertUserResult, null, 2));
    
    let newUserId: number | undefined;
    if (insertUserResult && Array.isArray(insertUserResult) && insertUserResult.length > 0 && insertUserResult[0].id_usuario !== undefined) {
        newUserId = Number(insertUserResult[0].id_usuario);
    } else if (insertUserResult && (insertUserResult as any).id_usuario !== undefined) { 
        newUserId = Number((insertUserResult as any).id_usuario);
    } else if (insertUserResult && (insertUserResult as any).rows && Array.isArray((insertUserResult as any).rows) && (insertUserResult as any).rows.length > 0 && (insertUserResult as any).rows[0].id_usuario !== undefined) { 
        newUserId = Number((insertUserResult as any).rows[0].id_usuario);
    } else {
        console.log('registerPacienteBasico - RETURNING did not yield user ID as expected, trying last_insert_rowid().');
        const lastIdResult = await dbClient.sql('SELECT last_insert_rowid() as id');
        console.log('registerPacienteBasico - last_insert_rowid() result for usuarios:', JSON.stringify(lastIdResult, null, 2));
        if (lastIdResult && Array.isArray(lastIdResult) && lastIdResult.length > 0 && lastIdResult[0].id !== undefined) {
            newUserId = Number(lastIdResult[0].id);
        } else {
            console.warn('registerPacienteBasico - Could not extract last_insert_rowid() using standard key or fallback.');
        }
    }

    if (newUserId === undefined) {
      throw new Error('Failed to retrieve new user ID after insertion using RETURNING or last_insert_rowid().');
    }
    console.log(`registerPacienteBasico - newUserId: ${newUserId}`);

    const roleResult = await dbClient.sql(`SELECT id_rol FROM roles WHERE nombre = ?`, ['paciente']);
    const roleId = roleResult?.[0]?.id_rol;
    if (!roleId) {
      throw new Error('Role \'paciente\' not found');
    }
    console.log(`registerPacienteBasico - roleId for paciente: ${roleId}`);

    await dbClient.sql(`INSERT INTO usuariosroles (id_usuario, id_rol) VALUES (?, ?)`, ...[newUserId, roleId]);
    console.log('registerPacienteBasico - Paciente role assigned in usuariosroles.');

    return newUserId;
  } catch (error: any) {
    console.error('Error in registerPacienteBasico:', error.message, error.stack); 
    throw error; 
  }
};

export const getUsers = async (): Promise<any[]> => {
  // Lógica de getUsers... (sin cambios)
  try {
    const dbClient = await getConnection();
    const result = await dbClient.sql('SELECT * FROM usuarios');
    return result || []; 
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

export const addUser = async (user: {
  tipoDocumentoCodigo: string;
  paisCodigo: string;
  nui: string;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  correo: string;
  firebase_uid: string; 
  rol?: string;
}): Promise<void> => {
  // Lógica de addUser... (sin cambios)
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log('addUser - Input data:', JSON.stringify(user, null, 2));

    const allTiposDoc = await dbClient.sql('SELECT id_tipo_documento, codigo FROM tiposdocumento');
    const foundTipoDoc = Array.isArray(allTiposDoc) ? allTiposDoc.find(doc => doc.codigo === user.tipoDocumentoCodigo) : null;
    const idTipoDocumento = foundTipoDoc?.id_tipo_documento;
    if (!idTipoDocumento) {
      throw new Error(`addUser - Tipo de documento con código '${user.tipoDocumentoCodigo}' no encontrado.`);
    }

    const allPaises = await dbClient.sql('SELECT id_pais, codigo FROM paises');
    const foundPais = Array.isArray(allPaises) ? allPaises.find(p => p.codigo === user.paisCodigo) : null;
    const idPais = foundPais?.id_pais;
    if (!idPais) {
      throw new Error(`addUser - País con código '${user.paisCodigo}' no encontrado.`);
    }

    const userInsertParams = [
      idTipoDocumento,
      idPais,
      user.nui,
      user.primer_nombre,
      user.segundo_nombre || null,
      user.primer_apellido,
      user.segundo_apellido || null,
      user.correo,
      user.firebase_uid, 
      'Activo'
    ];
    console.log('addUser - Params for INSERT usuarios:', JSON.stringify(userInsertParams, null, 2));

    const insertUserResult = await dbClient.sql(
      `INSERT INTO usuarios (id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id_usuario`,
      ...userInsertParams
    );
    console.log('addUser - insertUserResult from usuarios:', JSON.stringify(insertUserResult, null, 2));
    
    let newUserId: number | undefined;
    if (insertUserResult && Array.isArray(insertUserResult) && insertUserResult.length > 0 && insertUserResult[0].id_usuario !== undefined) {
        newUserId = Number(insertUserResult[0].id_usuario);
    } else if (insertUserResult && (insertUserResult as any).id_usuario !== undefined) {
        newUserId = Number((insertUserResult as any).id_usuario);
    } else {
        const lastIdResult = await dbClient.sql('SELECT last_insert_rowid() as id');
        const newUserIdValue = lastIdResult?.[0]?.id;
        if (newUserIdValue !== undefined && newUserIdValue !== null) {
            newUserId = Number(newUserIdValue);
        }
    }

    if (newUserId === undefined) {
        throw new Error('Failed to retrieve new user ID after user insertion in addUser.');
    }
    console.log(`addUser - newUserId: ${newUserId}`);

    const roleNameToSearch = user.rol || 'paciente'; 
    const roleRows = await dbClient.sql(`SELECT id_rol FROM roles WHERE nombre = ?`, [roleNameToSearch]);
    const roleId = roleRows?.[0]?.id_rol;

    if (!roleId) {
        throw new Error(`Role '${roleNameToSearch}' not found for user ${newUserId}`);
    }
    
    await dbClient.sql(`INSERT INTO usuariosroles (id_usuario, id_rol) VALUES (?, ?)`, ...[newUserId, roleId]);
    console.log(`addUser - Role '${roleNameToSearch}' assigned to user ${newUserId}.`);

  } catch (error: any) {
    console.error('Error adding user (full):', error.message, error.stack);
    throw error;
  }
};


export const getPacientes = async (): Promise<any[]> => {
  // Lógica de getPacientes... (sin cambios)
  try {
    const dbClient = await getConnection();
    const result = await dbClient.sql(`
      SELECT
        p.id_usuario, 
        u.primer_nombre,
        u.segundo_nombre,
        u.primer_apellido,
        u.segundo_apellido,
        u.correo,
        u.fecha_registro AS fecha_registro_usuario,
        u.nui,
        td.descripcion AS tipo_documento,
        pa.nombre AS pais,
        p.grupo_sanguineo,
        p.alergias,
        p.antecedentes_medicos,
        p.telefono_contacto, 
        p.direccion_residencial,
        p.fecha_nacimiento,
        p.genero,
        p.ocupacion,
        p.info_seguro_medico,
        p.contacto_emergencia,
        p.historial_visitas
      FROM pacientes p
      JOIN usuarios u ON p.id_usuario = u.id_usuario
      LEFT JOIN tiposdocumento td ON u.id_tipo_documento = td.id_tipo_documento
      LEFT JOIN paises pa ON u.id_pais = pa.id_pais
    `);
    return result || [];
  } catch (error) {
    console.error('Error getting patients:', error);
    return [];
  }
};

/**
 * Busca pacientes en la base de datos por término de búsqueda (NUI, nombre, apellido).
 * @param searchTerm El término a buscar.
 * @returns Una promesa que resuelve a un array de pacientes que coinciden.
 */
export async function searchPacientes(searchTerm: string): Promise<SearchedPatient[]> {
  let dbClient: Database | undefined;
  const likeTerm = `%${searchTerm}%`; 
  const query = `
      SELECT 
        u.id_usuario, 
        u.primer_nombre, 
        u.primer_apellido, 
        u.nui 
      FROM usuarios u
      JOIN usuariosroles ur ON u.id_usuario = ur.id_usuario
      JOIN roles r ON ur.id_rol = r.id_rol
      WHERE r.nombre = 'paciente'  
      AND (
        LOWER(u.nui) LIKE LOWER(?) OR       
        LOWER(u.primer_nombre) LIKE LOWER(?) OR 
        LOWER(u.primer_apellido) LIKE LOWER(?)  
      )
      LIMIT 10; 
    `;
  const params = [likeTerm, likeTerm, likeTerm]; 

  try {
    dbClient = await getConnection();
    console.log(`searchPacientes - Buscando pacientes con término: ${searchTerm}`);
    
    const result = await dbClient.sql(query, ...params);
    
    console.log(`searchPacientes - Encontrados ${result?.length || 0} resultados para "${searchTerm}"`);
    
    const mappedResult: SearchedPatient[] = (result || []).map((row: any) => ({
        id_usuario: Number(row.id_usuario),
        primer_nombre: row.primer_nombre,
        primer_apellido: row.primer_apellido,
        nui: row.nui
    }));

    return mappedResult;

  } catch (error: any) {
    console.error('Error en searchPacientes:', error.message, error.stack);
    if (error.message.toLowerCase().includes('parameter') || error.message.toLowerCase().includes('binding')) {
        console.error('searchPacientes - Posible error de binding. Query:', query, 'Params:', params); 
    }
    throw error; 
  }
}


export const getUserByFirebaseUid = async (firebaseUid: string): Promise<any | null> => {
  // Lógica de getUserByFirebaseUid... (sin cambios)
  try {
    const dbClient = await getConnection();
    const userResult = await dbClient.sql(
      `SELECT u.id_usuario, u.id_tipo_documento, u.id_pais, u.nui, u.primer_nombre, u.segundo_nombre, u.primer_apellido, u.segundo_apellido, u.correo, u.fecha_registro, u.ultima_actividad, u.estado, u.firebase_uid 
       FROM usuarios u 
       WHERE u.firebase_uid = ?`,
      [firebaseUid] 
    );
    const user = userResult?.[0];

    if (!user) {
      return null;
    }

    const roleResult = await dbClient.sql(
      `SELECT r.nombre FROM roles r JOIN usuariosroles ur ON r.id_rol = ur.id_rol WHERE ur.id_usuario = ?`,
      [user.id_usuario]
    );
    const roles = roleResult?.map((row: { nombre: string }) => row.nombre) || [];

    return { ...user, roles };
  } catch (error: any) {
    console.error('Error al obtener usuario por Firebase UID:', error.message, error.stack);
    return null;
  }
};

export const getUser = async (email: string): Promise<any | null> => {
  // Lógica de getUser... (sin cambios)
  try {
    const dbClient = await getConnection();
    console.log(`Attempting to find user with email: ${email}`);

    const allUsersResult = await dbClient.sql(
      `SELECT id_usuario, id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, fecha_registro, ultima_actividad, estado, firebase_uid FROM usuarios`
    );

    console.log('Fetched all users result type:', typeof allUsersResult);

    let allUsers: any[] = [];

    if (Array.isArray(allUsersResult)) {
      allUsers = allUsersResult;
    } else if (allUsersResult && typeof allUsersResult === 'object') {
      if (Array.isArray((allUsersResult as any).rows)) {
        allUsers = (allUsersResult as any).rows;
      } else if (Array.isArray((allUsersResult as any)._rows)) { 
        allUsers = (allUsersResult as any)._rows;
      } else if (Symbol.iterator in Object(allUsersResult)) { 
        allUsers = Array.from(allUsersResult as any);
      } else {
        console.warn("Unexpected structure for allUsersResult. Cannot iterate or find .rows/_rows. Assuming empty or failed fetch if not an array.");
      }
    } else {
        console.log('allUsersResult is null or not an array/object, treating as no users found.');
    }

    console.log(`Total users fetched for filtering: ${allUsers.length}`);
    const user = allUsers.find(u => u.correo === email);

    if (!user) {
      console.log(`User with email ${email} not found in fetched list.`);
      return null;
    }

    console.log('User found after filtering:', user);

    const roleResult = await dbClient.sql(
      `SELECT r.nombre FROM roles r JOIN usuariosroles ur ON r.id_rol = ur.id_rol WHERE ur.id_usuario = ?`,
      [user.id_usuario]
    );
    const roles = roleResult?.map((row: { nombre: string }) => row.nombre) || [];

    return { ...user, roles };
  } catch (error: any) {
    console.error('Error al obtener usuario por email (filtrando en app):', error.message, error.stack);
    return null;
  }
};

export async function getDiagnosticos(): Promise<any[]> {
  // Lógica de getDiagnosticos... (sin cambios)
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log('getDiagnosticos - Obteniendo todos los diagnósticos.');
    const result = await dbClient.sql(`
      SELECT 
        d.id_diagnostico,
        d.id_paciente,
        up.primer_nombre || ' ' || up.primer_apellido AS nombre_paciente,
        d.id_medico,
        um.primer_nombre || ' ' || um.primer_apellido AS nombre_medico,
        d.id_tipo_examen,
        te.nombre AS nombre_tipo_examen,
        d.resultado,
        d.nivel_confianza,
        d.fecha_diagnostico,
        d.estado
      FROM diagnosticos d
      LEFT JOIN usuarios up ON d.id_paciente = up.id_usuario
      LEFT JOIN usuarios um ON d.id_medico = um.id_usuario
      LEFT JOIN tiposexamen te ON d.id_tipo_examen = te.id_tipo_examen
      ORDER BY d.fecha_diagnostico DESC
    `);
    console.log(`getDiagnosticos - Se encontraron ${result?.length || 0} diagnósticos.`);
    return result || [];
  } catch (error: any) {
    console.error('Error en getDiagnosticos:', error.message, error.stack);
    throw error;
  }
}

