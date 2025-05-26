import { Database } from '@sqlitecloud/drivers';

export interface TipoExamenRepository {
  getTipoExamenPorNombre(nombre: string): Promise<number | null>;
}

export class TipoExamenRepositoryImpl implements TipoExamenRepository {
  private dbClient: Database;

  constructor(dbClient: Database) {
    this.dbClient = dbClient;
  }

  async getTipoExamenPorNombre(nombre: string): Promise<number | null> {
    try {
      const nombreNormalizado = nombre.toLowerCase().trim();
      console.log(`[DEBUG TipoExamenRepository] Buscando tipo de examen para nombre: '${nombre}' (normalizado: '${nombreNormalizado}')`);
      
      const allTiposResult = await this.dbClient.sql('SELECT id_tipo_examen, nombre FROM tiposexamen');

      if (!Array.isArray(allTiposResult)) {
        console.warn('[DEBUG TipoExamenRepository] No se pudo obtener la lista de tipos de examen');
        return null;
      }

      const foundTipo = allTiposResult.find(tipo =>
          typeof tipo.nombre === 'string' && tipo.nombre.toLowerCase().trim() === nombreNormalizado
      );

      if (foundTipo) {
        console.log(`[DEBUG TipoExamenRepository] Encontrada coincidencia exacta con ID: ${foundTipo.id_tipo_examen}`);
        return Number(foundTipo.id_tipo_examen);
      }

      const esVarianteOtro = ['otro', 'otra', 'otros', 'otras', 'other'].includes(nombreNormalizado);
      
      if (esVarianteOtro) {
        console.log('[DEBUG TipoExamenRepository] El nombre es una variante de "otro", buscando tipo genérico "Otro"');
        
        const otroTipo = allTiposResult.find(tipo =>
            typeof tipo.nombre === 'string' && ['otro', 'otra', 'otros', 'otras', 'other']
            .includes(tipo.nombre.toLowerCase().trim())
        );

        if (otroTipo) {
          console.log(`[DEBUG TipoExamenRepository] Encontrado tipo "Otro" existente con ID: ${otroTipo.id_tipo_examen}`);
          return Number(otroTipo.id_tipo_examen);
        }

        console.log('[DEBUG TipoExamenRepository] Creando nuevo tipo "Otro"');
        const insertResult = await this.dbClient.sql(
          'INSERT INTO tiposexamen (nombre, descripcion, estado) VALUES (?, ?, ?) RETURNING id_tipo_examen',
          'Otro',
          'Otros tipos de exámenes no categorizados',
          'Activo'
        );

        let nuevoId: number | undefined;
        
        if (insertResult && Array.isArray(insertResult) && insertResult.length > 0 && insertResult[0].id_tipo_examen) {
          nuevoId = Number(insertResult[0].id_tipo_examen);
        }

        if (!nuevoId) {
          const lastIdResult = await this.dbClient.sql('SELECT last_insert_rowid() as id');
          if (lastIdResult && lastIdResult.length > 0 && lastIdResult[0].id !== undefined) {
            nuevoId = Number(lastIdResult[0].id);
          }
        }

        if (nuevoId) {
          console.log(`[DEBUG TipoExamenRepository] Creado nuevo tipo "Otro" con ID: ${nuevoId}`);
          return nuevoId;
        }
      }

      console.warn(`[DEBUG TipoExamenRepository] No se encontró coincidencia para '${nombre}' y no es una variante de "otro"`);
      return null;
    } catch (error: any) {
      console.error(`[ERROR TipoExamenRepository] Error para '${nombre}':`, error.message);
      throw error;
    }
  }
}
