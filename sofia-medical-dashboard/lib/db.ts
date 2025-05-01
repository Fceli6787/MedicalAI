import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

const getPool = async (): Promise<mysql.Pool> => {
  if (pool) return pool;

  const dbConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  // Verificar que las variables de entorno necesarias estén definidas
  if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
      throw new Error('Missing one or more MySQL environment variables (MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE)');
  }


  pool = mysql.createPool(dbConfig as mysql.PoolOptions);

  return pool;
};

export async function getConnection() {
    if (!pool) {
        const dbConfig = {
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };

        if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
            throw new Error('Missing one or more MySQL environment variables (MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE)');
        }

        pool = mysql.createPool(dbConfig as mysql.PoolOptions);
    }
    return pool;
}

export async function init() {


    if (typeof window !== 'undefined') {

        return;
    }

    try {

        const pool = await getPool();
        const connection = await pool.getConnection();
        console.log('Database connected');
        // Check if tables exist (you can check for one table, like 'Roles')
        await connection.query('SELECT 1 FROM Roles');
        console.log('Tables exist');
        connection.release();
    } catch (error) {
        console.error('Tables do not exist, creating them:', error);

       const pool = await getPool();
        const connection = await pool.getConnection();

        try {
            // Verificar y crear roles si no existen
            const rolesToEnsure = ['admin', 'medico', 'paciente']; // Asegurar que 'medico' y 'paciente' se crean
            for (const roleName of rolesToEnsure) {
                const [roleRows] = await connection.query(
                    'SELECT id_rol FROM Roles WHERE nombre = ?',
                    [roleName]
                );
                if ((roleRows as any[]).length === 0) {
                    await connection.query('INSERT INTO Roles (nombre) VALUES (?)', [roleName]);
                    console.log(`Rol '${roleName}' creado.`);
                }
            }

            const adminEmail = 'admin@example.com';
            const adminUid = 'ADMIN';
            const adminRole = 'admin';

            // Check if admin user exists
            const [adminUserRows] = await connection.query(
                'SELECT id_usuario FROM Usuarios WHERE correo = ?',
                [adminEmail]
            );

            if ((adminUserRows as any[]).length === 0) {
                // Insert admin user
                await connection.query(
                    'INSERT INTO Usuarios (id_tipo_documento, id_pais, nui, primer_nombre, primer_apellido, correo, firebase_uid, estado) VALUES ((SELECT id_tipo_documento FROM TiposDocumento WHERE codigo = \'CC\'), (SELECT id_pais FROM Paises WHERE codigo = \'COL\'), \'1234567890\', \'Admin\', \'Admin\', ?, ?, \'Activo\')',
                    [adminEmail, adminUid]
                );
                const [newAdminUser] = await connection.query('SELECT id_usuario FROM Usuarios WHERE correo = ?', [adminEmail]);
                const adminUserId = (newAdminUser as any)[0].id_usuario;
                await connection.query('INSERT INTO UsuariosRoles (id_usuario, id_rol) VALUES (?, (SELECT id_rol FROM Roles WHERE nombre = ?))', [adminUserId, adminRole]);
           }
            // Eliminada la importación y ejecución de database.sql según la retroalimentación del usuario.
            console.log('Database initialization logic adjusted. Ensure database is initialized via shell.');
        } catch (error) {
            console.error('Error during database initialization check:', error);
            throw error; // Relanzar el error para que sea visible
        } finally {
            connection.release();
        }
    }

}

/**
 * Retrieves all users from the database.
 * @returns An array of user objects.
 */
export const getUsers = async (): Promise<any[]> => {
  try {
       const pool = await getConnection();
       const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM Usuarios');
    connection.release();
    return rows as any[];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

/**
 * Registers a new medical user in the database.
 * Inserts data into Usuarios, UsuariosRoles (with 'medico' role), and Medicos tables.
 * @param userData The user and medical data.
 * @returns The ID of the newly created user.
 */
export const registerMedico = async (userData: {
  id_tipo_documento: number;
  id_pais: number;
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
  let connection;
  try {
    const pool = await getConnection();
    connection = await pool.getConnection();
    await connection.beginTransaction(); // Iniciar transacción

    // 1. Insertar en la tabla Usuarios
    await connection.query(
      'INSERT INTO Usuarios (id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, \'Activo\')',
      [
        userData.id_tipo_documento,
        userData.id_pais,
        userData.nui,
        userData.primer_nombre,
        userData.segundo_nombre || null,
        userData.primer_apellido,
        userData.segundo_apellido || null,
        userData.correo,
        userData.firebase_uid,
      ]
    );

    const [newUser] = await connection.query('SELECT id_usuario FROM Usuarios WHERE correo = ?', [userData.correo]);
    const newUserId = (newUser as any)[0]?.id_usuario;

    if (!newUserId) {
        await connection.rollback();
        throw new Error('Failed to retrieve new user ID after insertion.');
    }

    // 2. Asignar el rol 'medico' en UsuariosRoles
    const [roleRows] = await connection.query(
      'SELECT id_rol FROM Roles WHERE nombre = ?',
      ['medico']
    );
    const medicoRoleId = (roleRows as any)[0]?.id_rol;

    if (!medicoRoleId) {
        await connection.rollback();
        throw new Error('Role \'medico\' not found');
    }

    await connection.query(
        'INSERT INTO UsuariosRoles (id_usuario, id_rol) VALUES (?, ?)',
        [newUserId, medicoRoleId]
    );

    // 3. Insertar en la tabla Medicos
    await connection.query(
      'INSERT INTO Medicos (id_usuario, id_especialidad, numero_tarjeta_profesional, fecha_ingreso, años_experiencia) VALUES (?, ?, ?, CURDATE(), ?)', // CURDATE() para fecha_ingreso
      [
        newUserId,
        userData.id_especialidad,
        userData.numero_tarjeta_profesional,
        userData.años_experiencia || null,
      ]
    );

    await connection.commit(); // Confirmar transacción

    connection.release();
    return newUserId; // Devolver el ID del nuevo usuario

  } catch (error) {
    if (connection) {
      await connection.rollback(); // Revertir cambios en caso de error
      connection.release();
    }
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
  primer_nombre: string;
  primer_apellido: string;
  correo: string;
  firebase_uid: string;
}): Promise<number> => {
  let connection;
  try {
    const pool = await getConnection();
    connection = await pool.getConnection();

    // Insert basic user info into Usuarios table
    // Usamos valores por defecto o placeholders para los campos NOT NULL que no se proporcionan inicialmente
    // Asumiendo que id_tipo_documento y id_pais tienen valores por defecto o se pueden usar IDs de valores predefinidos (ej. 1 para un tipo de documento y país por defecto)
    // NUI podría ser un string vacío o un valor por defecto si la DB lo permite y no es UNIQUE NOT NULL sin valor por defecto
    // Si NUI es UNIQUE NOT NULL, necesitaríamos un valor único temporal o reconsiderar el esquema de la DB.
    // Por ahora, asumiré que podemos usar valores por defecto o que la DB permite inserciones parciales si hay valores por defecto definidos.
    // Si la DB requiere id_tipo_documento, id_pais, nui como NOT NULL sin valores por defecto, esta inserción fallará.
    // Basado en database.sql, id_tipo_documento, id_pais, nui son NOT NULL. Necesitamos proporcionar valores.
    // Usaré IDs 1 para tipo de documento y país por defecto, y un NUI temporal basado en firebase_uid.
    await connection.query(
      'INSERT INTO Usuarios (id_tipo_documento, id_pais, nui, primer_nombre, primer_apellido, correo, firebase_uid, estado) VALUES (?, ?, ?, ?, ?, ?, ?, \'Activo\')',
      [
        1, // ID por defecto para tipo de documento (ej. 'CC')
        1, // ID por defecto para país (ej. 'Colombia')
        `temp_${user.firebase_uid}`, // NUI temporal único
        user.primer_nombre,
        user.primer_apellido,
        user.correo,
        user.firebase_uid,
      ]
    );

    const [newUser] = await connection.query('SELECT id_usuario FROM Usuarios WHERE correo = ?', [user.correo]);
    const newUserId = (newUser as any)[0]?.id_usuario;

    if (!newUserId) {
        throw new Error('Failed to retrieve new user ID after insertion.');
    }

    // Assign default 'paciente' role
    const [roleRows] = await connection.query(
      'SELECT id_rol FROM Roles WHERE nombre = ?',
      ['paciente'] // Asignar rol 'paciente' por defecto
    );
    const roleId = (roleRows as any)[0]?.id_rol;

    if (!roleId) {
        throw new Error('Role \'paciente\' not found');
    }

    await connection.query('INSERT INTO UsuariosRoles (id_usuario, id_rol) VALUES (?, ?)', [newUserId, roleId]);

    connection.release();
    return newUserId; // Devolver el ID del nuevo usuario
  } catch (error) {
    console.error('Error adding basic user:', error);
    if (connection) connection.release();
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
  id_tipo_documento: number;
  id_pais: number;
  nui: string;
  primer_nombre: string;
  segundo_nombre?: string | null; // Permitir null explícitamente
  primer_apellido: string;
  segundo_apellido?: string | null; // Permitir null explícitamente
  correo: string;
  firebase_uid: string;
  rol?: string; // Rol es opcional aquí
}): Promise<void> => {
  let connection;
  try {
    const pool = await getConnection();
    connection = await pool.getConnection();
    await connection.query(
        'INSERT INTO Usuarios (id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, \'Activo\')',
        [
          user.id_tipo_documento,
          user.id_pais,
          user.nui,
          user.primer_nombre,
          user.segundo_nombre,
          user.primer_apellido,
          user.segundo_apellido,
          user.correo,
          user.firebase_uid,
        ]
    );
    const [newUser] = await connection.query('SELECT id_usuario FROM Usuarios WHERE correo = ?', [user.correo]);
    const newUserId = (newUser as any)[0]?.id_usuario;

    if (!newUserId) {
        throw new Error('Failed to retrieve new user ID after full insertion.');
    }

    // Obtener el id_rol basado en el nombre del rol proporcionado o un valor por defecto si es necesario
    const roleNameToSearch = user.rol || 'paciente'; // Usar 'paciente' si no se proporciona rol
    const [roleRows] = await connection.query(
        'SELECT id_rol FROM Roles WHERE nombre = ?',
        [roleNameToSearch]
    );
    const roleId = (roleRows as any)[0]?.id_rol;

    if (!roleId) {
        throw new Error(`Role '${roleNameToSearch}' not found`);
    }

    // Insertar en UsuariosRoles usando el id_rol
    await connection.query('INSERT INTO UsuariosRoles (id_usuario, id_rol) VALUES (?, ?)', [newUserId, roleId]);
    connection.release();
  } catch (error) {
    console.error('Error adding user (full):', error);
    if (connection) connection.release();
    throw error;
  }
};


/**
 * Retrieves all patients from the SQL database.
 * @returns An array of patient objects.
 */
export const getPacientes = async (): Promise<any[]> => {
  try {
       const pool = await getConnection();
       const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT
          p.id_paciente,
          u.primer_nombre,
          u.segundo_nombre,
          u.primer_apellido,
          u.segundo_apellido,
          u.correo,
          u.fecha_registro,
          p.grupo_sanguineo,
          p.alergias,
          p.antecedentes_medicos,
          (SELECT COUNT(*) FROM Diagnosticos d WHERE d.id_paciente = p.id_paciente) AS diagnosticosTotales,
          (SELECT MAX(fecha_diagnostico) FROM Diagnosticos d WHERE d.id_paciente = p.id_paciente) AS ultimo_diagnostico
      FROM Pacientes p
      JOIN Usuarios u ON p.id_paciente = u.id_usuario
    `);
    connection.release();
    return rows as any[];
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
      const pool = await getConnection();
      const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM Diagnosticos');
    connection.release();
    return rows as any[];
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
  try {
      const pool = await getConnection();
      const connection = await pool.getConnection();
    await connection.query('INSERT INTO Pacientes SET ?', paciente);
    connection.release();
  } catch (error) {
    console.error('Error adding patient:', error);
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
  try {
       const pool = await getConnection();
       const connection = await pool.getConnection();

    // Obtener el id_tipo_examen basado en el nombre
    const [tipoExamenRows] = await connection.query(
        'SELECT id_tipo_examen FROM TiposExamen WHERE nombre = ?',
        [diagnostico.tipoExamenNombre]
    );

    const tipoExamenId = (tipoExamenRows as any)[0]?.id_tipo_examen;

    if (!tipoExamenId) {
        throw new Error(`Tipo de examen '${diagnostico.tipoExamenNombre}' no encontrado`);
    }

    const diagnosticoToInsert = {
      id_paciente: diagnostico.id_paciente,
      id_medico: diagnostico.id_medico,
      id_tipo_examen: tipoExamenId, // Usar el ID obtenido
      resultado: diagnostico.resultado,
      nivel_confianza: diagnostico.nivel_confianza,
    };

    await connection.query('INSERT INTO Diagnosticos SET ?', diagnosticoToInsert);
    connection.release();
  } catch (error) {
    console.error('Error adding diagnostic:', error);
    throw error; // Lanzar el error para que sea manejado por el código que llama
  }
};

/**
 * Retrieves a user from the SQL database by their Firebase UID.
 * @param firebaseUid The Firebase UID of the user to retrieve.
 * @returns The user object if found.
 */
export const getUserByFirebaseUid = async (firebaseUid: string): Promise<any | null> => {
  try {
    const pool = await getConnection();
    const connection = await pool.getConnection();

    // Obtener los datos básicos del usuario
    const [userRows] = await connection.query(
      `SELECT 
        id_usuario, 
        id_tipo_documento,
        id_pais,
        nui,
        primer_nombre, 
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        correo, 
        fecha_registro,
        ultima_actividad,
        estado,
        firebase_uid
      FROM Usuarios
      WHERE firebase_uid = ?`,
      [firebaseUid]
    );

    const user = (userRows as any[])[0];

    if (!user) {
      connection.release();
      return null;
    }

    // Obtener los roles del usuario
    const [roleRows] = await connection.query(
      `SELECT r.nombre 
      FROM Roles r
      JOIN UsuariosRoles ur ON r.id_rol = ur.id_rol
      WHERE ur.id_usuario = ?`,
      [user.id_usuario]
    );

    const roles = (roleRows as any[]).map(row => row.nombre);

    connection.release();

    // Devolver el objeto de usuario con un array de roles
    return { ...user, roles };

  } catch (error) {
    console.error('Error al obtener usuario por Firebase UID:', error);
    return null;
  }
};


/**
 * Retrieves a user from the SQL database by their email.
 * @param email The email of the user to retrieve.
 * @returns The user object if found.
 */
export const getUser = async (email: string): Promise<any | null> => {
  try {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT 
        u.id_usuario, 
        u.correo, 
        u.primer_nombre, 
        u.primer_apellido,
        u.estado,
        r.nombre as rol
      FROM Usuarios u
      JOIN UsuariosRoles ur ON u.id_usuario = ur.id_usuario
      JOIN Roles r ON ur.id_rol = r.id_rol
      WHERE u.correo = ?`,
      [email]
    );
    connection.release();
    return (rows as any[])[0] || null;
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return null;
  }
};

/**
 * Validates if a user has a specific role.
 * @param email The email of the user.
 * @param role The role to check.
 * @returns True if the user has the role, false otherwise.
 */
export const validateUserRole = async (
  email: string,
  role: string
): Promise<boolean> => {
  try {
       const pool = await getConnection();
       const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT ur.* FROM UsuariosRoles ur
      JOIN Roles r ON ur.id_rol = r.id_rol
      JOIN Usuarios u ON ur.id_usuario = u.id_usuario
      WHERE u.correo = ? AND r.nombre = ?`, [email, role]
    );

    connection.release();
    return (rows as any[]).length > 0;
  } catch (error) {
    console.error('Error validating user role:', error);
    return false;
  }
};
