import { Database } from '@sqlitecloud/drivers';
import { IMetadataRepository, MetadataRepository } from './metadataRepository';
import { IUserRepository, UserRepository } from './userRepository';
import { Paciente, PacienteUserData, PacienteDetails, SearchedPatient } from '../types';

export interface IPacienteRepository {
  getPacientes(): Promise<Paciente[]>;
  insertPacienteCompleto(pacienteUserData: PacienteUserData, pacienteDetails: PacienteDetails): Promise<number>;
  searchPacientes(searchTerm: string): Promise<SearchedPatient[]>;
  getTiposDocumentoYPaises(): Promise<{ tiposDocumento: any[]; paises: any[] }>;
  getPacienteById(id_usuario: number): Promise<Paciente | null>;
  updatePaciente(id_usuario: number, data: PacienteDetails): Promise<Paciente | null>;
  deletePaciente(id_usuario: number): Promise<boolean>;
}

export class PacienteRepository implements IPacienteRepository {
  private dbClient: Database;
  private metadataRepository: IMetadataRepository;
  private userRepository: IUserRepository;

  constructor(dbClient: Database, metadataRepository?: IMetadataRepository, userRepository?: IUserRepository) {
    this.dbClient = dbClient;
    this.metadataRepository = metadataRepository || new MetadataRepository(dbClient);
    this.userRepository = userRepository || new UserRepository(dbClient);
  }

  async getPacientes(): Promise<any[]> {
    try {
      const query = `
        SELECT
          u.id_usuario,
          u.primer_nombre,
          u.segundo_nombre,
          u.primer_apellido,
          u.segundo_apellido,
          u.correo as email,
          u.nui,
          p.fecha_nacimiento,
          p.genero,
          p.telefono_contacto,
          p.direccion_residencial,
          p.grupo_sanguineo,
          p.ocupacion,
          p.info_seguro_medico,
          p.contacto_emergencia,
          p.alergias,
          p.antecedentes_medicos,
          p.historial_visitas,
          d.id_diagnostico as ultimo_diagnostico_id,
          d.resultado as ultimo_diagnostico,
          (SELECT COUNT(*) FROM diagnosticos d2 WHERE d2.id_paciente = u.id_usuario) as diagnosticosTotales
        FROM usuarios u
        LEFT JOIN pacientes p ON u.id_usuario = p.id_usuario
        INNER JOIN usuariosroles ur ON u.id_usuario = ur.id_usuario
        LEFT JOIN (
          SELECT
            id_paciente,
            id_diagnostico,
            resultado,
            ROW_NUMBER() OVER (PARTITION BY id_paciente ORDER BY fecha_diagnostico DESC) as rn
          FROM diagnosticos
        ) d ON u.id_usuario = d.id_paciente AND d.rn = 1
        WHERE ur.id_rol = 3
      `;
      const result = await this.dbClient.sql(query);
      return result || [];
    } catch (error) {
      console.error('Error getting pacientes:', error);
      return [];
    }
  }

  async insertPacienteCompleto(pacienteUserData: PacienteUserData, pacienteDetails: PacienteDetails): Promise<number> {
    try {
      // Ajuste: Forzar a string vacío si es null para segundo_nombre y segundo_apellido
      const userData = {
        ...pacienteUserData,
        segundo_nombre: pacienteUserData.segundo_nombre ?? '',
        segundo_apellido: pacienteUserData.segundo_apellido ?? '',
        correo: pacienteUserData.correo || pacienteUserData.email,
      };

      // Asumimos que pacienteUserData contiene los datos para la tabla usuarios
      // y pacienteDetails contiene los datos para la tabla pacientes.
      // La creación del usuario se delega a UserRepository.
      // Primero, obtener los IDs de tipo de documento y país a partir de los códigos
      const id_tipo_documento = await this.metadataRepository.getTipoDocumentoIdByCodigo(userData.tipoDocumentoCodigo);
      const id_pais = await this.metadataRepository.getPaisIdByCodigo(userData.paisCodigo);

      if (!id_tipo_documento) throw new Error('Tipo de documento no encontrado');
      if (!id_pais) throw new Error('País no encontrado');

      // Crear el usuario sin firebase_uid
      const id_usuario = await this.userRepository.createUser({
        id_tipo_documento,
        id_pais,
        nui: userData.nui,
        primer_nombre: userData.primer_nombre,
        segundo_nombre: userData.segundo_nombre,
        primer_apellido: userData.primer_apellido,
        segundo_apellido: userData.segundo_apellido,
        correo: userData.correo,
        estado: userData.estado || 'Activo',
        roles: ['paciente'] // Asignar rol de paciente automáticamente
      });

      // La asignación del rol 'paciente' ya se maneja dentro de userRepository.createUser
      // al pasar roles: ['paciente']. No es necesario duplicar la inserción aquí.

      // Preparar los datos para la tabla pacientes, asegurando que los valores nulos sean NULL
      const pacienteColumns = [
        'id_usuario', 'fecha_nacimiento', 'genero', 'telefono_contacto',
        'direccion_residencial', 'grupo_sanguineo', 'ocupacion',
        'info_seguro_medico', 'contacto_emergencia', 'alergias',
        'antecedentes_medicos', 'historial_visitas'
      ];
      const pacienteParams = [
        id_usuario,
        pacienteDetails.fecha_nacimiento || null,
        pacienteDetails.genero || null,
        pacienteDetails.telefono_contacto || null,
        pacienteDetails.direccion_residencial || null,
        pacienteDetails.grupo_sanguineo || null,
        pacienteDetails.ocupacion || null,
        pacienteDetails.info_seguro_medico || null,
        pacienteDetails.contacto_emergencia || null,
        pacienteDetails.alergias || null,
        pacienteDetails.antecedentes_medicos || null,
        pacienteDetails.historial_visitas || null
      ];
      const pacientePlaceholders = pacienteColumns.map(() => '?').join(', ');
      const insertPacienteQuery = `INSERT INTO pacientes (${pacienteColumns.join(', ')}) VALUES (${pacientePlaceholders})`;
      console.log('Generated Paciente Insert Query:', insertPacienteQuery);
      console.log('Paciente Insert Params:', pacienteParams);
      await this.dbClient.sql(insertPacienteQuery, ...pacienteParams);
      return id_usuario;
    } catch (error) {
      console.error('Error inserting paciente completo:', error);
      throw error;
    }
  }

  async searchPacientes(searchTerm: string): Promise<SearchedPatient[]> {
    let dbClient: Database | undefined;
    const likeTerm = `%${searchTerm}%`;
    const query = `
        SELECT
          u.id_usuario,
          u.primer_nombre,
          u.primer_apellido,
          u.nui
        FROM usuarios u
        JOIN usuariosroles ur ON u.id_usuario = ur.id_usuario
        JOIN roles r ON ur.id_rol = r.id_rol
        WHERE r.nombre = 'paciente'
        AND (
          LOWER(u.nui) LIKE LOWER(?) OR
          LOWER(u.primer_nombre) LIKE LOWER(?) OR
          LOWER(u.primer_apellido) LIKE LOWER(?)
        )
        LIMIT 10;
      `;
    const params = [likeTerm, likeTerm, likeTerm];

    try {
      dbClient = this.dbClient; // Usar la instancia de dbClient ya inyectada
      console.log(`searchPacientes - Buscando pacientes con término: ${searchTerm}`);
      console.log('Search Pacientes Query:', query);
      console.log('Search Pacientes Params:', params);

      const result = await dbClient.sql(query, ...params);

      console.log(`searchPacientes - Encontrados ${result?.length || 0} resultados para "${searchTerm}"`);

      const mappedResult: SearchedPatient[] = (result || []).map((row: any) => ({
          id_usuario: Number(row.id_usuario),
          primer_nombre: row.primer_nombre,
          primer_apellido: row.primer_apellido,
          nui: row.nui
      }));

      return mappedResult;

    } catch (error: any) {
      console.error('Error en searchPacientes:', error.message, error.stack);
      if (error.message.toLowerCase().includes('parameter') || error.message.toLowerCase().includes('binding')) {
          console.error('searchPacientes - Posible error de binding. Query:', query, 'Params:', params);
      }
      throw error;
    }
  }

  async getTiposDocumentoYPaises(): Promise<{ tiposDocumento: any[]; paises: any[] }> {
    try {
      const tiposDocumento = await this.metadataRepository.getTiposDocumento();
      const paises = await this.metadataRepository.getPaises();
      return { tiposDocumento, paises };
    } catch (error) {
      console.error('Error getting tiposDocumento y paises:', error);
      throw error;
    }
  }

  /**
   * Obtiene un paciente por su id_usuario, haciendo JOIN con usuarios y devolviendo los códigos de tipo de documento y país.
   */
  async getPacienteById(id_usuario: number): Promise<any | null> {
    try {
      const query = `
        SELECT 
          u.id_usuario,
          u.primer_nombre,
          u.segundo_nombre,
          u.primer_apellido,
          u.segundo_apellido,
          u.correo,
          u.nui,
          u.fecha_registro,
          u.id_tipo_documento,
          td.codigo as tipoDocumentoCodigo,
          u.id_pais,
          p.codigo as paisCodigo,
          u.estado,
          p.fecha_nacimiento,
          p.genero,
          p.telefono_contacto,
          p.direccion_residencial,
          p.grupo_sanguineo,
          p.ocupacion,
          p.info_seguro_medico,
          p.contacto_emergencia,
          p.alergias,
          p.antecedentes_medicos,
          p.historial_visitas
        FROM usuarios u
        LEFT JOIN pacientes p ON u.id_usuario = p.id_usuario
        LEFT JOIN tiposdocumento td ON u.id_tipo_documento = td.id_tipo_documento
        LEFT JOIN paises p ON u.id_pais = p.id_pais
        WHERE u.id_usuario = ?
      `;
      const rows = await this.dbClient.sql(query, id_usuario);
      if (rows && rows.length > 0) return rows[0];
      return null;
    } catch (error) {
      console.error('Error getPacienteById:', error);
      throw error;
    }
  }

  /**
   * Actualiza los datos de un paciente (usuarios y pacientes). Recibe los datos en formato frontend.
   */
  async updatePaciente(id_usuario: number, data: PacienteDetails): Promise<Paciente | null> {
    try {
      // Ajuste: Permitir acceso a los campos extendidos
      const id_tipo_documento = data.tipoDocumentoCodigo ? await this.metadataRepository.getTipoDocumentoIdByCodigo(data.tipoDocumentoCodigo) : undefined;
      const id_pais = data.paisCodigo ? await this.metadataRepository.getPaisIdByCodigo(data.paisCodigo) : undefined;
      await this.userRepository.updateUser(id_usuario, {
        primer_nombre: data.primer_nombre,
        segundo_nombre: data.segundo_nombre ?? '',
        primer_apellido: data.primer_apellido,
        segundo_apellido: data.segundo_apellido ?? '',
        correo: data.correo || data.email,
        nui: data.nui,
        id_tipo_documento,
        id_pais,
        estado: data.estado
      });

      // Actualizar tabla pacientes
      await this.dbClient.sql(
        `UPDATE pacientes SET fecha_nacimiento = ?, genero = ?, telefono_contacto = ?, direccion_residencial = ?, grupo_sanguineo = ?, ocupacion = ?, info_seguro_medico = ?, contacto_emergencia = ?, alergias = ?, antecedentes_medicos = ?, historial_visitas = ? WHERE id_usuario = ?`,
        data.fecha_nacimiento, data.genero, data.telefono_contacto, data.direccion_residencial, data.grupo_sanguineo, data.ocupacion, data.info_seguro_medico, data.contacto_emergencia, data.alergias, data.antecedentes_medicos, data.historial_visitas, id_usuario
      );
      // Devolver el paciente actualizado
      return this.getPacienteById(id_usuario);
    } catch (error) {
      console.error('Error updatePaciente:', error);
      throw error;
    }
  }

  /**
   * Elimina un paciente por su id_usuario (de pacientes y usuarios), manejando dependencias.
   */
  async deletePaciente(id_usuario: number): Promise<boolean> {
    try {
      // 1. Eliminar registros dependientes en diagnosticos (si el paciente es el id_paciente)
      await this.dbClient.sql('DELETE FROM diagnosticos WHERE id_paciente = ?', id_usuario);

      // 2. Eliminar registros dependientes en usuariosroles
      await this.dbClient.sql('DELETE FROM usuariosroles WHERE id_usuario = ?', id_usuario);

      // 3. Eliminar de la tabla pacientes (por FK a usuarios)
      await this.dbClient.sql('DELETE FROM pacientes WHERE id_usuario = ?', id_usuario);

      // 4. Finalmente, eliminar de la tabla usuarios a través de UserRepository
      const result = await this.userRepository.deleteUser(id_usuario);
      return result;
    } catch (error) {
      console.error('Error deletePaciente:', error);
      throw error;
    }
  }
}
