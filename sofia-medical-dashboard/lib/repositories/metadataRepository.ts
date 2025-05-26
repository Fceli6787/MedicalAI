import { Database } from '@sqlitecloud/drivers';

export interface IMetadataRepository {
  getTiposDocumento(): Promise<any[]>;
  getPaises(): Promise<any[]>;
  getTipoDocumentoIdByCodigo(codigo: string): Promise<number | null>;
  getPaisIdByCodigo(codigo: string): Promise<number | null>;
}

export class MetadataRepository implements IMetadataRepository {
  private dbClient: Database;

  constructor(dbClient: Database) {
    this.dbClient = dbClient;
  }

  async getTiposDocumento(): Promise<any[]> {
    try {
      const result = await this.dbClient.sql(`SELECT id_tipo_documento, codigo, descripcion FROM tiposdocumento WHERE estado = 1`);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting tiposDocumento:', error);
      throw error;
    }
  }

  async getPaises(): Promise<any[]> {
    try {
      const result = await this.dbClient.sql(`SELECT id_pais, codigo, nombre FROM paises WHERE estado = 1`);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting paises:', error);
      throw error;
    }
  }

  async getTipoDocumentoIdByCodigo(codigo: string): Promise<number | null> {
    try {
      const result = await this.dbClient.sql('SELECT id_tipo_documento FROM tiposdocumento WHERE codigo = ?', codigo);
      return result && result.length > 0 ? Number(result[0].id_tipo_documento) : null;
    } catch (error) {
      console.error(`Error getting tipo documento ID for code ${codigo}:`, error);
      throw error;
    }
  }

  async getPaisIdByCodigo(codigo: string): Promise<number | null> {
    try {
      const result = await this.dbClient.sql('SELECT id_pais FROM paises WHERE codigo = ?', codigo);
      return result && result.length > 0 ? Number(result[0].id_pais) : null;
    } catch (error) {
      console.error(`Error getting pais ID for code ${codigo}:`, error);
      throw error;
    }
  }
}
