import { Database } from '@sqlitecloud/drivers';

export class MedicoRepository {
  private dbClient: Database;
  constructor(dbClient: Database) {
    this.dbClient = dbClient;
  }

  async getMedicos(): Promise<any[]> {
    try {
      const result = await this.dbClient.sql('SELECT * FROM medicos');
      return result || [];
    } catch (error) {
      console.error('Error getting medicos:', error);
      return [];
    }
  }
}
