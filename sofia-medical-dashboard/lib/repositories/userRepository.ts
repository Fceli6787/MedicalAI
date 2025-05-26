import { Database } from '@sqlitecloud/drivers';

export interface IUserRepository {
  getUsers(): Promise<any[]>;
  getUserById(id_usuario: number): Promise<any | null>;
  updateUser(id_usuario: number, data: any): Promise<any | null>;
  deleteUser(id_usuario: number): Promise<boolean>;
  ensureAdminUserExists(adminUserData: { email: string, firebaseUid: string, role: string }): Promise<void>;
  createUser(userData: {
    id_tipo_documento: number;
    id_pais: number;
    nui: string;
    primer_nombre: string;
    segundo_nombre?: string;
    primer_apellido: string;
    segundo_apellido?: string;
    correo: string;
    firebase_uid?: string;
    estado?: string;
    roles?: string[];
  }): Promise<number>;
}

export class UserRepository implements IUserRepository {
  private dbClient: Database;
  constructor(dbClient: Database) {
    this.dbClient = dbClient;
  }

  async getUsers(): Promise<any[]> {
    try {
      const result = await this.dbClient.sql('SELECT * FROM usuarios');
      return result || [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  async getUserById(id_usuario: number): Promise<any | null> {
    try {
      const result = await this.dbClient.sql('SELECT * FROM usuarios WHERE id_usuario = ?', id_usuario);
      return result && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async updateUser(id_usuario: number, data: any): Promise<any | null> {
    try {
      // Construir SET dinámico para solo los campos permitidos
      const allowedFields = [
        'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido',
        'correo', 'nui', 'id_tipo_documento', 'id_pais', 'estado'
      ];
      const setClauses = [];
      const values = [];
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          setClauses.push(`${field} = ?`);
          values.push(data[field]);
        }
      }
      if (setClauses.length === 0) return null;
      values.push(id_usuario);
      const sql = `UPDATE usuarios SET ${setClauses.join(', ')} WHERE id_usuario = ?`;
      const result = await this.dbClient.sql(sql, ...values);
      return result;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async deleteUser(id_usuario: number): Promise<boolean> {
    try {
      // Eliminar de usuarios (debería eliminar en cascada si hay FK ON DELETE CASCADE)
      const result = await this.dbClient.sql('DELETE FROM usuarios WHERE id_usuario = ?', id_usuario);
      return (result && result.changes && result.changes > 0) || (Array.isArray(result) && result.length > 0);
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async createUser(userData: {
    id_tipo_documento: number;
    id_pais: number;
    nui: string;
    primer_nombre: string;
    segundo_nombre?: string;
    primer_apellido: string;
    segundo_apellido?: string;
    correo: string;
    firebase_uid?: string;
    estado?: string;
    roles?: string[];
  }): Promise<number> {
    try {
      const {
        id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre,
        primer_apellido, segundo_apellido, correo, firebase_uid, estado = 'Activo', roles
      } = userData;

      // Determinar el valor final de firebase_uid
      let finalFirebaseUid: string | null = null;
      if (roles && roles.includes('paciente')) {
        finalFirebaseUid = null; // Pacientes no tienen firebase_uid
      } else if (firebase_uid !== undefined) {
        finalFirebaseUid = firebase_uid; // Usar el firebase_uid proporcionado si existe
      } else {
        finalFirebaseUid = null; // Si no se proporciona y no es paciente, es null
      }

      const insertUserResult = await this.dbClient.sql(
        `INSERT INTO usuarios (id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id_usuario`,
        id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, finalFirebaseUid, estado
      );

      let id_usuario: number | undefined;
      if (insertUserResult && Array.isArray(insertUserResult) && insertUserResult.length > 0 && insertUserResult[0].id_usuario !== undefined) {
        id_usuario = Number(insertUserResult[0].id_usuario);
      } else if (insertUserResult && (insertUserResult as any).id_usuario !== undefined) {
        id_usuario = Number((insertUserResult as any).id_usuario);
      } else {
        const lastIdResult = await this.dbClient.sql('SELECT last_insert_rowid() as id');
        if (lastIdResult && lastIdResult.length > 0 && lastIdResult[0].id !== undefined) {
          id_usuario = Number(lastIdResult[0].id);
        }
      }

      if (!id_usuario) {
        throw new Error('Failed to retrieve new user ID after insert');
      }

      if (roles && roles.length > 0) {
        for (const roleName of roles) {
          await this.dbClient.sql(
            `INSERT INTO usuariosroles (id_usuario, id_rol) VALUES (?, (SELECT id_rol FROM roles WHERE nombre = ?))`,
            id_usuario, roleName
          );
        }
      }
      console.log(`Usuario ${correo} creado con ID: ${id_usuario}`);
      return id_usuario;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async ensureAdminUserExists(adminUserData: { email: string, firebaseUid: string, role: string }) {
    const { email, firebaseUid, role } = adminUserData;
    try {
      // Verificar si el usuario admin ya existe
      const existingAdminUsers = await this.dbClient.sql(`SELECT id_usuario FROM usuarios WHERE correo = ?`, [email]);
      if (existingAdminUsers && existingAdminUsers.length > 0) {
        console.log('Admin user already exists.');
        return;
      }
      // Lógica para crear el usuario admin usando createUser
      const tipoDocumentoResult = await this.dbClient.sql(`SELECT id_tipo_documento FROM tiposdocumento WHERE codigo = 'CC'`);
      const idTipoDocumento = tipoDocumentoResult?.[0]?.id_tipo_documento;
      const paisResult = await this.dbClient.sql(`SELECT id_pais FROM paises WHERE codigo = 'COL'`);
      const idPais = paisResult?.[0]?.id_pais;
      if (!idTipoDocumento || !idPais) {
        console.error('Could not find default tiposdocumento or paises for admin user creation.');
        return;
      }
      
      await this.createUser({
        id_tipo_documento: idTipoDocumento,
        id_pais: idPais,
        nui: '0000000000',
        primer_nombre: 'Admin',
        primer_apellido: 'User',
        correo: email,
        firebase_uid: firebaseUid,
        roles: [role]
      });
      console.log('Admin user and role assignment created.');
    } catch (error) {
      console.error('Error ensuring admin user exists:', error);
    }
  }
}
