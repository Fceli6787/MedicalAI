import { Database } from '@sqlitecloud/drivers';
import fs from 'fs';
import path from 'path';

// --- Interfaz para el resultado de la búsqueda (debe coincidir con el frontend) ---
export interface SearchedPatient {
  id_usuario: number;
  primer_nombre: string;
  primer_apellido: string;
  nui: string;
}

// --- Interfaces para el detalle del diagnóstico ---
export interface DiagnosticoDetalladoRecomendacion {
  id_recomendacion: number;
  descripcion: string;
  prioridad: string;
  fecha_creacion: string;
}

export interface DiagnosticoDetallado {
  id_diagnostico: number;
  id_paciente: number;
  nombre_paciente: string | null;
  nui_paciente: string | null;
  id_medico: number;
  nombre_medico: string | null;
  id_tipo_examen: number;
  nombre_tipo_examen: string | null;
  resultado: string;
  nivel_confianza: number;
  fecha_diagnostico: string;
  estado_diagnostico: string;
  ai_descripcion_detallada: string | null;
  ai_pronostico_tiempo_recuperacion: string | null;
  ai_pronostico_probabilidad_mejoria: string | null;
  imagen_url: string | null; // Puede ser Base64 o nombre de archivo (según estrategia)
  imagen_tipo: string | null; // Ej: "PNG", "JPG"
  recomendaciones: DiagnosticoDetalladoRecomendacion[];
}

// --- ¡IMPORTANTE! AJUSTA ESTA RUTA BASE SI ES NECESARIO ---
// Define la ruta base donde se almacenarán tus imágenes de diagnóstico en el servidor.
// Esta ruta debe ser accesible por tu proceso Node.js para escritura.
// Debe coincidir con IMAGES_BASE_PATH en tu API GET.
const DIAGNOSTIC_IMAGES_SERVER_PATH = path.join(process.cwd(), 'private_uploads', 'diagnostic_images');

let client: Database | null = null;
let clientInitializationTimestamp: number | null = null;

// Obtiene o crea una instancia del cliente de base de datos
const getClient = async (): Promise<Database> => {
  const now = Date.now();
  if (client && clientInitializationTimestamp) {
    try {
      // Prueba la conexión existente
      await client.sql('SELECT 1 AS test_query_on_reused_client');
      console.log(`getClient - Reusing existing client initialized at ${new Date(clientInitializationTimestamp).toISOString()}.`);
      return client;
    } catch (testError: any) {
      console.warn(`getClient - Existing client FAILED test query. Error: ${testError.message}. Re-initializing client.`);
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
    console.log(`getClient - New SQLite Cloud client created at ${new Date(clientInitializationTimestamp).toISOString()}. Testing connection...`);
    await client.sql('SELECT 1 AS test_query_on_new_client'); // Prueba la nueva conexión
    console.log('getClient - SQLite Cloud client connected and responsive.');
    return client;
  } catch (error) {
    console.error('Error connecting to SQLite Cloud (during new client creation):', error);
    client = null;
    clientInitializationTimestamp = null;
    throw error;
  }
};

// Función pública para obtener la conexión
export async function getConnection() {
  return getClient();
}

// Inicialización de la base de datos (roles, admin user, etc.)
export async function init() {
  if (typeof window !== 'undefined') { // No ejecutar en el cliente
    return;
  }
  try {
    const dbClient = await getClient();
    console.log('Database connected for init');

    // Verifica si las tablas existen (ejemplo con 'roles')
    const tablesExistResult = await dbClient.sql(`SELECT name FROM sqlite_master WHERE type='table' AND name='roles'`);
    const tablesExist = tablesExistResult && tablesExistResult.length > 0;

    if (!tablesExist) {
      console.error('Tables do not exist. Database initialization logic expects tables to be pre-created.');
      // Aquí podrías añadir lógica para crear tablas si es necesario, o lanzar un error.
      return;
    }

    console.log('Tables exist, checking roles and admin user.');
    // Asegurar roles
    const rolesToEnsure = ['admin', 'medico', 'paciente'];
    for (const roleName of rolesToEnsure) {
      const roleRows = await dbClient.sql(`SELECT id_rol FROM roles WHERE nombre = ?`, [roleName]);
      if (roleRows && roleRows.length === 0) {
        await dbClient.sql(`INSERT INTO roles (nombre) VALUES (?)`, [roleName]);
        console.log(`Rol '${roleName}' creado.`);
      }
    }

    // Crear usuario admin si no existe
    const adminEmail = 'admin@example.com';
    const adminUid = 'ADMIN_FIREBASE_UID'; // UID de Firebase para el admin
    const adminRole = 'admin';

    const adminUserRows = await dbClient.sql(`SELECT id_usuario FROM usuarios WHERE correo = ?`, [adminEmail]);
    if (adminUserRows && adminUserRows.length === 0) {
      const tipoDocumentoResult = await dbClient.sql(`SELECT id_tipo_documento FROM tiposdocumento WHERE codigo = 'CC'`);
      const idTipoDocumento = tipoDocumentoResult?.[0]?.id_tipo_documento;

      const paisResult = await dbClient.sql(`SELECT id_pais FROM paises WHERE codigo = 'COL'`);
      const idPais = paisResult?.[0]?.id_pais;

      if (!idTipoDocumento || !idPais) {
        console.error('Could not find default tiposdocumento or paises for admin user creation.');
      } else {
        const insertResult = await dbClient.sql(
          `INSERT INTO usuarios (id_tipo_documento, id_pais, nui, primer_nombre, primer_apellido, correo, firebase_uid, estado)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo') RETURNING id_usuario`,
          idTipoDocumento, idPais, '0000000000', 'Admin', 'User', adminEmail, adminUid
        );

        let adminUserId: number | undefined;
        // El driver puede devolver el ID de diferentes maneras
        if (insertResult && Array.isArray(insertResult) && insertResult.length > 0 && insertResult[0].id_usuario !== undefined) {
          adminUserId = Number(insertResult[0].id_usuario);
        } else if (insertResult && (insertResult as any).id_usuario !== undefined) { // Para algunos drivers
          adminUserId = Number((insertResult as any).id_usuario);
        } else { // Fallback a last_insert_rowid()
          const lastIdResult = await dbClient.sql('SELECT last_insert_rowid() as id');
          const adminUserIdValue = lastIdResult?.[0]?.id;
          if (adminUserIdValue !== undefined && adminUserIdValue !== null) {
            adminUserId = Number(adminUserIdValue);
          }
        }

        if (adminUserId) {
          await dbClient.sql(`INSERT INTO usuariosroles (id_usuario, id_rol) VALUES (?, (SELECT id_rol FROM roles WHERE nombre = ?))`, adminUserId, adminRole);
          console.log('Admin user and role assignment created.');
        } else {
          console.error('Failed to retrieve new admin user ID. Admin user role not assigned.');
        }
      }
    } else if (adminUserRows && adminUserRows.length > 0) {
      console.log('Admin user already exists.');
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
  recomendaciones?: string[]; // Nombres de las recomendaciones
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
  imageBase64?: string | null;      // String Base64 puro de la imagen
  tipoImagen?: string | null;        // Ej: "PNG", "JPG"
  originalFileName?: string | null;
  diagnosisAIResult: DiagnosisAIResult;
}

// Obtiene el ID de un tipo de examen por su nombre
export async function getTipoExamenPorNombre(nombre: string): Promise<number | null> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    const nombreNormalizado = nombre.toLowerCase().trim();
    console.log(`[DEBUG getTipoExamenPorNombre] Buscando tipo de examen para nombre: '${nombre}' (normalizado: '${nombreNormalizado}')`);
    
    // Primero intentamos buscar el tipo de examen exacto
    const allTiposResult = await dbClient.sql('SELECT id_tipo_examen, nombre FROM tiposexamen');

    if (!Array.isArray(allTiposResult)) {
      console.warn('[DEBUG getTipoExamenPorNombre] No se pudo obtener la lista de tipos de examen');
      return null;
    }

    // Primero buscamos una coincidencia exacta
    const foundTipo = allTiposResult.find(tipo =>
        typeof tipo.nombre === 'string' && tipo.nombre.toLowerCase().trim() === nombreNormalizado
    );

    if (foundTipo) {
      console.log(`[DEBUG getTipoExamenPorNombre] Encontrada coincidencia exacta con ID: ${foundTipo.id_tipo_examen}`);
      return Number(foundTipo.id_tipo_examen);
    }

    // Si no hay coincidencia exacta, verificamos si es una variante de "otro"
    const esVarianteOtro = ['otro', 'otra', 'otros', 'otras', 'other'].includes(nombreNormalizado);
    
    if (esVarianteOtro) {
      console.log('[DEBUG getTipoExamenPorNombre] El nombre es una variante de "otro", buscando tipo genérico "Otro"');
      
      // Buscamos si ya existe un tipo "Otro" (considerando variaciones)
      const otroTipo = allTiposResult.find(tipo =>
          typeof tipo.nombre === 'string' && ['otro', 'otra', 'otros', 'otras', 'other']
          .includes(tipo.nombre.toLowerCase().trim())
      );

      if (otroTipo) {
        console.log(`[DEBUG getTipoExamenPorNombre] Encontrado tipo "Otro" existente con ID: ${otroTipo.id_tipo_examen}`);
        return Number(otroTipo.id_tipo_examen);
      }

      // Si no existe, lo creamos
      console.log('[DEBUG getTipoExamenPorNombre] Creando nuevo tipo "Otro"');
      const insertResult = await dbClient.sql(
        'INSERT INTO tiposexamen (nombre, descripcion, estado) VALUES (?, ?, ?) RETURNING id_tipo_examen',
        'Otro',
        'Otros tipos de exámenes no categorizados',
        'Activo'
      );

      // Intentar obtener el ID del nuevo registro
      let nuevoId: number | undefined;
      
      if (insertResult && Array.isArray(insertResult) && insertResult.length > 0 && insertResult[0].id_tipo_examen) {
        nuevoId = Number(insertResult[0].id_tipo_examen);
      }

      if (!nuevoId) {
        const lastIdResult = await dbClient.sql('SELECT last_insert_rowid() as id');
        if (lastIdResult && lastIdResult.length > 0 && lastIdResult[0].id !== undefined) {
          nuevoId = Number(lastIdResult[0].id);
        }
      }

      if (nuevoId) {
        console.log(`[DEBUG getTipoExamenPorNombre] Creado nuevo tipo "Otro" con ID: ${nuevoId}`);
        return nuevoId;
      }
    }

    console.warn(`[DEBUG getTipoExamenPorNombre] No se encontró coincidencia para '${nombre}' y no es una variante de "otro"`);
    return null;
  } catch (error: any) {
    console.error(`[ERROR getTipoExamenPorNombre] Error para '${nombre}':`, error.message);
    throw error;
  }
}

// Añade un diagnóstico completo (incluyendo imagen Base64 y recomendaciones)
export async function addDiagnosticoCompleto(data: AddDiagnosticoCompletoData): Promise<number> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log('addDiagnosticoCompleto - Iniciando proceso.');
    console.log('addDiagnosticoCompleto - Datos (imageBase64 omitido si es largo):', {
        ...data, imageBase64: data.imageBase64 ? `[Base64 de ${data.imageBase64.length} caracteres]` : null
    });

    const id_tipo_examen = await getTipoExamenPorNombre(data.tipoExamenNombre);
    if (id_tipo_examen === null) {
      throw new Error(`Tipo de examen '${data.tipoExamenNombre}' no encontrado.`);
    }

    const resultadoDiagnostico = data.diagnosisAIResult.condition || data.diagnosisAIResult.description || 'No especificado';
    // Asumiendo que confidence de AI viene como 0-100, convertir a 0-1 para la BD
    const nivelConfianza = data.diagnosisAIResult.confidence !== undefined ? (data.diagnosisAIResult.confidence / 100) : 0;

    const diagnosticoInsertParams = [
      data.id_paciente, data.id_medico, id_tipo_examen,
      resultadoDiagnostico, nivelConfianza, 'Completado'
    ];

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
    console.log(`addDiagnosticoCompleto - Diagnóstico insertado con ID: ${id_diagnostico}`);

    // --- MODIFICACIÓN PARA GUARDAR IMAGEN COMO ARCHIVO Y REFERENCIA EN BD ---
    let nombreArchivoGuardado: string | null = null;

    if (data.imageBase64 && data.tipoImagen) {
      // Limpiar el prefijo del Base64 si existe (ej. "data:image/png;base64,")
      const base64Data = data.imageBase64.includes(',')
                          ? data.imageBase64.split(',')[1]
                          : data.imageBase64;
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Generar un nombre de archivo único
      const fileExtension = data.tipoImagen.toLowerCase();
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      nombreArchivoGuardado = `diag_${id_diagnostico}_${uniqueSuffix}.${fileExtension}`;
      const filePath = path.join(DIAGNOSTIC_IMAGES_SERVER_PATH, nombreArchivoGuardado);

      // Asegurarse de que el directorio exista
      if (!fs.existsSync(DIAGNOSTIC_IMAGES_SERVER_PATH)) {
        fs.mkdirSync(DIAGNOSTIC_IMAGES_SERVER_PATH, { recursive: true });
        console.log(`addDiagnosticoCompleto - Creado directorio de imágenes: ${DIAGNOSTIC_IMAGES_SERVER_PATH}`);
      }

      fs.writeFileSync(filePath, imageBuffer);
      console.log(`addDiagnosticoCompleto - Imagen guardada en servidor como: ${filePath}`);

      const metadataImagen = {
        originalFileName: data.originalFileName || nombreArchivoGuardado, // Guardar el nombre original o el generado
        aiAnalysisDetails: data.diagnosisAIResult
      };

      const imagenInsertParams = [
        id_diagnostico,
        data.tipoImagen,
        nombreArchivoGuardado, // Guardar el NOMBRE DEL ARCHIVO en la columna 'url'
        JSON.stringify(metadataImagen)
      ];

      await dbClient.sql(
        `INSERT INTO imagenesmedicas (id_diagnostico, tipo, url, metadata, fecha_carga)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        ...imagenInsertParams
      );
      console.log(`addDiagnosticoCompleto - Registro de imagen para ID ${id_diagnostico} guardado. URL en BD: ${nombreArchivoGuardado}`);
    } else {
      console.log('addDiagnosticoCompleto - No imageBase64 o tipoImagen. Omitiendo inserción en imagenesmedicas.');
    }
    // --- FIN DE MODIFICACIÓN ---

    if (data.diagnosisAIResult.recomendaciones && data.diagnosisAIResult.recomendaciones.length > 0) {
      for (const descRecomendacion of data.diagnosisAIResult.recomendaciones) {
        if (!descRecomendacion) continue;
        const prioridadRecomendacion = 'Media';
        await dbClient.sql(
          `INSERT INTO recomendaciones (id_diagnostico, descripcion, prioridad, fecha_creacion)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
          id_diagnostico, descRecomendacion, prioridadRecomendacion
        );
      }
      console.log(`addDiagnosticoCompleto - ${data.diagnosisAIResult.recomendaciones.length} recomendaciones guardadas.`);
    }
    return id_diagnostico;
  } catch (error: any) {
    console.error('Error en addDiagnosticoCompleto:', error.message, error.stack);
    throw error;
  }
}

// Obtiene todos los diagnósticos con información básica y URL de imagen
export async function getDiagnosticos(): Promise<any[]> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log('getDiagnosticos - Obteniendo todos los diagnósticos con URL de imagen.');
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
        d.estado,
        im.url AS imagen_url,
        im.tipo AS imagen_tipo
      FROM diagnosticos d
      LEFT JOIN usuarios up ON d.id_paciente = up.id_usuario
      LEFT JOIN usuarios um ON d.id_medico = um.id_usuario
      LEFT JOIN tiposexamen te ON d.id_tipo_examen = te.id_tipo_examen
      LEFT JOIN imagenesmedicas im ON d.id_diagnostico = im.id_diagnostico
      ORDER BY d.fecha_diagnostico DESC
    `);

    if (result && result.length > 0) {
        result.forEach((diag: any, index: number) => {
            if (diag.imagen_url && typeof diag.imagen_url === 'string') {
                console.log(`[DEBUG] getDiagnosticos - Diagnóstico ${index} (ID: ${diag.id_diagnostico}), imagen_url (primeros 60 chars): ${diag.imagen_url.substring(0,60)}... Tipo: ${diag.imagen_tipo}`);
            } else if (diag.imagen_url) {
                console.log(`[DEBUG] getDiagnosticos - Diagnóstico ${index} (ID: ${diag.id_diagnostico}), imagen_url NO ES STRING: `, diag.imagen_url, ` Tipo: ${diag.imagen_tipo}`);
            }
        });
    }
    console.log(`getDiagnosticos - Se encontraron ${result?.length || 0} diagnósticos.`);
    return result || [];
  } catch (error: any) {
    console.error('Error en getDiagnosticos:', error.message, error.stack);
    throw error;
  }
}

// --- MODIFICACIÓN EN getDiagnosticoDetalladoById ---
// Obtiene los detalles completos de un diagnóstico por su ID,
// trayendo todos los diagnósticos y filtrando en JavaScript.
export async function getDiagnosticoDetalladoById(id_diagnostico: number): Promise<DiagnosticoDetallado | null> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log(`[INFO] getDiagnosticoDetalladoById - Buscando diagnóstico detallado para ID: ${id_diagnostico} (filtrando en JS).`);

    // Consulta para obtener TODOS los datos de diagnósticos y la imagen asociada
    // ADVERTENCIA: Esto es ineficiente para bases de datos grandes.
    const diagnosticoQuery = `
      SELECT
        d.id_diagnostico,
        d.id_paciente,
        up.primer_nombre || ' ' || up.primer_apellido AS nombre_paciente,
        up.nui AS nui_paciente,
        d.id_medico,
        um.primer_nombre || ' ' || um.primer_apellido AS nombre_medico,
        d.id_tipo_examen,
        te.nombre AS nombre_tipo_examen,
        d.resultado,
        d.nivel_confianza,
        d.fecha_diagnostico,
        d.estado AS estado_diagnostico,
        im.url AS imagen_url,        -- Se espera contenido completo del campo TEXT/BLOB
        im.tipo AS imagen_tipo,      -- Tipo de imagen (ej. "PNG", "JPG")
        im.metadata AS imagen_metadata
      FROM diagnosticos d
      LEFT JOIN usuarios up ON d.id_paciente = up.id_usuario
      LEFT JOIN usuarios um ON d.id_medico = um.id_usuario
      LEFT JOIN tiposexamen te ON d.id_tipo_examen = te.id_tipo_examen
      LEFT JOIN imagenesmedicas im ON d.id_diagnostico = im.id_diagnostico
      ORDER BY d.fecha_diagnostico DESC -- Ordenar puede ayudar, pero no resuelve la ineficiencia
    `; // SE ELIMINÓ LA CLÁUSULA WHERE

    console.log(`[DEBUG] getDiagnosticoDetalladoById - Ejecutando consulta para TODOS los diagnósticos.`);
    const todosLosDiagnosticosResult = await dbClient.sql(diagnosticoQuery); // Sin parámetros de ID aquí

    if (!todosLosDiagnosticosResult || todosLosDiagnosticosResult.length === 0) {
      console.warn(`[WARN] getDiagnosticoDetalladoById - No se encontró ningún diagnóstico en la base de datos al traer todos.`);
      return null;
    }
    console.log(`[DEBUG] getDiagnosticoDetalladoById - Total de diagnósticos traídos de la BD: ${todosLosDiagnosticosResult.length}`);

    // Filtrar en JavaScript para encontrar el diagnóstico específico
    const diagData = (todosLosDiagnosticosResult as any[]).find(diag => diag.id_diagnostico === id_diagnostico);

    if (!diagData) {
      console.warn(`[WARN] getDiagnosticoDetalladoById - No se encontró diagnóstico con ID: ${id_diagnostico} después de filtrar en la aplicación.`);
      return null;
    }
    // --- FIN DE MODIFICACIÓN ---

    // --- Depuración del valor de imagen_url ---
    if (diagData.imagen_url && typeof diagData.imagen_url === 'string') {
        console.log(`[DEBUG] getDiagnosticoDetalladoById - ID ${id_diagnostico}, imagen_url recuperada (primeros 60 chars): ${diagData.imagen_url.substring(0,60)}... Tipo: ${diagData.imagen_tipo}`);
        if (diagData.imagen_url.toUpperCase().startsWith('TEXT(')) {
            console.warn(`[WARN] getDiagnosticoDetalladoById - ID ${id_diagnostico}: imagen_url sigue siendo "TEXT(...)" después de la consulta.
            Esto indica un problema con el driver de la BD o la forma en que recupera campos TEXT largos.
            La cadena Base64 completa NO se está obteniendo de la BD.`);
        }
    } else if (diagData.imagen_url) {
         console.log(`[DEBUG] getDiagnosticoDetalladoById - ID ${id_diagnostico}, imagen_url NO ES STRING: `, diagData.imagen_url, ` Tipo: ${diagData.imagen_tipo}`);
    } else {
        console.log(`[DEBUG] getDiagnosticoDetalladoById - ID ${id_diagnostico}: No se encontró imagen_url (es null o undefined).`);
    }
    // --- Fin de depuración ---

    let ai_descripcion_detallada: string | null = null;
    let ai_pronostico_tiempo_recuperacion: string | null = null;
    let ai_pronostico_probabilidad_mejoria: string | null = null;

    if (diagData.imagen_metadata) {
      try {
        const metadata = JSON.parse(diagData.imagen_metadata as string);
        if (metadata.aiAnalysisDetails) {
          ai_descripcion_detallada = metadata.aiAnalysisDetails.description || null;
          if (metadata.aiAnalysisDetails.pronostico) {
            ai_pronostico_tiempo_recuperacion = metadata.aiAnalysisDetails.pronostico.tiempo_recuperacion || null;
            ai_pronostico_probabilidad_mejoria = metadata.aiAnalysisDetails.pronostico.probabilidad_mejoria || null;
          }
        }
      } catch (parseError: any) {
        console.error(`[ERROR] getDiagnosticoDetalladoById - Error al parsear imagen_metadata JSON para ID ${id_diagnostico}:`, parseError.message);
      }
    }

    // Obtener recomendaciones (esto podría optimizarse si solo se necesitan para el ID actual)
    // Se modifica para traer todas y filtrar en JS, siguiendo la lógica del cambio principal.
    const todasRecomendacionesResult = await dbClient.sql(
      `SELECT id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion FROM recomendaciones ORDER BY fecha_creacion DESC`
    );
    const recomendaciones: DiagnosticoDetalladoRecomendacion[] = (todasRecomendacionesResult || [])
      .filter((rec: any) => rec.id_diagnostico === id_diagnostico) // Filtrar por id_diagnostico
      .map((rec: any) => ({
        id_recomendacion: rec.id_recomendacion,
        descripcion: rec.descripcion,
        prioridad: rec.prioridad,
        fecha_creacion: rec.fecha_creacion,
    }));

    const diagnosticoDetallado: DiagnosticoDetallado = {
      id_diagnostico: diagData.id_diagnostico,
      id_paciente: diagData.id_paciente,
      nombre_paciente: diagData.nombre_paciente || null,
      nui_paciente: diagData.nui_paciente || null,
      id_medico: diagData.id_medico,
      nombre_medico: diagData.nombre_medico || null,
      id_tipo_examen: diagData.id_tipo_examen,
      nombre_tipo_examen: diagData.nombre_tipo_examen || null,
      resultado: diagData.resultado,
      nivel_confianza: diagData.nivel_confianza !== null ? Number(diagData.nivel_confianza) : 0,
      fecha_diagnostico: diagData.fecha_diagnostico,
      estado_diagnostico: diagData.estado_diagnostico,
      ai_descripcion_detallada: ai_descripcion_detallada,
      ai_pronostico_tiempo_recuperacion: ai_pronostico_tiempo_recuperacion,
      ai_pronostico_probabilidad_mejoria: ai_pronostico_probabilidad_mejoria,
      imagen_url: diagData.imagen_url || null,
      imagen_tipo: diagData.imagen_tipo || null,
      recomendaciones: recomendaciones,
    };

    console.log(`[INFO] getDiagnosticoDetalladoById - Detalles completos ensamblados para ID ${id_diagnostico} después de filtrar en JS.`);
    return diagnosticoDetallado;

  } catch (error: any) {
    console.error(`[ERROR] Error en getDiagnosticoDetalladoById para ID ${id_diagnostico} (con filtro JS):`, error.message, error.stack);
    throw error;
  }
}
// --- FIN DE MODIFICACIÓN EN getDiagnosticoDetalladoById ---

// --- FIN DE MODIFICACIÓN EN getDiagnosticoDetalladoById ---

export async function addDiagnosticoBasico(data: {
  id_paciente: number;
  id_medico: number;
  tipoExamenNombre: string;
  resultado: string;
  nivel_confianza: number;
}): Promise<number> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    const id_tipo_examen = await getTipoExamenPorNombre(data.tipoExamenNombre);
    if (id_tipo_examen === null) {
      throw new Error(`Tipo de examen '${data.tipoExamenNombre}' no encontrado.`);
    }

    const params = [
      data.id_paciente, data.id_medico, id_tipo_examen,
      data.resultado, data.nivel_confianza, 'Completado'
    ];

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
    return nuevoId;
  } catch (error: any) {
    console.error('Error en addDiagnosticoBasico:', error.message);
    throw error;
  }
}

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
    console.log('[DB registerMedico] Conexión a DB obtenida.');
    console.log('[DB registerMedico] Datos de entrada:', JSON.stringify(userData, null, 2));

    // --- Obtener id_tipo_documento (Filtrando en JS) ---
    console.log(`[DB registerMedico] Obteniendo todos los tipos de documento para filtrar por código: ${userData.tipoDocumentoCodigo}`);
    const todosTiposDocumentoResult = await dbClient.sql(`SELECT id_tipo_documento, codigo FROM tiposdocumento`);

    console.log('[DB registerMedico] todosTiposDocumentoResult:', JSON.stringify(todosTiposDocumentoResult, null, 2));
    let idTipoDocumento: number | undefined;
    let tiposDocumentoArray: any[] = [];

    if (Array.isArray(todosTiposDocumentoResult)) {
      tiposDocumentoArray = todosTiposDocumentoResult;
    } else if (todosTiposDocumentoResult && typeof (todosTiposDocumentoResult as any).length === 'number') {
      tiposDocumentoArray = Array.from(todosTiposDocumentoResult as any);
    }

    const foundTipoDoc = tiposDocumentoArray.find(doc => doc.codigo?.toUpperCase() === userData.tipoDocumentoCodigo.toUpperCase());
    if (foundTipoDoc) {
      idTipoDocumento = foundTipoDoc.id_tipo_documento;
    }

    if (idTipoDocumento === undefined) {
      console.error(`[DB registerMedico] No se encontró id_tipo_documento para el código: ${userData.tipoDocumentoCodigo} después de filtrar en JS.`);
      throw new Error(`Tipo de documento con código '${userData.tipoDocumentoCodigo}' no encontrado.`);
    }
    console.log(`[DB registerMedico] idTipoDocumento encontrado (filtrado JS): ${idTipoDocumento}`);

    // --- Obtener id_pais (Filtrando en JS) ---
    console.log(`[DB registerMedico] Obteniendo todos los países para filtrar por código: ${userData.paisCodigo}`);
    const todosPaisesResult = await dbClient.sql(`SELECT id_pais, codigo FROM paises`);

    console.log('[DB registerMedico] todosPaisesResult:', JSON.stringify(todosPaisesResult, null, 2));
    let idPais: number | undefined;
    let paisesArray: any[] = [];

    if (Array.isArray(todosPaisesResult)) {
      paisesArray = todosPaisesResult;
    } else if (todosPaisesResult && typeof (todosPaisesResult as any).length === 'number') {
      paisesArray = Array.from(todosPaisesResult as any);
    }

    const foundPais = paisesArray.find(p => p.codigo?.toUpperCase() === userData.paisCodigo.toUpperCase());
    if (foundPais) {
      idPais = foundPais.id_pais;
    }

    if (idPais === undefined) {
      console.error(`[DB registerMedico] No se encontró idPais para el código: ${userData.paisCodigo} después de filtrar en JS.`);
      throw new Error(`País con código '${userData.paisCodigo}' no encontrado.`);
    }
    console.log(`[DB registerMedico] idPais encontrado (filtrado JS): ${idPais}`);

    // --- Insertar en tabla usuarios ---
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
    console.log('[DB registerMedico] Parámetros para INSERT en usuarios:', JSON.stringify(userInsertParams, null, 2));

    const insertUserResult = await dbClient.sql(
      `INSERT INTO usuarios (id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, estado, fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) RETURNING id_usuario`,
      ...userInsertParams
    );
    console.log('[DB registerMedico] Resultado de insertUserResult:', JSON.stringify(insertUserResult, null, 2));

    let newUserId: number | undefined;
    if (insertUserResult && Array.isArray(insertUserResult) && insertUserResult.length > 0 && insertUserResult[0].id_usuario !== undefined) {
        newUserId = Number(insertUserResult[0].id_usuario);
    } else if (insertUserResult && (insertUserResult as any).id_usuario !== undefined) {
        newUserId = Number((insertUserResult as any).id_usuario);
    } else { // Fallback a last_insert_rowid()
        console.warn('[DB registerMedico] RETURNING no devolvió id_usuario como se esperaba. Intentando con last_insert_rowid().');
        const lastIdResultQuery = await dbClient.sql('SELECT last_insert_rowid() as id');
        console.log('[DB registerMedico] Resultado de last_insert_rowid():', JSON.stringify(lastIdResultQuery, null, 2));
        let lastIdValue: any = null;
        if (Array.isArray(lastIdResultQuery) && lastIdResultQuery.length > 0) {
            lastIdValue = lastIdResultQuery[0].id;
        } else if (lastIdResultQuery && typeof (lastIdResultQuery as any).length === 'number' && (lastIdResultQuery as any).length > 0) {
            lastIdValue = (lastIdResultQuery as any)[0]?.id;
        }
        if (lastIdValue !== undefined && lastIdValue !== null) {
            newUserId = Number(lastIdValue);
        }
    }

    if (newUserId === undefined) {
      console.error('[DB registerMedico] Falló la obtención del newUserId después de la inserción en usuarios.');
      throw new Error('Failed to retrieve new user ID after user insertion in registerMedico.');
    }
    console.log(`[DB registerMedico] newUserId obtenido: ${newUserId}`);

    // --- Asignar rol de 'medico' ---
    // Esta función ASIGNA un rol existente, NO CREA nuevos roles en la tabla 'roles'.
    // La creación de roles base ('admin', 'medico', 'paciente') debe manejarse en la inicialización (init) o por administradores.
    const medicoRoleName = 'medico';
    const roleRowsQuery = `SELECT id_rol FROM roles WHERE nombre = ?`;
    console.log(`[DB registerMedico] Buscando el ID del rol existente con nombre: '${medicoRoleName}'`);
    const roleRowsResult = await dbClient.sql(roleRowsQuery, [medicoRoleName]);

    console.log(`[DB registerMedico] Resultado de la búsqueda del rol '${medicoRoleName}':`, JSON.stringify(roleRowsResult, null, 2));
    let medicoRoleId: number | undefined;
    let rolesArray: any[] = [];

    // --- INICIO DE LA MODIFICACIÓN (Lógica robusta para extraer rolesArray) ---
    if (Array.isArray(roleRowsResult)) {
        rolesArray = roleRowsResult;
        console.log(`[DB registerMedico] roleRowsResult es un array. Longitud: ${rolesArray.length}`);
    } else if (roleRowsResult && typeof roleRowsResult === 'object') {
        // Si es un objeto, verificar propiedades comunes como 'rows' o '_rows'
        if (Array.isArray((roleRowsResult as any).rows)) {
            rolesArray = (roleRowsResult as any).rows;
            console.log(`[DB registerMedico] Extraído de roleRowsResult.rows. Longitud: ${rolesArray.length}`);
        } else if (Array.isArray((roleRowsResult as any)._rows)) { // Algunos drivers usan _rows
            rolesArray = (roleRowsResult as any)._rows;
            console.log(`[DB registerMedico] Extraído de roleRowsResult._rows. Longitud: ${rolesArray.length}`);
        } else if (typeof (roleRowsResult as any).length === 'number' && (roleRowsResult as any).length >= 0) {
            // Si tiene una propiedad 'length' y es un objeto (podría ser un SQLiteCloudRowset u otro objeto similar a un array)
            console.log(`[DB registerMedico] roleRowsResult tiene 'length': ${(roleRowsResult as any).length}. Intentando Array.from().`);
            try {
                rolesArray = Array.from(roleRowsResult as any);
            } catch (e: any) {
                console.error(`[DB registerMedico] Falló Array.from(roleRowsResult): ${e.message}. Asumiendo array vacío.`);
                rolesArray = [];
            }
        } else {
            console.warn(`[DB registerMedico] roleRowsResult es un objeto pero no se pudo extraer un array de roles. Asumiendo array vacío.`);
            rolesArray = [];
        }
    } else {
        console.warn(`[DB registerMedico] roleRowsResult NO es ni Array ni Objeto (o es null/undefined). Asumiendo array vacío. rawResult:`, roleRowsResult);
        rolesArray = [];
    }
    // --- FIN DE LA MODIFICACIÓN ---

    if (rolesArray.length > 0 && rolesArray[0]?.id_rol !== undefined) {
        medicoRoleId = Number(rolesArray[0].id_rol);
    }

    if (medicoRoleId === undefined) {
      console.error(`[DB registerMedico] CRÍTICO: No se encontró el rol '${medicoRoleName}' en la tabla 'roles'. Este rol debe existir para registrar médicos.`);
      console.error(`[DB registerMedico] Por favor, asegúrese de que la tabla 'roles' contenga una entrada con nombre = '${medicoRoleName}'.`);
      throw new Error(`El rol '${medicoRoleName}' es necesario para el registro y no fue encontrado. Contacte al administrador.`);
    }

    // Verificación explícita de que el id_rol para 'medico' sea 2 (o el ID que esperas)
    const ID_ROL_MEDICO_ESPERADO = 2;
    if (medicoRoleId !== ID_ROL_MEDICO_ESPERADO) {
        console.warn(`[DB registerMedico] ADVERTENCIA: El rol '${medicoRoleName}' tiene id_rol = ${medicoRoleId}, pero se esperaba id_rol = ${ID_ROL_MEDICO_ESPERADO}. Verifique la configuración de la tabla 'roles' o ajuste la constante ID_ROL_MEDICO_ESPERADO en el código si el ID esperado es diferente.`);
        // Si es un requisito estricto que sea 2, puedes lanzar un error aquí:
        // throw new Error(`El rol 'medico' tiene un ID incorrecto (${medicoRoleId}) en la base de datos. Se esperaba ID ${ID_ROL_MEDICO_ESPERADO}.`);
    }
    console.log(`[DB registerMedico] ID del rol '${medicoRoleName}' encontrado y procesado: ${medicoRoleId}.`);

    await dbClient.sql(`INSERT INTO usuariosroles (id_usuario, id_rol, fecha_asignacion) VALUES (?, ?, CURRENT_TIMESTAMP)`, newUserId, medicoRoleId);
    console.log(`[DB registerMedico] Rol '${medicoRoleName}' (ID: ${medicoRoleId}) asignado al usuario ${newUserId} en usuariosroles.`);

    // --- Insertar en tabla medicos ---
    const medicoInsertParams = [
        newUserId,
        userData.id_especialidad,
        userData.numero_tarjeta_profesional,
        userData.años_experiencia || null,
    ];
    console.log('[DB registerMedico] Parámetros para INSERT en medicos:', JSON.stringify(medicoInsertParams, null, 2));
    await dbClient.sql(
      `INSERT INTO medicos (id_usuario, id_especialidad, numero_tarjeta_profesional, fecha_ingreso, años_experiencia)
       VALUES (?, ?, ?, DATE('now'), ?)`,
      ...medicoInsertParams
    );
    console.log('[DB registerMedico] Detalles del médico insertados en la tabla medicos.');

    return newUserId;
  } catch (error: any) {
    console.error('[DB registerMedico] Error en la función registerMedico:', error.message, error.stack);
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
    console.log(`registerPacienteBasico - newUserId: ${newUserId}`);    // Buscar el ID del rol de paciente
    // Buscar directamente por ID conocido del rol paciente (id_rol=3)
    const roleResult = await dbClient.sql(`SELECT id_rol FROM roles WHERE id_rol = 3 AND nombre = 'paciente'`);
    let roleId: number | undefined;
    let rolesArray: any[] = [];

    if (Array.isArray(roleResult)) {
        rolesArray = roleResult;
    } else if (roleResult && typeof roleResult === 'object') {
        if (Array.isArray((roleResult as any).rows)) {
            rolesArray = (roleResult as any).rows;
        } else if (Array.isArray((roleResult as any)._rows)) {
            rolesArray = (roleResult as any)._rows;
        } else if (typeof (roleResult as any).length === 'number') {
            rolesArray = Array.from(roleResult as any);
        }
    }

    if (rolesArray.length > 0 && rolesArray[0]?.id_rol !== undefined) {
        roleId = rolesArray[0].id_rol;
        console.log(`Rol 'paciente' encontrado con ID: ${roleId}`);
    } else {
        console.error('Role \'paciente\' not found. DB result:', JSON.stringify(roleResult, null, 2));
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
  try {
    const dbClient = await getConnection();
    const result = await dbClient.sql('SELECT * FROM usuarios');
    return result || [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// export const addUser = async (user: {
//   tipoDocumentoCodigo: string;
//   paisCodigo: string;
//   nui: string;
//   primer_nombre: string;
//   segundo_nombre?: string | null;
//   primer_apellido: string;
//   segundo_apellido?: string | null;
//   correo: string;
//   firebase_uid: string;
//   rol?: string;
// }): Promise<void> => {
//   // ... contenido de la función ...
// };

export const getPacientes = async (): Promise<any[]> => {
  try {
    const dbClient = await getConnection();
    // Nueva consulta SQL que incluye conteo de diagnósticos y el último diagnóstico
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
        p.historial_visitas,
        COUNT(d.id_diagnostico) AS diagnosticosTotales,
        (
          SELECT diag.resultado || ' (' || strftime('%d/%m/%Y', diag.fecha_diagnostico) || ')'
          FROM diagnosticos diag
          WHERE diag.id_paciente = p.id_usuario
          ORDER BY diag.fecha_diagnostico DESC, diag.id_diagnostico DESC
          LIMIT 1
        ) AS ultimo_diagnostico_info
      FROM pacientes p
      JOIN usuarios u ON p.id_usuario = u.id_usuario
      LEFT JOIN tiposdocumento td ON u.id_tipo_documento = td.id_tipo_documento
      LEFT JOIN paises pa ON u.id_pais = pa.id_pais
      LEFT JOIN diagnosticos d ON p.id_usuario = d.id_paciente
      GROUP BY
        p.id_usuario,
        u.primer_nombre,
        u.segundo_nombre,
        u.primer_apellido,
        u.segundo_apellido,
        u.correo,
        u.fecha_registro,
        u.nui,
        td.descripcion,
        pa.nombre,
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
      ORDER BY u.primer_apellido, u.primer_nombre;
    `);

    // Mapear el resultado para asegurar que los nombres de campo coincidan
    // con lo que espera el frontend, especialmente para los nuevos campos.
    return (result || []).map((row: any) => ({
      ...row,
      diagnosticosTotales: Number(row.diagnosticosTotales || 0),
      // El frontend espera 'ultimo_diagnostico', no 'ultimo_diagnostico_info'
      ultimo_diagnostico: row.ultimo_diagnostico_info,
    }));

  } catch (error) {
    console.error('Error getting patients with diagnostic info:', error);
    // Considera devolver un error más específico o lanzar el error
    // para que sea manejado por la API route.
    return []; // Devolver array vacío en caso de error para mantener la consistencia
  }
};

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

// Esta es la versión ANTERIOR de getUserByFirebaseUid, la conservo comentada por referencia
// export const getUserByFirebaseUid = async (firebaseUid: string): Promise<any | null> => {
//   try {
//     const dbClient = await getConnection();
//     const userResult = await dbClient.sql(
//       `SELECT u.id_usuario, u.id_tipo_documento, u.id_pais, u.nui, u.primer_nombre, u.segundo_nombre, u.primer_apellido, u.segundo_apellido, u.correo, u.fecha_registro, u.ultima_actividad, u.estado, u.firebase_uid
//        FROM usuarios u
//        WHERE u.firebase_uid = ?`,
//       [firebaseUid]
//     );
//     const user = userResult?.[0];

//     if (!user) {
//       return null;
//     }

//     const roleResult = await dbClient.sql(
//       `SELECT r.nombre FROM roles r JOIN usuariosroles ur ON r.id_rol = ur.id_rol WHERE ur.id_usuario = ?`,
//       [user.id_usuario]
//     );
//     const roles = roleResult?.map((row: { nombre: string }) => row.nombre) || [];

//     return { ...user, roles };
//   } catch (error: any) {
//     console.error('Error al obtener usuario por Firebase UID:', error.message, error.stack);
//     return null;
//   }
// };

export const getUser = async (email: string): Promise<any | null> => {
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
      } else if (Array.isArray((allUsersResult as any)._rows)) { // Otra posible propiedad para las filas
        allUsers = (allUsersResult as any)._rows;
      } else if (Symbol.iterator in Object(allUsersResult)) { // Intentar iterar si es iterable
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

// --- NUEVA FUNCIÓN PARA ELIMINAR DIAGNÓSTICO Y DATOS RELACIONADOS ---
export async function deleteDiagnosticoCompletoById(id_diagnostico: number): Promise<{ success: boolean; message: string }> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log(`[INFO] deleteDiagnosticoCompletoById - Iniciando eliminación para diagnóstico ID: ${id_diagnostico}`);

    // Paso 1: Obtener IDs de recomendaciones asociadas al diagnóstico
    // Esto es necesario si la eliminación en cascada no está configurada en la BD o para eliminar datos en otras tablas primero.
    const recomendacionesResult = await dbClient.sql(
      `SELECT id_recomendacion FROM recomendaciones WHERE id_diagnostico = ?`,
      id_diagnostico
    );
    const idsRecomendaciones: number[] = (recomendacionesResult || []).map((r: any) => r.id_recomendacion);

    if (idsRecomendaciones.length > 0) {
      console.log(`[DEBUG] deleteDiagnosticoCompletoById - IDs de recomendaciones cuyos seguimientos se eliminarán: ${idsRecomendaciones.join(', ')}`);
      // Paso 2: Eliminar de seguimientorecomendaciones (si hay recomendaciones)
      const placeholders = idsRecomendaciones.map(() => '?').join(',');
      const deleteSeguimientosResult = await dbClient.sql(
        `DELETE FROM seguimientorecomendaciones WHERE id_recomendacion IN (${placeholders})`,
        ...idsRecomendaciones
      );
      console.log(`[DEBUG] deleteDiagnosticoCompletoById - Seguimientos eliminados: ${deleteSeguimientosResult?.changes ?? 0}`);
    } else {
      console.log(`[DEBUG] deleteDiagnosticoCompletoById - No hay seguimientos que eliminar (no hay recomendaciones asociadas).`);
    }

    // Paso 3: Eliminar de recomendaciones
    const deleteRecomendacionesResult = await dbClient.sql(
      `DELETE FROM recomendaciones WHERE id_diagnostico = ?`,
      id_diagnostico
    );
    console.log(`[DEBUG] deleteDiagnosticoCompletoById - Recomendaciones eliminadas: ${deleteRecomendacionesResult?.changes ?? 0}`);

    // Paso 4: Eliminar de imagenesmedicas
    // Aquí también podrías querer eliminar el archivo físico si guardas imágenes en el servidor además de Base64
    const deleteImagenesResult = await dbClient.sql(
      `DELETE FROM imagenesmedicas WHERE id_diagnostico = ?`,
      id_diagnostico
    );
    console.log(`[DEBUG] deleteDiagnosticoCompletoById - Imágenes médicas eliminadas: ${deleteImagenesResult?.changes ?? 0}`);

    // Paso 5: Eliminar de diagnosticos
    const deleteDiagnosticoResult = await dbClient.sql(
      `DELETE FROM diagnosticos WHERE id_diagnostico = ?`,
      id_diagnostico
    );
    console.log(`[DEBUG] deleteDiagnosticoCompletoById - Diagnóstico principal eliminado: ${deleteDiagnosticoResult?.changes ?? 0}`);

    if (deleteDiagnosticoResult?.changes > 0) {
      console.log(`[INFO] deleteDiagnosticoCompletoById - Diagnóstico ID ${id_diagnostico} y datos asociados eliminados exitosamente.`);
      return { success: true, message: `Diagnóstico ID ${id_diagnostico} y datos asociados eliminados exitosamente.` };
    } else {
      // Esto podría ocurrir si el diagnóstico ya fue eliminado o nunca existió.
      console.warn(`[WARN] deleteDiagnosticoCompletoById - No se encontró el diagnóstico ID ${id_diagnostico} en la tabla 'diagnosticos' para eliminar, o ya fue eliminado.`);
      return { success: false, message: `No se encontró el diagnóstico ID ${id_diagnostico} para eliminar, o ya fue eliminado.` };
    }

  } catch (error: any) {
    console.error(`[ERROR] Error en deleteDiagnosticoCompletoById para ID ${id_diagnostico}:`, error.message, error.stack);
    // Considerar el uso de transacciones si tu driver de base de datos las soporta
    // para asegurar que todas las eliminaciones se completen o ninguna (rollback).
    // Por ahora, se realizan eliminaciones secuenciales.
    return { success: false, message: `Error al eliminar el diagnóstico: ${error.message}` };
  }
}
// --- FIN DE NUEVA FUNCIÓN ---

// --- NUEVAS FUNCIONES PARA MFA ---
interface UserForMfa {
  id_usuario: number;
  correo: string;
  firebase_uid: string;
}

// --- VERSIÓN MODIFICADA DE getUserByFirebaseUID PARA DEPURACIÓN ---
export async function getUserByFirebaseUID(firebase_uid: string): Promise<UserForMfa | null> {
  let dbClient: Database | undefined;
  console.log(`[DEBUG getUserByFirebaseUID] INICIO - firebase_uid recibido: '${firebase_uid}' (Tipo: ${typeof firebase_uid})`);

  // 1. Validar el parámetro de entrada
  if (!firebase_uid || typeof firebase_uid !== 'string' || firebase_uid.trim() === '') {
    console.error(`[DEBUG getUserByFirebaseUID] ERROR: firebase_uid inválido o vacío: '${firebase_uid}'`);
    return null;
  }

  const cleanUid = firebase_uid.trim();
  console.log(`[DEBUG getUserByFirebaseUID] cleanUid a usar en consulta: '${cleanUid}'`);

  try {
    dbClient = await getConnection();
    if (!dbClient) {
      console.error(`[DEBUG getUserByFirebaseUID] ERROR CRÍTICO: No se pudo obtener conexión a la base de datos.`);
      return null;
    }
    console.log(`[DEBUG getUserByFirebaseUID] Conexión a DB obtenida. Estado del cliente: ${client ? 'Instanciado' : 'Nulo'}`);

    const query = `SELECT id_usuario, correo, firebase_uid FROM usuarios WHERE firebase_uid = ?`;
    const params = [cleanUid];

    console.log(`[DEBUG getUserByFirebaseUID] Ejecutando query: "${query}" con params: ${JSON.stringify(params)}`);

    // TEST ADICIONAL: Intentar una consulta simple a la tabla usuarios SIN WHERE
    try {
        const testUsers = await dbClient.sql('SELECT COUNT(*) as count FROM usuarios');
        console.log(`[DEBUG getUserByFirebaseUID] Test query 'SELECT COUNT(*) FROM usuarios' result:`, JSON.stringify(testUsers, null, 2));
        if (testUsers && testUsers.length > 0 && testUsers[0].count !== undefined) {
            console.log(`[DEBUG getUserByFirebaseUID] Conteo de usuarios: ${testUsers[0].count}`);
        } else {
            console.warn(`[DEBUG getUserByFirebaseUID] No se pudo obtener el conteo de usuarios o el formato es inesperado.`);
        }
    } catch (testError: any) {
        console.error(`[DEBUG getUserByFirebaseUID] ERROR en test query 'SELECT COUNT(*) FROM usuarios': ${testError.message}`);
    }

    const rawResult = await dbClient.sql(query, ...params); // Usar spread operator para los parámetros

    console.log(`[DEBUG getUserByFirebaseUID] rawResult de dbClient.sql('${query}', '${cleanUid}'):`);
    console.log(`    Tipo de rawResult: ${typeof rawResult}`);
    console.log(`    Es Array? ${Array.isArray(rawResult)}`);
    console.log(`    rawResult (directo):`, rawResult); // Loguear el objeto directamente
    console.log(`    rawResult (JSON.stringify): ${JSON.stringify(rawResult, null, 2)}`);

    // Si rawResult es un array (como se espera de muchos drivers SQL)
    if (Array.isArray(rawResult)) {
      console.log(`[DEBUG getUserByFirebaseUID] rawResult ES un array. Longitud: ${rawResult.length}`);
      if (rawResult.length === 0) {
        console.warn(`[DEBUG getUserByFirebaseUID] rawResult es un array VACÍO. No se encontró usuario con firebase_uid: '${cleanUid}'.`);
        return null;
      }
      // Asumimos que el primer elemento es nuestro usuario si el array no está vacío
      const userRecord = rawResult[0];
      console.log(`[DEBUG getUserByFirebaseUID] userRecord (primer elemento del array):`, JSON.stringify(userRecord, null, 2));

      if (userRecord && userRecord.id_usuario !== undefined && userRecord.firebase_uid !== undefined) {
        const finalUser: UserForMfa = {
          id_usuario: Number(userRecord.id_usuario),
          correo: String(userRecord.correo || ''),
          firebase_uid: String(userRecord.firebase_uid)
        };
        console.log(`[DEBUG getUserByFirebaseUID] Usuario encontrado y mapeado (desde array):`, JSON.stringify(finalUser, null, 2));
        return finalUser;
      } else {
        console.error(`[DEBUG getUserByFirebaseUID] ERROR: userRecord del array no tiene las propiedades esperadas (id_usuario, firebase_uid). userRecord:`, JSON.stringify(userRecord, null, 2));
        return null;
      }
    }
    // Si rawResult es un objeto que podría tener una propiedad 'rows' o '_rows' (como algunos drivers)
    // O si el driver de SQLite Cloud devuelve un objeto con 'length' para simular un array (SQLiteCloudRowset)
    else if (rawResult && typeof rawResult === 'object') {
        console.log(`[DEBUG getUserByFirebaseUID] rawResult ES un objeto.`);
        let userArray: any[] | undefined;

        if (typeof (rawResult as any).length === 'number' && (rawResult as any).length >= 0) {
            console.log(`[DEBUG getUserByFirebaseUID] rawResult tiene propiedad 'length': ${(rawResult as any).length}. Intentando convertir a array.`);
            // Intenta convertir un objeto similar a un array (como SQLiteCloudRowset) en un array real
            // Esto es crucial si el driver devuelve algo que *parece* un array pero no lo es (ej. no tiene .map, .find etc.)
            try {
                userArray = Array.from(rawResult as any); // Esto podría fallar si no es iterable o es un objeto simple
                console.log(`[DEBUG getUserByFirebaseUID] Convertido a array con Array.from(). Longitud: ${userArray.length}`);
            } catch (e: any) {
                console.warn(`[DEBUG getUserByFirebaseUID] Falló Array.from(rawResult): ${e.message}. Probando otras propiedades.`);
            }
        }

        if (!userArray && Array.isArray((rawResult as any).rows)) {
            console.log(`[DEBUG getUserByFirebaseUID] Usando rawResult.rows. Longitud: ${(rawResult as any).rows.length}`);
            userArray = (rawResult as any).rows;
        } else if (!userArray && Array.isArray((rawResult as any)._rows)) {
            console.log(`[DEBUG getUserByFirebaseUID] Usando rawResult._rows. Longitud: ${(rawResult as any)._rows.length}`);
            userArray = (rawResult as any)._rows;
        }

        if (userArray) {
            if (userArray.length === 0) {
                console.warn(`[DEBUG getUserByFirebaseUID] userArray (desde objeto) está VACÍO. No se encontró usuario con firebase_uid: '${cleanUid}'.`);
                return null;
            }
            const userRecord = userArray[0];
            console.log(`[DEBUG getUserByFirebaseUID] userRecord (primer elemento de userArray):`, JSON.stringify(userRecord, null, 2));

            if (userRecord && userRecord.id_usuario !== undefined && userRecord.firebase_uid !== undefined) {
                const finalUser: UserForMfa = {
                    id_usuario: Number(userRecord.id_usuario),
                    correo: String(userRecord.correo || ''),
                    firebase_uid: String(userRecord.firebase_uid)
                };
                console.log(`[DEBUG getUserByFirebaseUID] Usuario encontrado y mapeado (desde objeto procesado):`, JSON.stringify(finalUser, null, 2));
                return finalUser;
            } else {
                console.error(`[DEBUG getUserByFirebaseUID] ERROR: userRecord del objeto procesado no tiene las propiedades esperadas. userRecord:`, JSON.stringify(userRecord, null, 2));
                return null;
            }
        } else {
             // Caso final: si rawResult es un objeto pero no es un array, no tiene .rows, ._rows, ni es iterable con Array.from
             // y el log original decía `[]`, es muy probable que el problema sea que el driver devuelve un array vacío
             // y la lógica anterior de `Array.isArray(rawResult)` ya lo debería haber capturado.
             // Esta rama es más para cubrir casos donde `rawResult` es un objeto simple que no es lo que esperamos.
            console.warn(`[DEBUG getUserByFirebaseUID] rawResult es un objeto pero no se pudo extraer un array de usuarios (no es array, ni tiene .rows/_rows, ni se pudo convertir con Array.from).`);
            return null;
        }
    }
    // Si rawResult no es ni array ni objeto (o es null/undefined)
    else {
      console.warn(`[DEBUG getUserByFirebaseUID] rawResult NO es ni Array ni Objeto (o es null/undefined). No se puede procesar. rawResult:`, rawResult);
      return null;
    }

  } catch (error: any) {
    console.error(`[DEBUG getUserByFirebaseUID] Error en la función getUserByFirebaseUID: ${error.message}`, error.stack);
    // Si el error es "No such column: undefined" o similar, puede indicar un problema con cómo se pasan los parámetros
    if (error.message.toLowerCase().includes('column') && error.message.toLowerCase().includes('undefined')) {
        console.error(`[DEBUG getUserByFirebaseUID] SOSPECHA: El error sugiere que el parámetro (placeholder '?') no se está reemplazando correctamente en la consulta.`);
    }
    return null;
  }
}

export async function saveOrUpdateUserMfaConfig(id_usuario: number, encryptedSecret: string): Promise<boolean> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log(`db.ts (saveOrUpdateUserMfaConfig): Guardando secreto MFA para usuario ID: ${id_usuario}`);

    const result = await dbClient.sql(
      `INSERT OR REPLACE INTO usuarios_mfa_config (id_usuario, mfa_secret, mfa_enabled, mfa_verified_at)
       VALUES (?, ?, 0, NULL)`,
      id_usuario,
      encryptedSecret
    );

    return result.changes > 0;
  } catch (error: any) {
    console.error('Error en saveOrUpdateUserMfaConfig:', error.message, error.stack);
    return false;
  }
}

interface MfaConfig {
  id_usuario: number;
  mfa_secret: string; // Este es el secreto CIFRADO
  mfa_enabled: number; // 0 o 1
  mfa_verified_at: string | null; // Campo añadido para resolver el error
}

export async function getUserMfaConfig(id_usuario: number): Promise<MfaConfig | null> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log(`db.ts (getUserMfaConfig): Obteniendo config MFA para usuario ID: ${id_usuario}`);

    const result = await dbClient.sql(
      `SELECT id_usuario, mfa_secret, mfa_enabled, mfa_verified_at FROM usuarios_mfa_config WHERE id_usuario = ?`, // Añadido mfa_verified_at
      id_usuario
    );

    // Asumiendo que el driver devuelve un array de objetos
    if (result && Array.isArray(result) && result.length > 0) {
      const record = result[0];
      return {
        id_usuario: Number(record.id_usuario),
        mfa_secret: String(record.mfa_secret),
        mfa_enabled: Number(record.mfa_enabled),
        mfa_verified_at: record.mfa_verified_at ? String(record.mfa_verified_at) : null
      };
    } else if (result && typeof result === 'object' && !Array.isArray(result) && (result as any).length > 0) {
        // Si es un SQLiteCloudRowset u objeto similar a un array
        const record = (result as any)[0];
         return {
            id_usuario: Number(record.id_usuario),
            mfa_secret: String(record.mfa_secret),
            mfa_enabled: Number(record.mfa_enabled),
            mfa_verified_at: record.mfa_verified_at ? String(record.mfa_verified_at) : null
        };
    }
    else {
      return null;
    }
  } catch (error: any) {
    console.error('Error en getUserMfaConfig:', error.message, error.stack);
    return null;
  }
}

export async function enableUserMfa(id_usuario: number): Promise<boolean> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log(`db.ts (enableUserMfa): Habilitando MFA para usuario ID: ${id_usuario}`);

    const result = await dbClient.sql(
      `UPDATE usuarios_mfa_config
       SET mfa_enabled = 1, mfa_verified_at = datetime('now')
       WHERE id_usuario = ?`,
      id_usuario
    );

    return result.changes > 0;
  } catch (error: any) {
    console.error('Error en enableUserMfa:', error.message, error.stack);
    return false;
  }
}

interface FullUserFromDB {
  id_usuario: number;
  id_tipo_documento: number;
  id_pais: number;
  nui: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  correo: string;
  fecha_registro: string;
  ultima_actividad: string | null;
  estado: string;
  firebase_uid: string;
  roles: string[];
  ultima_ip_login?: string | null;
  ultima_ubicacion_login?: string | null;
}

export const getFullUserByFirebaseUID = async (firebaseUid: string): Promise<FullUserFromDB | null> => {
  console.log(`[DB getFullUserByFirebaseUID] INICIO - Buscando usuario completo con firebase_uid: '${firebaseUid}' (Tipo: ${typeof firebaseUid})`);

  if (!firebaseUid || typeof firebaseUid !== 'string' || firebaseUid.trim() === '') {
    console.error(`[DB getFullUserByFirebaseUID] ERROR: firebase_uid inválido o vacío: '${firebaseUid}'`);
    return null;
  }
  const cleanFirebaseUid = firebaseUid.trim();

  let dbClient: Database | undefined;

  try {
    dbClient = await getConnection();
    if (!dbClient) {
      console.error(`[DB getFullUserByFirebaseUID] ERROR CRÍTICO: No se pudo obtener conexión a la base de datos desde getConnection().`);
      return null;
    }

    const userQuery = `
      SELECT
        u.id_usuario, u.id_tipo_documento, u.id_pais, u.nui,
        u.primer_nombre, u.segundo_nombre, u.primer_apellido, u.segundo_apellido,
        u.correo, u.fecha_registro, u.ultima_actividad, u.estado, u.firebase_uid,
        u.ultima_ip_login, u.ultima_ubicacion_login
      FROM usuarios u
      WHERE u.firebase_uid = ?
    `;
    console.log(`[DB getFullUserByFirebaseUID] Ejecutando userQuery: "${userQuery}" con param: '${cleanFirebaseUid}'`);
    const userResult = await dbClient.sql(userQuery, cleanFirebaseUid);

    console.log(`[DB getFullUserByFirebaseUID] userResult de dbClient.sql (datos base):`);
    console.log(`    Tipo de userResult: ${typeof userResult}`);
    console.log(`    Es Array? ${Array.isArray(userResult)}`);
    console.log(`    userResult (directo):`, userResult);
    console.log(`    userResult (JSON.stringify): ${JSON.stringify(userResult, null, 2)}`);

    let userDataRow: any = null;

    if (Array.isArray(userResult)) {
      console.log(`[DB getFullUserByFirebaseUID] userResult ES un array. Longitud: ${userResult.length}`);
      if (userResult.length > 0) {
        userDataRow = userResult[0];
      }
    } else if (userResult && typeof userResult === 'object') {
      console.log(`[DB getFullUserByFirebaseUID] userResult ES un objeto.`);
      let tempArray: any[] | undefined;
      if (typeof (userResult as any).length === 'number' && (userResult as any).length >= 0) {
        console.log(`[DB getFullUserByFirebaseUID] userResult tiene propiedad 'length': ${(userResult as any).length}. Intentando Array.from().`);
        try {
          tempArray = Array.from(userResult as any);
          console.log(`[DB getFullUserByFirebaseUID] Convertido a array con Array.from(). Longitud: ${tempArray.length}`);
        } catch (e: any) {
          console.warn(`[DB getFullUserByFirebaseUID] Falló Array.from(userResult): ${e.message}. Probando otras propiedades.`);
        }
      }

      if (!tempArray && Array.isArray((userResult as any).rows)) {
        console.log(`[DB getFullUserByFirebaseUID] Usando userResult.rows. Longitud: ${(userResult as any).rows.length}`);
        tempArray = (userResult as any).rows;
      } else if (!tempArray && Array.isArray((userResult as any)._rows)) {
        console.log(`[DB getFullUserByFirebaseUID] Usando userResult._rows. Longitud: ${(userResult as any)._rows.length}`);
        tempArray = (userResult as any)._rows;
      }

      if (tempArray && tempArray.length > 0) {
        userDataRow = tempArray[0];
      }
    }

    if (!userDataRow) {
      console.warn(`[DB getFullUserByFirebaseUID] No se encontró usuario en tabla 'usuarios' con firebase_uid: ${cleanFirebaseUid} (después de procesar userResult).`);
      return null;
    }
    console.log(`[DB getFullUserByFirebaseUID] userDataRow (datos base del usuario):`, JSON.stringify(userDataRow, null, 2));

    const rolesQuery = `
      SELECT r.nombre
      FROM roles r
      JOIN usuariosroles ur ON r.id_rol = ur.id_rol
      WHERE ur.id_usuario = ?
    `;
    console.log(`[DB getFullUserByFirebaseUID] Ejecutando rolesQuery con id_usuario: ${userDataRow.id_usuario}`);
    const rolesResult = await dbClient.sql(rolesQuery, userDataRow.id_usuario);

    console.log(`[DB getFullUserByFirebaseUID] rolesResult de dbClient.sql:`);
    console.log(`    Tipo de rolesResult: ${typeof rolesResult}`);
    console.log(`    Es Array? ${Array.isArray(rolesResult)}`);
    console.log(`    rolesResult (directo):`, rolesResult);
    console.log(`    rolesResult (JSON.stringify): ${JSON.stringify(rolesResult, null, 2)}`);

    let userRoles: string[] = [];
    if (Array.isArray(rolesResult)) {
      userRoles = rolesResult.map((row: any) => row.nombre);
    } else if (rolesResult && typeof rolesResult === 'object') {
      let tempRolesArray: any[] | undefined;
      if (typeof (rolesResult as any).length === 'number' && (rolesResult as any).length >= 0) {
        try { tempRolesArray = Array.from(rolesResult as any); } catch (e) { }
      }
      if (!tempRolesArray && Array.isArray((rolesResult as any).rows)) {
        tempRolesArray = (rolesResult as any).rows;
      } else if (!tempRolesArray && Array.isArray((rolesResult as any)._rows)) {
        tempRolesArray = (rolesResult as any)._rows;
      }
      if (tempRolesArray) {
        userRoles = tempRolesArray.map((row: any) => row.nombre);
      }
    }
    console.log(`[DB getFullUserByFirebaseUID] Roles procesados para usuario ID ${userDataRow.id_usuario}:`, userRoles);

    const fullUser: FullUserFromDB = {
      id_usuario: Number(userDataRow.id_usuario),
      id_tipo_documento: Number(userDataRow.id_tipo_documento),
      id_pais: Number(userDataRow.id_pais),
      nui: String(userDataRow.nui),
      primer_nombre: String(userDataRow.primer_nombre),
      segundo_nombre: userDataRow.segundo_nombre ? String(userDataRow.segundo_nombre) : null,
      primer_apellido: String(userDataRow.primer_apellido),
      segundo_apellido: userDataRow.segundo_apellido ? String(userDataRow.segundo_apellido) : null,
      correo: String(userDataRow.correo),
      fecha_registro: String(userDataRow.fecha_registro),
      ultima_actividad: userDataRow.ultima_actividad ? String(userDataRow.ultima_actividad) : null,
      estado: String(userDataRow.estado),
      firebase_uid: String(userDataRow.firebase_uid),
      roles: userRoles,
      ultima_ip_login: userDataRow.ultima_ip_login ? String(userDataRow.ultima_ip_login) : null,
      ultima_ubicacion_login: userDataRow.ultima_ubicacion_login ? String(userDataRow.ultima_ubicacion_login) : null,
    };
    console.log(`[DB getFullUserByFirebaseUID] Usuario completo ensamblado:`, JSON.stringify(fullUser, null, 2));
    return fullUser;

  } catch (error: any) {
    console.error(`[DB getFullUserByFirebaseUID] Error al obtener usuario completo por Firebase UID (${cleanFirebaseUid}):`, error.message, error.stack);
    return null;
  }
};

export async function updateLastLoginInfo(id_usuario: number, ip_address: string, location_info: string | null = null): Promise<boolean> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log(`[DB updateLastLoginInfo] Actualizando última IP/ubicación para usuario ID: ${id_usuario}`);

    const result = await dbClient.sql(
      `UPDATE usuarios
       SET ultima_ip_login = ?, ultima_ubicacion_login = ?, ultima_actividad = CURRENT_TIMESTAMP
       WHERE id_usuario = ?`,
      ip_address,
      location_info,
      id_usuario
    );

    return result.changes > 0;
  } catch (error: any) {
    console.error('Error en updateLastLoginInfo:', error.message, error.stack);
    return false;
  }
}

// Agrega esta interfaz cerca de tus otras interfaces si es necesario,
// o asegúrate de que los campos coincidan con lo que PacientesPage.tsx espera.
export interface PacienteDetalladoParaEdicion {
  id_usuario: number;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  correo: string; // En el frontend se usa 'email', así que la API route debe mapearlo
  fecha_registro_usuario?: string; // Opcional, si lo necesitas
  nui: string;
  tipo_documento_codigo: string; // Código como 'CC', 'PS'
  pais_codigo: string; // Código como 'COL'
  tipo_documento_descripcion?: string; // Opcional
  pais_nombre?: string; // Opcional
  grupo_sanguineo?: string | null;
  alergias?: string | null;
  antecedentes_medicos?: string | null;
  telefono_contacto?: string | null;
  direccion_residencial?: string | null;
  fecha_nacimiento?: string | null; // Formato YYYY-MM-DD
  genero?: string | null;
  ocupacion?: string | null;
  info_seguro_medico?: string | null;
  contacto_emergencia?: string | null;
  // No incluir firebase_uid aquí a menos que sea específicamente necesario para la edición por el admin
}

export async function getPacienteById(id_usuario: number): Promise<PacienteDetalladoParaEdicion | null> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log(`[DB getPacienteById] Buscando paciente con ID: ${id_usuario}`);

    const query = `
      SELECT
        u.id_usuario,
        u.primer_nombre,
        u.segundo_nombre,
        u.primer_apellido,
        u.segundo_apellido,
        u.correo,
        u.fecha_registro AS fecha_registro_usuario,
        u.nui,
        td.codigo AS tipo_documento_codigo,
        td.descripcion AS tipo_documento_descripcion,
        pa.codigo AS pais_codigo,
        pa.nombre AS pais_nombre,
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
      FROM usuarios u
      JOIN pacientes p ON u.id_usuario = p.id_usuario
      LEFT JOIN tiposdocumento td ON u.id_tipo_documento = td.id_tipo_documento
      LEFT JOIN paises pa ON u.id_pais = pa.id_pais
      WHERE u.id_usuario = ?;
    `;

    const result = await dbClient.sql(query, id_usuario);

    if (result && result.length > 0) {
      const pacienteData = result[0] as any; // Realiza un cast o mapeo más seguro si es necesario
      console.log(`[DB getPacienteById] Paciente encontrado:`, pacienteData);
      // Asegúrate de que los nombres de campo coincidan con la interfaz PacienteDetalladoParaEdicion
      // y lo que el frontend espera. El frontend espera 'email', la BD tiene 'correo'.
      // La API route (ApiPacienteIndividual) debe manejar este mapeo si es necesario.
      return {
        ...pacienteData,
        fecha_nacimiento: pacienteData.fecha_nacimiento ? pacienteData.fecha_nacimiento.split('T')[0] : null, // Asegurar formato YYYY-MM-DD
      } as PacienteDetalladoParaEdicion;
    } else {
      console.log(`[DB getPacienteById] Paciente con ID: ${id_usuario} no encontrado.`);
      return null;
    }
  } catch (error: any) {
    console.error(`[DB getPacienteById] Error obteniendo paciente con ID ${id_usuario}:`, error.message, error.stack);
    throw error; // Relanzar para que la API route lo maneje
  }
}

// Interfaz para los datos que vienen del frontend para actualizar.
// Coincide con la interfaz PacienteData en ApiPacienteIndividual.
interface UpdatePacienteData {
  primer_nombre?: string;
  segundo_nombre?: string | null;
  primer_apellido?: string;
  segundo_apellido?: string | null;
  fecha_nacimiento?: string | null; // Espera YYYY-MM-DD
  genero?: string | null;
  email?: string; // El frontend usa 'email'
  telefono_contacto?: string | null;
  direccion_residencial?: string | null;
  tipoDocumentoCodigo?: string;
  paisCodigo?: string;
  nui?: string;
  grupo_sanguineo?: string | null;
  ocupacion?: string | null;
  info_seguro_medico?: string | null;
  contacto_emergencia?: string | null;
}

export async function updatePaciente(id_usuario: number, data: UpdatePacienteData): Promise<PacienteDetalladoParaEdicion | null> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log(`[DB updatePaciente] Actualizando paciente ID: ${id_usuario} con datos:`, data);

    // 1. Obtener IDs para tipoDocumentoCodigo y paisCodigo (filtrando en JS, como en tus funciones de registro)
    let idTipoDocumento: number | undefined;
    if (data.tipoDocumentoCodigo) {
      const todosTiposDoc = await dbClient.sql('SELECT id_tipo_documento, codigo FROM tiposdocumento');
      const foundTipoDoc = Array.isArray(todosTiposDoc) ? todosTiposDoc.find(doc => doc.codigo === data.tipoDocumentoCodigo) : null;
      idTipoDocumento = foundTipoDoc?.id_tipo_documento;
      if (!idTipoDocumento) throw new Error(`Tipo de documento con código '${data.tipoDocumentoCodigo}' no encontrado.`);
    }

    let idPais: number | undefined;
    if (data.paisCodigo) {
      const todosPaises = await dbClient.sql('SELECT id_pais, codigo FROM paises');
      const foundPais = Array.isArray(todosPaises) ? todosPaises.find(p => p.codigo === data.paisCodigo) : null;
      idPais = foundPais?.id_pais;
      if (!idPais) throw new Error(`País con código '${data.paisCodigo}' no encontrado.`);
    }

    // 2. Actualizar tabla 'usuarios'
    // Construir dinámicamente la query de actualización para 'usuarios'
    const userFieldsToUpdate: string[] = [];
    const userValuesToUpdate: any[] = [];

    if (data.primer_nombre) { userFieldsToUpdate.push("primer_nombre = ?"); userValuesToUpdate.push(data.primer_nombre); }
    if (data.segundo_nombre !== undefined) { userFieldsToUpdate.push("segundo_nombre = ?"); userValuesToUpdate.push(data.segundo_nombre); } // Permite null
    if (data.primer_apellido) { userFieldsToUpdate.push("primer_apellido = ?"); userValuesToUpdate.push(data.primer_apellido); }
    if (data.segundo_apellido !== undefined) { userFieldsToUpdate.push("segundo_apellido = ?"); userValuesToUpdate.push(data.segundo_apellido); } // Permite null
    if (data.email) { userFieldsToUpdate.push("correo = ?"); userValuesToUpdate.push(data.email); } // BD usa 'correo'
    if (data.nui) { userFieldsToUpdate.push("nui = ?"); userValuesToUpdate.push(data.nui); }
    if (idTipoDocumento) { userFieldsToUpdate.push("id_tipo_documento = ?"); userValuesToUpdate.push(idTipoDocumento); }
    if (idPais) { userFieldsToUpdate.push("id_pais = ?"); userValuesToUpdate.push(idPais); }
    // Considerar añadir 'ultima_actividad = CURRENT_TIMESTAMP'

    if (userFieldsToUpdate.length > 0) {
      userValuesToUpdate.push(id_usuario); // Para la cláusula WHERE
      const updateUserQuery = `UPDATE usuarios SET ${userFieldsToUpdate.join(", ")} WHERE id_usuario = ?`;
      console.log(`[DB updatePaciente] Ejecutando actualización en usuarios: ${updateUserQuery} con params:`, userValuesToUpdate);
      await dbClient.sql(updateUserQuery, ...userValuesToUpdate);
    }

    // 3. Actualizar tabla 'pacientes'
    // Construir dinámicamente la query de actualización para 'pacientes'
    const patientFieldsToUpdate: string[] = [];
    const patientValuesToUpdate: any[] = [];

    if (data.fecha_nacimiento !== undefined) { patientFieldsToUpdate.push("fecha_nacimiento = ?"); patientValuesToUpdate.push(data.fecha_nacimiento); } // Permite null
    if (data.genero !== undefined) { patientFieldsToUpdate.push("genero = ?"); patientValuesToUpdate.push(data.genero); } // Permite null
    if (data.telefono_contacto !== undefined) { patientFieldsToUpdate.push("telefono_contacto = ?"); patientValuesToUpdate.push(data.telefono_contacto); }
    if (data.direccion_residencial !== undefined) { patientFieldsToUpdate.push("direccion_residencial = ?"); patientValuesToUpdate.push(data.direccion_residencial); }
    if (data.grupo_sanguineo !== undefined) { patientFieldsToUpdate.push("grupo_sanguineo = ?"); patientValuesToUpdate.push(data.grupo_sanguineo); }
    if (data.ocupacion !== undefined) { patientFieldsToUpdate.push("ocupacion = ?"); patientValuesToUpdate.push(data.ocupacion); }
    if (data.info_seguro_medico !== undefined) { patientFieldsToUpdate.push("info_seguro_medico = ?"); patientValuesToUpdate.push(data.info_seguro_medico); }
    if (data.contacto_emergencia !== undefined) { patientFieldsToUpdate.push("contacto_emergencia = ?"); patientValuesToUpdate.push(data.contacto_emergencia); }
    // Añadir más campos de la tabla 'pacientes' si son editables: alergias, antecedentes_medicos, historial_visitas

    if (patientFieldsToUpdate.length > 0) {
      patientValuesToUpdate.push(id_usuario); // Para la cláusula WHERE
      const updatePatientQuery = `UPDATE pacientes SET ${patientFieldsToUpdate.join(", ")} WHERE id_usuario = ?`;
      console.log(`[DB updatePaciente] Ejecutando actualización en pacientes: ${updatePatientQuery} con params:`, patientValuesToUpdate);
      await dbClient.sql(updatePatientQuery, ...patientValuesToUpdate);
    }

    console.log(`[DB updatePaciente] Paciente ID: ${id_usuario} actualizado.`);
    // Devolver el paciente actualizado llamando a getPacienteById
    return getPacienteById(id_usuario);

  } catch (error: any) {
    console.error(`[DB updatePaciente] Error actualizando paciente ID ${id_usuario}:`, error.message, error.stack);
    throw error; // Relanzar para que la API route lo maneje
  }
}

export async function deletePaciente(id_usuario: number): Promise<boolean> {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    console.log(`[DB deletePaciente] Intentando eliminar paciente con ID: ${id_usuario}`);

    // Paso 1: Eliminar de la tabla 'pacientes'
    // Esto es importante si 'pacientes' tiene FK a 'usuarios' sin ON DELETE CASCADE,
    // o si quieres asegurarte de que la lógica específica de paciente se ejecute primero.
    // Si 'pacientes.id_usuario' es solo una extensión y 'usuarios' es la tabla principal
    // con todas las cascadas, este paso podría ser redundante si la eliminación de 'usuarios' lo cubre.
    const pacienteDeleteResult = await dbClient.sql(
      `DELETE FROM pacientes WHERE id_usuario = ?`,
      id_usuario
    );
    console.log(`[DB deletePaciente] Resultado de eliminación en 'pacientes' para ID ${id_usuario}: ${pacienteDeleteResult?.changes ?? 0} filas afectadas.`);

    // Paso 2: Eliminar de la tabla 'usuarios'
    // Esto debería activar ON DELETE CASCADE para tablas como 'usuariosroles', 'usuarios_mfa_config', 'mfa_recovery_codes'.
    // Para 'diagnosticos' (donde id_paciente = id_usuario), 'medicos' (si el usuario es médico),
    // necesitarías ON DELETE CASCADE o eliminarlos manualmente ANTES de este paso si no está configurado.
    const usuarioDeleteResult = await dbClient.sql(
      `DELETE FROM usuarios WHERE id_usuario = ?`,
      id_usuario
    );
    console.log(`[DB deletePaciente] Resultado de eliminación en 'usuarios' para ID ${id_usuario}: ${usuarioDeleteResult?.changes ?? 0} filas afectadas.`);

    // Se considera exitoso si se eliminó el registro de la tabla 'usuarios'
    if (usuarioDeleteResult?.changes !== undefined && usuarioDeleteResult.changes > 0) {
      console.log(`[DB deletePaciente] Paciente con ID: ${id_usuario} eliminado exitosamente de 'usuarios'.`);
      return true;
    } else {
      // Podría ser que el paciente ya no existiera en 'usuarios' o que solo existiera en 'pacientes' (estado inconsistente)
      console.warn(`[DB deletePaciente] Paciente con ID: ${id_usuario} no encontrado en 'usuarios' o no se eliminó. Filas afectadas: ${usuarioDeleteResult?.changes ?? 0}.`);
      // Si la eliminación en 'pacientes' tuvo éxito pero en 'usuarios' no, podrías considerar esto un éxito parcial o un error.
      // Por ahora, basamos el éxito en la eliminación de 'usuarios'.
      return false;
    }

  } catch (error: any) {
    console.error(`[DB deletePaciente] Error eliminando paciente ID ${id_usuario}:`, error.message, error.stack);
    // Si el error es por restricción de FK, indica que ON DELETE CASCADE no está funcionando
    // o no está configurado para todas las tablas dependientes.
    if (error.message.toLowerCase().includes('foreign key constraint failed')) {
        console.error(`[DB deletePaciente] FALLO DE RESTRICCIÓN DE CLAVE FORÁNEA: Asegúrate que ON DELETE CASCADE esté configurado para todas las tablas que referencian a 'usuarios.id_usuario' (ej. diagnosticos, medicos, etc.) o elimina los registros dependientes manualmente ANTES de llamar a deletePaciente o dentro de esta función.`);
    }
    throw error; // Relanzar para que la API route lo maneje
  }
}

// Función para actualizar el perfil de usuario
export interface UpdateUserProfileData {
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  correo: string;
  id_especialidad?: number;
  numero_tarjeta_profesional?: string;
  años_experiencia?: number;
}

export async function updateUserProfile(firebaseUid: string, data: UpdateUserProfileData) {
  console.log('db.updateUserProfile - Iniciando actualización para usuario:', firebaseUid);
  
  const client = await getClient();
  console.log('db.updateUserProfile - Datos a actualizar:', data);

  try {
    // Validar que el usuario existe
    const [userExists] = await client.sql(
      'SELECT id_usuario, firebase_uid FROM usuarios WHERE firebase_uid = ?',
      [firebaseUid]
    );

    if (!userExists) {
      throw new Error('Usuario no encontrado');
    }

    const { id_usuario } = userExists;

    // Actualizar datos básicos del usuario
    await client.sql(
      `UPDATE usuarios 
       SET primer_nombre = ?, 
           segundo_nombre = ?, 
           primer_apellido = ?, 
           segundo_apellido = ?, 
           correo = ? 
       WHERE id_usuario = ?`,
      [
        data.primer_nombre,
        data.segundo_nombre,
        data.primer_apellido,
        data.segundo_apellido,
        data.correo,
        id_usuario
      ]
    );
    console.log('db.updateUserProfile - Datos básicos actualizados para usuario:', id_usuario);

    // Obtener datos actualizados para retornar
    const [updatedUser] = await client.sql(
      `SELECT * FROM usuarios WHERE id_usuario = ?`,
      [id_usuario]
    );

    console.log('db.updateUserProfile - Actualización completada exitosamente');
    return updatedUser;

  } catch (error) {
    console.error('db.updateUserProfile - Error:', error);
    throw error;
  }
}
