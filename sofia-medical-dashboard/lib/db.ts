import mysql from 'mysql2/promise'


let pool: mysql.Pool | null = null;

const getPool = async (): Promise<mysql.Pool> => {
  if (pool) return pool;

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
  });

  return pool;
};

export async function getConnection() {
    if (!pool) {
        pool = mysql.createPool(process.env.DATABASE_URL!);
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
             const sql = await import('./database.sql?raw')
             const queries = sql.default.split(';').filter((q) => q.trim().length > 0);
            for (const query of queries) {
                await connection.execute(query);
            }
            console.log('Database initialized (SQL) - Tables created and data inserted.');
        } catch (error) {
            console.error('Error initializing database:', error);
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
 * Adds a new user to the database.
 * @param user The user object to add.
 * @returns void.
 */
export const addUser = async (user: any): Promise<void> => {
  try {
      const pool = await getConnection();
      const connection = await pool.getConnection();
    await connection.query(
        'INSERT INTO Usuarios (id_tipo_documento, id_pais, nui, primer_nombre, primer_apellido, correo, firebase_uid, estado) VALUES ((SELECT id_tipo_documento FROM TiposDocumento WHERE codigo = \'CC\'), (SELECT id_pais FROM Paises WHERE codigo = \'COL\'), \'1234567890\', ?, ?, ?, ?, \'Activo\')',
        [user.primer_nombre, user.primer_apellido, user.correo, user.firebase_uid]
    );
    const [newUser] = await connection.query('SELECT id_usuario FROM Usuarios WHERE correo = ?', [user.correo]);
    const newUserId = (newUser as any)[0].id_usuario;
    await connection.query('INSERT INTO UsuariosRoles (id_usuario, id_rol) VALUES (?, (SELECT id_rol FROM Roles WHERE nombre = ?))', [newUserId, user.rol]);
     connection.release();
  } catch (error) {
    console.error('Error adding user:', error);
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
    const [rows] = await connection.query('SELECT * FROM Pacientes');
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
export const addDiagnostico = async (diagnostico: any): Promise<void> => {
  try {
       const pool = await getConnection();
       const connection = await pool.getConnection();
    await connection.query('INSERT INTO Diagnosticos SET ?', diagnostico);
    connection.release();
  } catch (error) {
    console.error('Error adding diagnostic:', error);
  }
};

/**
 * Retrieves a user from the SQL database by their UID.
 * @param uid The UID of the user to retrieve.
 * @returns The user object if found.
 */
export const getUser = async (uid: string): Promise<any | null> => {
  try {
      const pool = await getConnection();
      const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT u.*, r.nombre AS rol FROM Usuarios u JOIN UsuariosRoles ur ON u.id_usuario = ur.id_usuario JOIN Roles r ON ur.id_rol = r.id_rol WHERE u.firebase_uid = ?',
      [uid]
    );
      connection.release();
   return rows[0] as any;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

/**
 * Validates if a user has a specific role.
 * @param uid The UID of the user.
 * @param role The role to check.
 * @returns True if the user has the role, false otherwise.
 */
export const validateUserRole = async (
  uid: string,
  role: string
): Promise<boolean> => {
  try {
       const pool = await getConnection();
       const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT ur.* FROM UsuariosRoles ur
      JOIN Roles r ON ur.id_rol = r.id_rol
      JOIN Usuarios u ON ur.id_usuario = u.id_usuario
      WHERE u.firebase_uid = ? AND r.nombre = ?`, [uid, role]
    );

    connection.release();
    return (rows as any[]).length > 0;
  } catch (error) {
    console.error('Error validating user role:', error);
    return false;
  }
};
