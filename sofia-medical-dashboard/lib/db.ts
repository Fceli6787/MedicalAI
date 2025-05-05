import { Database } from '@sqlitecloud/drivers';

let client: Database | null = null;

const getClient = async (): Promise<Database> => {
  if (client) {
    return client;
  }

  const dbUrl = process.env.NEXT_PUBLIC_SQLITECLOUD_URL;

  if (!dbUrl) {
    throw new Error('Missing SQLITECLOUD_URL environment variable');
  }

  try {
    client = new Database(dbUrl);
    console.log('SQLite Cloud client connected');
    return client;
  } catch (error) {
    console.error('Error connecting to SQLite Cloud:', error);
    throw error;
  }
};

export async function getConnection() {
  // En SQLite Cloud, no usamos un pool de conexiones de la misma manera que con MySQL.
  // El cliente maneja la conexión. Esta función simplemente devolverá el cliente conectado.
  return getClient();
}

export async function init() {
  if (typeof window !== 'undefined') {
    return;
  }
  try {
    const dbClient = await getClient();
    console.log('Database connected');

    // Verificar si las tablas existen (puedes verificar una tabla, como 'roles')
    // En SQLite, la forma de verificar la existencia de una tabla es diferente.
    // Podemos consultar la tabla sqlite_master.
    const tablesExistResult = await dbClient.sql(`SELECT name FROM sqlite_master WHERE type='table' AND name='roles'`);
    // Asumiendo que .rows es la propiedad correcta según el driver @sqlitecloud/drivers
    const tablesExist = tablesExistResult && tablesExistResult.length > 0;


    if (!tablesExist) {
      console.error('Tables do not exist, attempting to initialize...');
      // Aquí deberías tener la lógica para crear las tablas si no existen.
      // Como el usuario mencionó que eliminó el db.ts anterior, asumo que la inicialización
      // de la base de datos (creación de tablas, etc.) se maneja externamente o en otro lugar.
      // Si necesitas que la lógica de creación de tablas esté aquí, por favor indícalo.
      console.log('Database initialization logic adjusted. Ensure database is initialized externally.');
    } else {
      console.log('Tables exist');
      // Verificar y crear roles si no existen
      const rolesToEnsure = ['admin', 'medico', 'paciente'];
      for (const roleName of rolesToEnsure) {
        const roleRows = await dbClient.sql(`SELECT id_rol FROM roles WHERE nombre = ?`, [roleName]);
        // Asumiendo que .rows es la propiedad correcta
        if (roleRows && roleRows.length === 0) {
          await dbClient.sql(`INSERT INTO roles (nombre) VALUES (?)`, [roleName]);
          console.log(`Rol '${roleName}' creado.`);
        }
      }

      const adminEmail = 'admin@example.com';
      const adminUid = 'ADMIN';
      const adminRole = 'admin';

      // Check if admin user exists
      const adminUserRows = await dbClient.sql(`SELECT id_usuario FROM usuarios WHERE correo = ?`, [adminEmail]);
      // Asumiendo que .rows es la propiedad correcta
      if (adminUserRows && adminUserRows.length === 0) {
        // Insert admin user
        // Nota: Las subconsultas en INSERT VALUES pueden no ser soportadas directamente en SQLite de la misma manera que en MySQL.
        // Adaptaremos esto para obtener los IDs primero.
        const tipoDocumentoResult = await dbClient.sql(`SELECT id_tipo_documento FROM tiposdocumento WHERE codigo = 'CC'`);
        const idTipoDocumento = tipoDocumentoResult?.[0]?.id_tipo_documento;

        const paisResult = await dbClient.sql(`SELECT id_pais FROM paises WHERE codigo = 'COL'`);
        const idPais = paisResult?.[0]?.id_pais;


        if (!idTipoDocumento || !idPais) {
           console.error('Could not find default tiposdocumento or paises for admin user creation.');
           // Dependiendo de si estos campos son NOT NULL, podrías necesitar lanzar un error o manejarlo de otra manera.
           // Por ahora, solo logueamos un error y no creamos el admin si faltan.
        } else {
            // Usamos RETURNING para obtener el id del nuevo usuario, si SQLite Cloud y el driver lo soportan
            const insertResult = await dbClient.sql(
              `INSERT INTO usuarios (id_tipo_documento, id_pais, nui, primer_nombre, primer_apellido, correo, firebase_uid, estado) VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo') RETURNING id_usuario`,
              [idTipoDocumento, idPais, '1234567890', 'Admin', 'Admin', adminEmail, adminUid]
            );

            const adminUserId = insertResult?.[0]?.id_usuario;

            if (adminUserId) {
                // Usar subconsulta para obtener id_rol
                await dbClient.sql(`INSERT INTO usuariosroles (id_usuario, id_rol) VALUES (?, (SELECT id_rol FROM roles WHERE nombre = ?))`, [adminUserId, adminRole]);
                console.log('Admin user and role assignment created.');
            } else {
                console.error('Failed to retrieve new admin user ID after insertion.');
                // Considerar si se debe hacer ROLLBACK si se está en una transacción
            }
        }
      } else {
         console.log('Admin user already exists.');
      }
    }

  } catch (error) {
    console.error('Error during database initialization check:', error);
    throw error; // Relanzar el error para que sea visible
  }
}


/**
 * Retrieves all users from the database.
 * @returns An array of user objects.
 */
export const getUsers = async (): Promise<any[]> => {
  try {
    const dbClient = await getConnection();
    const result = await dbClient.sql('SELECT * FROM usuarios');
    // Asumiendo que el resultado es directamente el array de filas
    return result || [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

/**
 * Registers a new medical user in the database.
 * Inserts data into usuarios, usuariosroles (with 'medico' role), and medicos tables.
 * @param userData The user and medical data.
 * @returns The ID of the newly created user.
 */
export const registerMedico = async (userData: {
  tipoDocumentoCodigo: string; // Cambiado de id_tipo_documento: number
  paisCodigo: string; // Cambiado de id_pais: number
  nui: string;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  correo: string;
  firebase_uid: string;
  id_especialidad: number; // Se mantiene como ID, asumiendo que la especialidad se selecciona por ID
  numero_tarjeta_profesional: string;
  años_experiencia?: number | null;
}): Promise<number> => {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();

    // Obtener id_tipo_documento a partir del código
    const tipoDocumentoResult = await dbClient.sql(`SELECT id_tipo_documento FROM tiposdocumento WHERE codigo = ?`, [userData.tipoDocumentoCodigo]);
    const idTipoDocumento = tipoDocumentoResult?.[0]?.id_tipo_documento;
    if (!idTipoDocumento) {
      throw new Error(`Tipo de documento con código '${userData.tipoDocumentoCodigo}' no encontrado.`);
    }

    // Obtener id_pais a partir del código
    const paisResult = await dbClient.sql(`SELECT id_pais FROM paises WHERE codigo = ?`, [userData.paisCodigo]);
    const idPais = paisResult?.[0]?.id_pais;
    if (!idPais) {
      throw new Error(`País con código '${userData.paisCodigo}' no encontrado.`);
    }

    // 1. Insertar en la tabla usuarios
    // Usar RETURNING para obtener el ID, si el driver lo soporta.
    const insertUserResult = await dbClient.sql(
      `INSERT INTO usuarios (id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo') RETURNING id_usuario`,
      [
        idTipoDocumento, // Usar el ID obtenido
        idPais, // Usar el ID obtenido
        userData.nui,
        userData.primer_nombre,
        userData.segundo_nombre || null,
        userData.primer_apellido,
        userData.segundo_apellido || null,
        userData.correo,
        userData.firebase_uid,
      ]
    );
    const newUserId = insertUserResult?.[0]?.id_usuario;

    if (!newUserId) {
      throw new Error('Failed to retrieve new user ID after insertion.');
    }

    // 2. Asignar el rol 'medico' en usuariosroles (Esta parte ya consulta por nombre)
    const roleRows = await dbClient.sql(`SELECT id_rol FROM roles WHERE nombre = ?`, ['medico']);
    const medicoRoleId = roleRows?.[0]?.id_rol;

    if (!medicoRoleId) {
      throw new Error('Role \'medico\' not found');
    }

    await dbClient.sql(`INSERT INTO usuariosroles (id_usuario, id_rol) VALUES (?, ?)`, [newUserId, medicoRoleId]);

    // 3. Insertar en la tabla medicos (Esta parte aún espera id_especialidad, lo cual parece razonable)
    await dbClient.sql(
      `INSERT INTO medicos (id_usuario, id_especialidad, numero_tarjeta_profesional, fecha_ingreso, años_experiencia) VALUES (?, ?, ?, DATE('now'), ?)`, // DATE('now') para fecha_ingreso en SQLite
      [
        newUserId,
        userData.id_especialidad,
        userData.numero_tarjeta_profesional,
        userData.años_experiencia || null,
      ]
    );

    return newUserId; // Devolver el ID del nuevo usuario
  } catch (error) {
    console.error('Error registering medico:', error);
    throw error;
  }
};


/**
 * Adds a new basic user to the database with minimal information.
 * Assigns a default 'paciente' role.
 * @param user The basic user object to add.
 * @returns The ID of the newly created user.
 */
export const addBasicUser = async (user: {
  tipoDocumentoCodigo: string; // Agregado
  paisCodigo: string; // Agregado
  primer_nombre: string;
  primer_apellido: string;
  correo: string;
  firebase_uid: string;
}): Promise<number> => {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();

    // Obtener id_tipo_documento a partir del código
    const tipoDocumentoResult = await dbClient.sql(`SELECT id_tipo_documento FROM tiposdocumento WHERE codigo = ?`, [user.tipoDocumentoCodigo]);
    const idTipoDocumento = tipoDocumentoResult?.[0]?.id_tipo_documento;
    if (!idTipoDocumento) {
      throw new Error(`Tipo de documento con código '${user.tipoDocumentoCodigo}' no encontrado.`);
    }

    // Obtener id_pais a partir del código
    const paisResult = await dbClient.sql(`SELECT id_pais FROM paises WHERE codigo = ?`, [user.paisCodigo]);
    const idPais = paisResult?.[0]?.id_pais;
    if (!idPais) {
      throw new Error(`País con código '${user.paisCodigo}' no encontrado.`);
    }

    const insertUserResult = await dbClient.sql(
      `INSERT INTO usuarios (id_tipo_documento, id_pais, nui, primer_nombre, primer_apellido, correo, firebase_uid, estado) VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo') RETURNING id_usuario`,
      [
        idTipoDocumento, // Usar el ID obtenido
        idPais, // Usar el ID obtenido
        `temp_${user.firebase_uid}`, // NUI temporal único
        user.primer_nombre,
        user.primer_apellido,
        user.correo,
        user.firebase_uid,
      ]
    );
    const newUserId = insertUserResult?.[0]?.id_usuario;

    if (!newUserId) {
      throw new Error('Failed to retrieve new user ID after insertion.');
    }

    // Asignar rol 'paciente' por defecto (Esta parte ya consulta por nombre)
    const roleRows = await dbClient.sql(`SELECT id_rol FROM roles WHERE nombre = ?`, ['paciente']);
    const roleId = roleRows?.[0]?.id_rol;

    if (!roleId) {
      throw new Error('Role \'paciente\' not found');
    }

    await dbClient.sql(`INSERT INTO usuariosroles (id_usuario, id_rol) VALUES (?, ?)`, [newUserId, roleId]);

    return newUserId; // Devolver el ID del nuevo usuario
  } catch (error) {
    console.error('Error adding basic user:', error);
    throw error;
  }
};


/**
 * Adds a new user to the database with full information.
 * This function might be used for admin-level user creation or updates.
 * @param user The user object to add.
 * @returns void.
 */
export const addUser = async (user: {
  tipoDocumentoCodigo: string; // Cambiado de id_tipo_documento: number
  paisCodigo: string; // Cambiado de id_pais: number
  nui: string;
  primer_nombre: string;
  segundo_nombre?: string | null; // Permitir null explícitamente
  primer_apellido: string;
  segundo_apellido?: string | null; // Permitir null explícitamente
  correo: string;
  firebase_uid: string;
  rol?: string; // Rol es opcional aquí (nombre del rol)
}): Promise<void> => {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();

    // Obtener id_tipo_documento a partir del código
    const tipoDocumentoResult = await dbClient.sql(`SELECT id_tipo_documento FROM tiposdocumento WHERE codigo = ?`, [user.tipoDocumentoCodigo]);
    const idTipoDocumento = tipoDocumentoResult?.[0]?.id_tipo_documento;
    if (!idTipoDocumento) {
      throw new Error(`Tipo de documento con código '${user.tipoDocumentoCodigo}' no encontrado.`);
    }

    // Obtener id_pais a partir del código
    const paisResult = await dbClient.sql(`SELECT id_pais FROM paises WHERE codigo = ?`, [user.paisCodigo]);
    const idPais = paisResult?.[0]?.id_pais;
    if (!idPais) {
      throw new Error(`País con código '${user.paisCodigo}' no encontrado.`);
    }

    const insertUserResult = await dbClient.sql(
      `INSERT INTO usuarios (id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo') RETURNING id_usuario`,
      [
        idTipoDocumento, // Usar el ID obtenido
        idPais, // Usar el ID obtenido
        user.nui,
        user.primer_nombre,
        user.segundo_nombre || null,
        user.primer_apellido,
        user.segundo_apellido || null,
        user.correo,
        user.firebase_uid,
      ]
    );
    const newUserId = insertUserResult?.[0]?.id_usuario;

    if (!newUserId) {
        throw new Error('Failed to retrieve new user ID after full insertion.');
    }

    // Obtener el id_rol basado en el nombre del rol proporcionado o un valor por defecto si es necesario (Esta parte ya consulta por nombre)
    const roleNameToSearch = user.rol || 'paciente';
    const roleRows = await dbClient.sql(`SELECT id_rol FROM roles WHERE nombre = ?`, [roleNameToSearch]);
    const roleId = roleRows?.[0]?.id_rol;

    if (!roleId) {
        throw new Error(`Role '${roleNameToSearch}' not found`);
    }

    // Insertar en usuariosroles usando el id_rol
    await dbClient.sql(`INSERT INTO usuariosroles (id_usuario, id_rol) VALUES (?, ?)`, [newUserId, roleId]);

  } catch (error) {
    console.error('Error adding user (full):', error);
    throw error;
  }
};


/**
 * Retrieves all patients from the SQL database.
 * @returns An array of patient objects.
 */
export const getPacientes = async (): Promise<any[]> => {
  try {
    const dbClient = await getConnection();
    // Adaptado para usar nombres de tabla en minúsculas y JOIN.
    const result = await dbClient.sql(`
      SELECT
        p.id_paciente,
        u.primer_nombre,
        u.segundo_nombre,
        u.primer_apellido,
        u.segundo_apellido,
        u.correo,
        u.fecha_registro,
        p.grupo_sanguineo,
        p.rh,
        p.alergias,
        p.antecedentes_medicos,
        p.id_eps,
        p.fecha_nacimiento,
        p.genero,
        p.estado_civil,
        p.numero_contacto
      FROM pacientes p
      JOIN usuarios u ON p.id_paciente = u.id_usuario
    `);
    // Asumiendo que el resultado es directamente el array de filas
    return result || [];
  } catch (error) {
    console.error('Error getting patients:', error);
    return [];
  }
};


/**
 * Retrieves all diagnostics from the SQL database.
 * @returns An array of diagnostic objects.
 */
export const getDiagnosticos = async (): Promise<any[]> => {
  try {
    const dbClient = await getConnection();
    const result = await dbClient.sql('SELECT * FROM diagnosticos');
    // Asumiendo que el resultado es directamente el array de filas
    return result || [];
  } catch (error) {
    console.error('Error getting diagnostics:', error);
    return [];
  }
};

/**
 * Adds a new patient to the SQL database.
 * @param paciente The patient object to add.
 * @returns void.
 */
export const addPaciente = async (paciente: any): Promise<void> => {
  // Asegúrate de que el objeto 'paciente' contenga todas las columnas requeridas por la tabla 'pacientes'
  // y que los nombres de las claves coincidan exactamente con los nombres de las columnas.
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    // Construcción dinámica de la consulta INSERT
    const columns = Object.keys(paciente).join(', ');
    const placeholders = Object.keys(paciente).map(() => '?').join(', ');
    const values = Object.values(paciente);

    // Asegúrate de que la tabla es 'pacientes'
    await dbClient.sql(`INSERT INTO pacientes (${columns}) VALUES (${placeholders})`, values);
  } catch (error) {
    console.error('Error adding patient:', error);
    throw error; // Lanzar el error para que sea manejado por el código que llama
  }
};

/**
 * Adds a new diagnostic to the SQL database.
 * @param diagnostico The diagnostic object to add.
 * @returns void.
 */
export const addDiagnostico = async (diagnostico: {
  id_paciente: number;
  id_medico: number;
  tipoExamenNombre: string; // Cambiado para recibir el nombre del tipo de examen
  resultado: string;
  nivel_confianza: number;
}): Promise<void> => {
  let dbClient: Database | undefined;
  try {
    dbClient = await getConnection();
    // await dbClient.sql('BEGIN TRANSACTION'); // Descomentar si es necesario

    // Obtener el id_tipo_examen basado en el nombre
    // Asegúrate de que la tabla es 'tiposexamen'
    const tipoExamenRows = await dbClient.sql(`SELECT id_tipo_examen FROM tiposexamen WHERE nombre = ?`, [diagnostico.tipoExamenNombre]);
    const tipoExamenId = tipoExamenRows?.[0]?.id_tipo_examen;

    if (!tipoExamenId) {
      // await dbClient.sql('ROLLBACK'); // Descomentar si se usa transacción explícita
      throw new Error(`Tipo de examen '${diagnostico.tipoExamenNombre}' no encontrado`);
    }

    const diagnosticoToInsert = {
      id_paciente: diagnostico.id_paciente,
      id_medico: diagnostico.id_medico,
      id_tipo_examen: tipoExamenId, // Usar el ID obtenido
      resultado: diagnostico.resultado,
      nivel_confianza: diagnostico.nivel_confianza,
      fecha_diagnostico: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD para SQLite
    };

    // Construcción dinámica de la consulta INSERT
    const columns = Object.keys(diagnosticoToInsert).join(', ');
    const placeholders = Object.keys(diagnosticoToInsert).map(() => '?').join(', ');
    const values = Object.values(diagnosticoToInsert);

    // Asegúrate de que la tabla es 'diagnosticos'
    await dbClient.sql(`INSERT INTO diagnosticos (${columns}) VALUES (${placeholders})`, values);

    // await dbClient.sql('COMMIT'); // Descomentar si se usa transacción explícita
  } catch (error) {
    console.error('Error adding diagnostic:', error);
    // if (dbClient) { // Descomentar si se usa transacción explícita
    //     await dbClient.sql('ROLLBACK');
    // }
    throw error; // Lanzar el error para que sea manejado por el código que llama
  }
};

/**
 * Retrieves a user from the SQL database by their Firebase UID.
 * @param firebaseUid The Firebase UID of the user to retrieve.
 * @returns The user object if found, including roles.
 */
export const getUserByFirebaseUid = async (firebaseUid: string): Promise<any | null> => {
  try {
    const dbClient = await getConnection();
    // Obtener los datos básicos del usuario
    // Asegúrate de que la tabla es 'usuarios'
    const userResult = await dbClient.sql(
      `SELECT id_usuario, id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, fecha_registro, ultima_actividad, estado, firebase_uid FROM usuarios WHERE firebase_uid = ?`,
      [firebaseUid]
    );
    // Asumiendo que el resultado es un array y queremos el primer elemento
    const user = userResult?.[0];

    if (!user) {
      return null;
    }

    // Obtener los roles del usuario
    // Asegúrate de que las tablas son 'roles' y 'usuariosroles'
    const roleResult = await dbClient.sql(
      `SELECT r.nombre FROM roles r JOIN usuariosroles ur ON r.id_rol = ur.id_rol WHERE ur.id_usuario = ?`,
      [user.id_usuario]
    );
    // Asumiendo que roleResult es un array de objetos { nombre: string }
    const roles = roleResult?.map((row: { nombre: string }) => row.nombre) || [];

    // Devolver el objeto de usuario con un array de roles
    return { ...user, roles };
  } catch (error) {
    console.error('Error al obtener usuario por Firebase UID:', error);
    return null;
  }
};

/**
 * Retrieves a user from the SQL database by their email.
 * This implementation avoids using WHERE correo = ? directly in the initial query
 * by fetching all users and filtering in application code.
 * NOTE: This approach is less efficient for large databases compared to a direct WHERE clause.
 * @param email The email of the user to retrieve.
 * @returns The user object if found, including roles.
 */
export const getUser = async (email: string): Promise<any | null> => {
  try {
    const dbClient = await getConnection();
    console.log(`Attempting to find user with email: ${email}`);

    // Obtener todos los usuarios para filtrar en la aplicación
    // Seleccionamos solo las columnas necesarias para evitar cargar datos innecesarios
    const allUsersResult = await dbClient.sql(
      `SELECT id_usuario, id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, fecha_registro, ultima_actividad, estado, firebase_uid FROM usuarios`
    );

    console.log('Fetched all users result type:', typeof allUsersResult);
    console.log('Fetched all users result (first 5):', Array.isArray(allUsersResult) ? allUsersResult.slice(0, 5) : allUsersResult); // Log solo los primeros 5 para evitar logs extensos

    let allUsers: any[] = [];

    // Adaptar la extracción de resultados según el tipo de respuesta del driver
    if (Array.isArray(allUsersResult)) {
      allUsers = allUsersResult;
    } else if (allUsersResult && typeof allUsersResult === 'object') {
      if (Array.isArray(allUsersResult.rows)) {
        allUsers = allUsersResult.rows;
      } else if (Array.isArray(allUsersResult._rows)) {
        allUsers = allUsersResult._rows;
      }
    }

    console.log(`Total users fetched: ${allUsers.length}`);

    // Buscar el usuario por correo en la lista obtenida
    const user = allUsers.find(u => u.correo === email);

    if (!user) {
      console.log(`User with email ${email} not found in fetched list.`);
      return null;
    }

    console.log('User found:', user);

    // Obtener los roles del usuario encontrado
    // Asegúrate de que las tablas son 'roles' y 'usuariosroles'
    const roleResult = await dbClient.sql(
      `SELECT r.nombre FROM roles r JOIN usuariosroles ur ON r.id_rol = ur.id_rol WHERE ur.id_usuario = ?`,
      [user.id_usuario]
    );
    console.log('Role query result:', roleResult);
    // Asumiendo que roleResult es un array de objetos { nombre: string }
    const roles = roleResult?.map((row: { nombre: string }) => row.nombre) || [];
    console.log('User roles:', roles);

    return { ...user, roles };
  } catch (error) {
    console.error('Error al obtener usuario por email (filtrando en app):', error);
    return null;
  }
};
