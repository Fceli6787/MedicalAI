import { Database } from '@sqlitecloud/drivers';

export class MfaRepository {
  private dbClient: Database;
  constructor(dbClient: Database) {
    this.dbClient = dbClient;
  }

  async getMfaByUserId(id_usuario: number): Promise<any[]> {
    try {
      const result = await this.dbClient.sql('SELECT * FROM usuarios_mfa_config WHERE id_usuario = ?', id_usuario);
      return result || [];
    } catch (error) {
      console.error('Error getting MFA:', error);
      return [];
    }
  }
}
