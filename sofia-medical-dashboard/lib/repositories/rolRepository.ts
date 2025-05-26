import { Database } from '@sqlitecloud/drivers';

export class RolRepository {
  private dbClient: Database;
  constructor(dbClient: Database) {
    this.dbClient = dbClient;
  }

  async getRoles(): Promise<any[]> {
    try {
      const result = await this.dbClient.sql('SELECT * FROM roles');
      return result || [];
    } catch (error) {
      console.error('Error getting roles:', error);
      return [];
    }
  }

  async ensureRolesExist(roleNames: string[]): Promise<void> {
    for (const roleName of roleNames) {
      const rows = await this.dbClient.sql('SELECT id_rol FROM roles WHERE nombre = ?', [roleName]);
      if (!rows || rows.length === 0) {
        await this.dbClient.sql('INSERT INTO roles (nombre) VALUES (?)', [roleName]);
        console.log(`Rol '${roleName}' creado por ensureRolesExist.`);
      }
    }
  }
}
