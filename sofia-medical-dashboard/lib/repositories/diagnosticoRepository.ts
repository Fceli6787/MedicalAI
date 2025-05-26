import { Database } from '@sqlitecloud/drivers';
import { DiagnosticoDetallado, DiagnosticoDetalladoRecomendacion, getConnection } from '../db';
import { ImageStorageService, LocalImageStorageService } from '../services/imageStorageService';
import { TipoExamenRepository, TipoExamenRepositoryImpl } from './tipoExamenRepository';

export interface DiagnosisAIResult {
  condition?: string;
  confidence?: number;
  description?: string;
  recomendaciones?: string[];
  pronostico?: {
    tiempo_recuperacion?: string;
    probabilidad_mejoria?: string;
  };
}

export interface AddDiagnosticoCompletoData {
  id_paciente: number;
  id_medico: number;
  tipoExamenNombre: string;
  imageBase64?: string | null;
  tipoImagen?: string | null;
  originalFileName?: string | null;
  diagnosisAIResult: DiagnosisAIResult;
}

export async function deleteDiagnosticoCompletoById(id_diagnostico: number): Promise<{ success: boolean; message: string }> {
  const dbClient = await getConnection();
  const imageStorageService = new LocalImageStorageService();
  return new DiagnosticoRepositoryImpl(dbClient, imageStorageService).deleteDiagnosticoCompletoById(id_diagnostico);
}

export async function getDiagnosticoDetalladoById(id_diagnostico: number): Promise<DiagnosticoDetallado | null> {
  const dbClient = await getConnection();
  const imageStorageService = new LocalImageStorageService();
  return new DiagnosticoRepositoryImpl(dbClient, imageStorageService).getDiagnosticoDetalladoById(id_diagnostico);
}

export interface DiagnosticoRepository {
  addDiagnosticoCompleto(data: AddDiagnosticoCompletoData): Promise<number>;
  getDiagnosticos(): Promise<any[]>;
  getDiagnosticoDetalladoById(id_diagnostico: number): Promise<DiagnosticoDetallado | null>;
  deleteDiagnosticoCompletoById(id_diagnostico: number): Promise<{ success: boolean; message: string }>;
}

// Implementación concreta (se puede extender o reemplazar para OCP)
export class DiagnosticoRepositoryImpl implements DiagnosticoRepository {
  private dbClient: Database;
  private imageStorageService: ImageStorageService;
  private tipoExamenRepository: TipoExamenRepository;

  constructor(dbClient: Database, imageStorageService: ImageStorageService, tipoExamenRepository?: TipoExamenRepository) {
    this.dbClient = dbClient;
    this.imageStorageService = imageStorageService;
    this.tipoExamenRepository = tipoExamenRepository || new TipoExamenRepositoryImpl(dbClient);
  }

  async addDiagnosticoCompleto(data: AddDiagnosticoCompletoData): Promise<number> {
    try {
      console.log('addDiagnosticoCompleto - Iniciando proceso.');
      console.log('addDiagnosticoCompleto - Datos (imageBase64 omitido si es largo):', {
          ...data, imageBase64: data.imageBase64 ? `[Base64 de ${data.imageBase64.length} caracteres]` : null
      });

      const id_tipo_examen = await this.tipoExamenRepository.getTipoExamenPorNombre(data.tipoExamenNombre);
      if (id_tipo_examen === null) {
        throw new Error(`Tipo de examen '${data.tipoExamenNombre}' no encontrado.`);
      }

      const resultadoDiagnostico = data.diagnosisAIResult.condition || data.diagnosisAIResult.description || 'No especificado';
      const nivelConfianza = data.diagnosisAIResult.confidence !== undefined ? (data.diagnosisAIResult.confidence / 100) : 0;

      const diagnosticoInsertParams = [
        data.id_paciente, data.id_medico, id_tipo_examen,
        resultadoDiagnostico, nivelConfianza, 'Completado'
      ];

      const insertDiagnosticoResult = await this.dbClient.sql(
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
          const lastIdResult = await this.dbClient.sql('SELECT last_insert_rowid() as id');
          if (lastIdResult && lastIdResult.length > 0 && lastIdResult[0].id !== undefined) {
              id_diagnostico = Number(lastIdResult[0].id);
          }
      }

      if (id_diagnostico === undefined) {
        throw new Error('No se pudo obtener el ID del diagnóstico insertado.');
      }
      console.log(`addDiagnosticoCompleto - Diagnóstico insertado con ID: ${id_diagnostico}`);

      let nombreArchivoGuardado: string | null = null;

      if (data.imageBase64 && data.tipoImagen) {
        const base64Data = data.imageBase64.includes(',')
                            ? data.imageBase64.split(',')[1]
                            : data.imageBase64;
        const fileExtension = data.tipoImagen.toLowerCase();
        nombreArchivoGuardado = await this.imageStorageService.saveImage(base64Data, fileExtension, `diag_${id_diagnostico}`);

        const metadataImagen = {
          originalFileName: data.originalFileName || nombreArchivoGuardado,
          aiAnalysisDetails: data.diagnosisAIResult
        };

        const imagenInsertParams = [
          id_diagnostico,
          data.tipoImagen,
          nombreArchivoGuardado,
          JSON.stringify(metadataImagen)
        ];

        await this.dbClient.sql(
          `INSERT INTO imagenesmedicas (id_diagnostico, tipo, url, metadata, fecha_carga)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          ...imagenInsertParams
        );
        console.log(`addDiagnosticoCompleto - Registro de imagen para ID ${id_diagnostico} guardado. URL en BD: ${nombreArchivoGuardado}`);
      } else {
        console.log('addDiagnosticoCompleto - No imageBase64 o tipoImagen. Omitiendo inserción en imagenesmedicas.');
      }

      if (data.diagnosisAIResult.recomendaciones && data.diagnosisAIResult.recomendaciones.length > 0) {
        for (const descRecomendacion of data.diagnosisAIResult.recomendaciones) {
          if (!descRecomendacion) continue;
          const prioridadRecomendacion = 'Media';
          await this.dbClient.sql(
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

  async getDiagnosticos(): Promise<any[]> {
    try {
      console.log('getDiagnosticos - Obteniendo todos los diagnósticos con URL de imagen.');
      const result = await this.dbClient.sql(`
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

  async getDiagnosticoDetalladoById(id_diagnostico: number): Promise<DiagnosticoDetallado | null> {
    try {
      console.log(`[INFO] getDiagnosticoDetalladoById - Buscando diagnóstico detallado para ID: ${id_diagnostico} (filtrando en JS).`);

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
          im.url AS imagen_url,
          im.tipo AS imagen_tipo,
          im.metadata AS imagen_metadata
        FROM diagnosticos d
        LEFT JOIN usuarios up ON d.id_paciente = up.id_usuario
        LEFT JOIN usuarios um ON d.id_medico = um.id_usuario
        LEFT JOIN tiposexamen te ON d.id_tipo_examen = te.id_tipo_examen
        LEFT JOIN imagenesmedicas im ON d.id_diagnostico = im.id_diagnostico
        ORDER BY d.fecha_diagnostico DESC
      `;

      console.log(`[DEBUG] getDiagnosticoDetalladoById - Ejecutando consulta para TODOS los diagnósticos.`);
      const todosLosDiagnosticosResult = await this.dbClient.sql(diagnosticoQuery);

      if (!todosLosDiagnosticosResult || todosLosDiagnosticosResult.length === 0) {
        console.warn(`[WARN] getDiagnosticoDetalladoById - No se encontró ningún diagnóstico en la base de datos al traer todos.`);
        return null;
      }
      console.log(`[DEBUG] getDiagnosticoDetalladoById - Total de diagnósticos traídos de la BD: ${todosLosDiagnosticosResult.length}`);

      const diagData = (todosLosDiagnosticosResult as any[]).find(diag => diag.id_diagnostico === id_diagnostico);

      if (!diagData) {
        console.warn(`[WARN] getDiagnosticoDetalladoById - No se encontró diagnóstico con ID: ${id_diagnostico} después de filtrar en la aplicación.`);
        return null;
      }

      let imagenBase64: string | null = null;
      if (diagData.imagen_url && typeof diagData.imagen_url === 'string' && diagData.imagen_tipo) {
        try {
          // Asumiendo que imagen_url es el nombre del archivo en el sistema de archivos
          const imageBuffer = await this.imageStorageService.getImageBuffer(diagData.imagen_url);
          if (imageBuffer) {
            imagenBase64 = `data:image/${diagData.imagen_tipo.toLowerCase()};base64,${imageBuffer.toString('base64')}`;
            console.log(`[DEBUG] getDiagnosticoDetalladoById - Imagen convertida a Base64 para ID ${id_diagnostico}. Longitud: ${imagenBase64.length}.`);
          } else {
            console.warn(`[WARN] getDiagnosticoDetalladoById - No se pudo obtener el buffer de la imagen para ID ${id_diagnostico}, URL: ${diagData.imagen_url}`);
          }
        } catch (imageError: any) {
          console.error(`[ERROR] getDiagnosticoDetalladoById - Error al leer/convertir imagen para ID ${id_diagnostico}:`, imageError.message);
          imagenBase64 = null;
        }
      } else {
        console.log(`[DEBUG] getDiagnosticoDetalladoById - No hay imagen_url o tipo_imagen para ID ${id_diagnostico}.`);
      }

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

      const todasRecomendacionesResult = await this.dbClient.sql(
        `SELECT id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion FROM recomendaciones ORDER BY fecha_creacion DESC`
      );
      const recomendaciones: DiagnosticoDetalladoRecomendacion[] = (todasRecomendacionesResult || [])
        .filter((rec: any) => rec.id_diagnostico === id_diagnostico)
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
        imagen_url: imagenBase64,
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

  async deleteDiagnosticoCompletoById(id_diagnostico: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`[INFO] deleteDiagnosticoCompletoById - Iniciando eliminación para diagnóstico ID: ${id_diagnostico}`);

      const recomendacionesResult = await this.dbClient.sql(
        `SELECT id_recomendacion FROM recomendaciones WHERE id_diagnostico = ?`,
        id_diagnostico
      );
      const idsRecomendaciones: number[] = (recomendacionesResult || []).map((r: any) => r.id_recomendacion);

      if (idsRecomendaciones.length > 0) {
        console.log(`[DEBUG] deleteDiagnosticoCompletoById - IDs de recomendaciones cuyos seguimientos se eliminarán: ${idsRecomendaciones.join(', ')}`);
        const placeholders = idsRecomendaciones.map(() => '?').join(',');
        const deleteSeguimientosResult = await this.dbClient.sql(
          `DELETE FROM seguimientorecomendaciones WHERE id_recomendacion IN (${placeholders})`,
          ...idsRecomendaciones
        );
        console.log(`[DEBUG] deleteDiagnosticoCompletoById - Seguimientos eliminados: ${deleteSeguimientosResult?.changes ?? 0}`);
      } else {
        console.log(`[DEBUG] deleteDiagnosticoCompletoById - No hay seguimientos que eliminar (no hay recomendaciones asociadas).`);
      }

      const deleteRecomendacionesResult = await this.dbClient.sql(
        `DELETE FROM recomendaciones WHERE id_diagnostico = ?`,
        id_diagnostico
      );
      console.log(`[DEBUG] deleteDiagnosticoCompletoById - Recomendaciones eliminadas: ${deleteRecomendacionesResult?.changes ?? 0}`);

      const imagenResult = await this.dbClient.sql(
        `SELECT url FROM imagenesmedicas WHERE id_diagnostico = ?`,
        id_diagnostico
      );
      const imagenUrlToDelete = imagenResult && imagenResult.length > 0 ? imagenResult[0].url : null;

      const deleteImagenesResult = await this.dbClient.sql(
        `DELETE FROM imagenesmedicas WHERE id_diagnostico = ?`,
        id_diagnostico
      );
      console.log(`[DEBUG] deleteDiagnosticoCompletoById - Registros de imágenes médicas eliminados de la BD: ${deleteImagenesResult?.changes ?? 0}`);

      if (imagenUrlToDelete) {
        await this.imageStorageService.deleteImage(imagenUrlToDelete);
      }

      const deleteDiagnosticoResult = await this.dbClient.sql(
        `DELETE FROM diagnosticos WHERE id_diagnostico = ?`,
        id_diagnostico
      );
      console.log(`[DEBUG] deleteDiagnosticoCompletoById - Diagnóstico principal eliminado: ${deleteDiagnosticoResult?.changes ?? 0}`);

      if (deleteDiagnosticoResult?.changes > 0) {
        console.log(`[INFO] deleteDiagnosticoCompletoById - Diagnóstico ID ${id_diagnostico} y datos asociados eliminados exitosamente.`);
        return { success: true, message: `Diagnóstico ID ${id_diagnostico} y datos asociados eliminados exitosamente.` };
      } else {
        console.warn(`[WARN] deleteDiagnosticoCompletoById - No se encontró el diagnóstico ID ${id_diagnostico} en la tabla 'diagnosticos' para eliminar, o ya fue eliminado.`);
        return { success: false, message: `No se encontró el diagnóstico ID ${id_diagnostico} para eliminar, o ya fue eliminado.` };
      }

    } catch (error: any) {
      console.error(`[ERROR] Error en deleteDiagnosticoCompletoById para ID ${id_diagnostico}:`, error.message, error.stack);
      return { success: false, message: `Error al eliminar el diagnóstico: ${error.message}` };
    }
  }
}
