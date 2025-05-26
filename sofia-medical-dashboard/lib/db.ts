import { Database } from '@sqlitecloud/drivers';
import { DiagnosticoRepositoryImpl } from './repositories/diagnosticoRepository';
import { MedicoRepository } from './repositories/medicoRepository';
import { MfaRepository } from './repositories/mfaRepository';
import { RolRepository } from './repositories/rolRepository';
import { IPacienteRepository, PacienteRepository } from './repositories/pacienteRepository';
import { IUserRepository, UserRepository } from './repositories/userRepository';
import { IMetadataRepository, MetadataRepository } from './repositories/metadataRepository';
import { LocalImageStorageService } from './services/imageStorageService';

// --- Interfaz para el resultado de la búsqueda (debe coincidir con el frontend) ---
export interface SearchedPatient {
  id_usuario: number;
  primer_nombre: string;
  primer_apellido: string;
  nui: string;
}

// --- Interfaces para el detalle del diagnóstico ---
export interface DiagnosticoDetalladoRecomendacion {
  id_recomendacion: number;
  descripcion: string;
  prioridad: string;
  fecha_creacion: string;
}

export interface DiagnosticoDetallado {
  id_diagnostico: number;
  id_paciente: number;
  nombre_paciente: string | null;
  nui_paciente: string | null;
  id_medico: number;
  nombre_medico: string | null;
  id_tipo_examen: number;
  nombre_tipo_examen: string | null;
  resultado: string;
  nivel_confianza: number;
  fecha_diagnostico: string;
  estado_diagnostico: string;
  ai_descripcion_detallada: string | null;
  ai_pronostico_tiempo_recuperacion: string | null;
  ai_pronostico_probabilidad_mejoria: string | null;
  imagen_url: string | null; // Puede ser Base64 o nombre de archivo (según estrategia)
  imagen_tipo: string | null; // Ej: "PNG", "JPG"
  recomendaciones: DiagnosticoDetalladoRecomendacion[];
}

let client: Database | null = null;
let clientInitializationTimestamp: number | null = null;

// Obtiene o crea una instancia del cliente de base de datos
const getClient = async (): Promise<Database> => {
  const now = Date.now();
  if (client && clientInitializationTimestamp) {
    try {
      // Prueba la conexión existente
      await client.sql('SELECT 1 AS test_query_on_reused_client');
      console.log(`getClient - Reusing existing client initialized at ${new Date(clientInitializationTimestamp).toISOString()}.`);
      return client;
    } catch (testError: any) {
      console.warn(`getClient - Existing client FAILED test query. Error: ${testError.message}. Re-initializing client.`);
      client = null;
      clientInitializationTimestamp = null;
    }
  }

  const dbUrl = process.env.NEXT_PUBLIC_SQLITECLOUD_URL;
  if (!dbUrl) {
    console.error("getClient - ERROR: Missing SQLITECLOUD_URL environment variable");
    throw new Error('Missing SQLITECLOUD_URL environment variable');
  }

  try {
    console.log("getClient - Attempting to create new Database instance...");
    client = new Database(dbUrl);
    clientInitializationTimestamp = now;
    console.log(`getClient - New SQLite Cloud client created at ${new Date(clientInitializationTimestamp).toISOString()}. Testing connection...`);
    await client.sql('SELECT 1 AS test_query_on_new_client'); // Prueba la nueva conexión
    console.log('getClient - SQLite Cloud client connected and responsive.');
    return client;
  } catch (error) {
    console.error('Error connecting to SQLite Cloud (during new client creation):', error);
    client = null;
    clientInitializationTimestamp = null;
    throw error;
  }
};

// Función pública para obtener la conexión
export async function getConnection() {
  return getClient();
}

// Inicialización de la base de datos (roles, admin user, etc.)
export async function init() {
  if (typeof window !== 'undefined') { // No ejecutar en el cliente
    return;
  }
  try {
    const dbClient = await getClient();
    console.log('Database connected for init');

    // Verifica si las tablas existen (ejemplo con 'roles')
    const tablesExistResult = await dbClient.sql(`SELECT name FROM sqlite_master WHERE type='table' AND name='roles'`);
    const tablesExist = tablesExistResult && tablesExistResult.length > 0;

    if (!tablesExist) {
      console.error('Tables do not exist. Database initialization logic expects tables to be pre-created.');
      // Aquí podrías añadir lógica para crear tablas si es necesario, o lanzar un error.
      return;
    }

    console.log('Tables exist, checking roles and admin user.');
    // Asegurar roles usando el repositorio
    const rolRepo = await getRolRepository();
    const rolesToEnsure = ['admin', 'medico', 'paciente'];
    await rolRepo.ensureRolesExist(rolesToEnsure);

    // Crear usuario admin si no existe usando el repositorio
    const adminEmail = 'admin@example.com';
    const adminUid = 'ADMIN_FIREBASE_UID'; // UID de Firebase para el admin
    const adminRole = 'admin';

    const userRepo = await getUserRepository();
    await userRepo.ensureAdminUserExists({
      email: adminEmail,
      firebaseUid: adminUid,
      role: adminRole
    });
  } catch (error) {
    console.error('Error during database initialization check:', error);
  }
}

// Interfaz para el resultado del diagnóstico de la IA
interface DiagnosisAIResult {
  condition?: string;
  confidence?: number;
  description?: string;
  recomendaciones?: string[]; // Nombres de las recomendaciones
  pronostico?: {
    tiempo_recuperacion?: string;
    probabilidad_mejoria?: string;
  };
}

// Interfaz para los datos necesarios para crear un diagnóstico completo
interface AddDiagnosticoCompletoData {
  id_paciente: number;
  id_medico: number;
  tipoExamenNombre: string;
  imageBase64?: string | null;      // String Base64 puro de la imagen
  tipoImagen?: string | null;        // Ej: "PNG", "JPG"
  originalFileName?: string | null;
  diagnosisAIResult: DiagnosisAIResult;
}

// --- REPOSITORIO DE DIAGNÓSTICOS (SRP, DIP) ---
// Factoría para obtener el repositorio de diagnósticos
async function getDiagnosticoRepository() {
  const dbClient = await getConnection();
  const imageStorageService = new LocalImageStorageService();
  return new DiagnosticoRepositoryImpl(dbClient, imageStorageService);
}

// --- USO DEL REPOSITORIO EN LUGAR DE LÓGICA DIRECTA ---
export async function getDiagnosticos() {
  const repo = await getDiagnosticoRepository();
  return repo.getDiagnosticos();
}

export async function getDiagnosticoDetalladoById(id_diagnostico: number) {
  const repo = await getDiagnosticoRepository();
  return repo.getDiagnosticoDetalladoById(id_diagnostico);
}

export async function addDiagnosticoCompleto(data: any) {
  const repo = await getDiagnosticoRepository();
  return repo.addDiagnosticoCompleto(data);
}


export async function deleteDiagnosticoCompletoById(id_diagnostico: number) {
  const repo = await getDiagnosticoRepository();
  return repo.deleteDiagnosticoCompletoById(id_diagnostico);
}

// --- REPOSITORIO DE MÉDICOS (SRP, DIP) ---
async function getMedicoRepository() {
  const dbClient = await getConnection();
  return new MedicoRepository(dbClient);
}

export async function getMedicos() {
  const repo = await getMedicoRepository();
  return repo.getMedicos();
}

// --- REPOSITORIO DE MFA (SRP, DIP) ---
async function getMfaRepository() {
  const dbClient = await getConnection();
  return new MfaRepository(dbClient);
}

export async function getMfaByUserId(id_usuario: number) {
  const repo = await getMfaRepository();
  return repo.getMfaByUserId(id_usuario);
}

// --- REPOSITORIO DE ROLES (SRP, DIP) ---
async function getRolRepository() {
  const dbClient = await getConnection();
  return new RolRepository(dbClient);
}

export async function getRoles() {
  const repo = await getRolRepository();
  return repo.getRoles();
}

// --- REPOSITORIO DE PACIENTES (SRP, DIP) ---
async function getPacienteRepository(): Promise<IPacienteRepository> {
  const dbClient = await getConnection();
  const metadataRepository = new MetadataRepository(dbClient);
  const userRepository = new UserRepository(dbClient); // Asumiendo que UserRepository no necesita más inyecciones aquí
  return new PacienteRepository(dbClient, metadataRepository, userRepository);
}

export async function getPacientes() {
  const repo = await getPacienteRepository();
  return repo.getPacientes();
}

export async function insertPacienteCompleto(pacienteUserData: any, pacienteDetails: any) {
  const repo = await getPacienteRepository();
  return repo.insertPacienteCompleto(pacienteUserData, pacienteDetails);
}

export async function searchPacientes(searchTerm: string) {
  const repo = await getPacienteRepository();
  return repo.searchPacientes(searchTerm);
}

export async function getTiposDocumentoYPaises() {
  const repo = await getPacienteRepository();
  return repo.getTiposDocumentoYPaises();
}

// --- REPOSITORIO DE USUARIOS (SRP, DIP) ---
// Eliminar la definición local de UserRepository aquí, ya que ahora se importa desde lib/repositories/userRepository.ts

async function getUserRepository() {
  const dbClient = await getConnection();
  return new UserRepository(dbClient);
}

export async function getUsers() {
  const repo = await getUserRepository();
  return repo.getUsers();
}

// --- USUARIOS: Obtener usuario por Firebase UID ---
export async function getUserByFirebaseUID(firebase_uid: string) {
  const dbClient = await getConnection();
  const rows = await dbClient.sql('SELECT * FROM usuarios WHERE firebase_uid = ?', firebase_uid);
  return rows && rows.length > 0 ? rows[0] : null;
}

// --- USUARIOS: Actualizar última IP y ubicación de login ---
export async function updateLastLoginInfo(id_usuario: number, ip: string, ubicacion: string) {
  const dbClient = await getConnection();
  await dbClient.sql('UPDATE usuarios SET ultima_ip_login = ?, ultima_ubicacion_login = ?, ultima_actividad = CURRENT_TIMESTAMP WHERE id_usuario = ?', ip, ubicacion, id_usuario);
  return true;
}

// --- USUARIOS: Obtener usuario completo por Firebase UID (incluyendo roles, IP, ubicación) ---
export async function getFullUserByFirebaseUID(firebase_uid: string) {
  const dbClient = await getConnection();
  // Obtener usuario y roles
  const userRows = await dbClient.sql('SELECT * FROM usuarios WHERE firebase_uid = ?', firebase_uid);
  if (!userRows || userRows.length === 0) return null;
  const user = userRows[0];
  // Obtener roles
  const rolesRows = await dbClient.sql('SELECT r.nombre FROM usuariosroles ur JOIN roles r ON ur.id_rol = r.id_rol WHERE ur.id_usuario = ?', user.id_usuario);
  user.roles = Array.isArray(rolesRows) ? rolesRows.map((r: any) => r.nombre) : [];
  return user;
}

// --- MFA: Obtener configuración MFA por id_usuario ---
export async function getUserMfaConfig(id_usuario: number) {
  const dbClient = await getConnection();
  const rows = await dbClient.sql('SELECT * FROM usuarios_mfa_config WHERE id_usuario = ?', id_usuario);
  return rows && rows.length > 0 ? rows[0] : null;
}

// --- MFA: Guardar o actualizar configuración MFA por id_usuario ---
export async function saveOrUpdateUserMfaConfig(id_usuario: number, encryptedSecret: string) {
  const dbClient = await getConnection();
  // Verifica si ya existe configuración MFA para el usuario
  const rows = await dbClient.sql('SELECT * FROM usuarios_mfa_config WHERE id_usuario = ?', id_usuario);
  if (rows && rows.length > 0) {
    // Actualizar
    await dbClient.sql('UPDATE usuarios_mfa_config SET mfa_secret = ?, mfa_enabled = 1 WHERE id_usuario = ?', encryptedSecret, id_usuario);
    return true;
  } else {
    // Insertar
    await dbClient.sql('INSERT INTO usuarios_mfa_config (id_usuario, mfa_secret, mfa_enabled) VALUES (?, ?, 1)', id_usuario, encryptedSecret);
    return true;
  }
}

// --- MÉDICOS: Registrar un nuevo médico (usando códigos y especialidad) ---
export async function registerMedico(data: any) {
  const dbClient = await getConnection();
  // Obtener IDs de tipo de documento y país a partir de los códigos
  const tipoDocRows = await dbClient.sql('SELECT id_tipo_documento FROM tiposdocumento WHERE codigo = ?', data.tipoDocumentoCodigo);
  const paisRows = await dbClient.sql('SELECT id_pais FROM paises WHERE codigo = ?', data.paisCodigo);
  if (!tipoDocRows?.[0]?.id_tipo_documento) throw new Error('Tipo de documento no encontrado');
  if (!paisRows?.[0]?.id_pais) throw new Error('País no encontrado');
  const id_tipo_documento = tipoDocRows[0].id_tipo_documento;
  const id_pais = paisRows[0].id_pais;
  // Insertar usuario
  const insertUserResult = await dbClient.sql(
    `INSERT INTO usuarios (id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo') RETURNING id_usuario`,
    id_tipo_documento, id_pais, data.nui, data.primer_nombre, data.segundo_nombre, data.primer_apellido, data.segundo_apellido, data.correo, data.firebase_uid
  );
  let id_usuario;
  if (insertUserResult && Array.isArray(insertUserResult) && insertUserResult[0].id_usuario !== undefined) {
    id_usuario = Number(insertUserResult[0].id_usuario);
  } else if (insertUserResult && (insertUserResult as any).id_usuario !== undefined) {
    id_usuario = Number((insertUserResult as any).id_usuario);
  } else {
    const lastIdResult = await dbClient.sql('SELECT last_insert_rowid() as id');
    id_usuario = lastIdResult?.[0]?.id;
  }
  if (!id_usuario) throw new Error('Failed to retrieve new user ID after insert');
  // Insertar en tabla medicos
  await dbClient.sql(
    `INSERT INTO medicos (id_usuario, id_especialidad, numero_tarjeta_profesional, años_experiencia)
     VALUES (?, ?, ?, ?)`,
    id_usuario, data.id_especialidad, data.numero_tarjeta_profesional, data.años_experiencia
  );
  // Asignar rol de médico
  await dbClient.sql(
    `INSERT INTO usuariosroles (id_usuario, id_rol) VALUES (?, (SELECT id_rol FROM roles WHERE nombre = 'medico'))`,
    id_usuario
  );
  return id_usuario;
}

// --- DIAGNÓSTICOS: Agregar diagnóstico básico (sin imagen ni IA) ---
export async function addDiagnosticoBasico(data: { id_paciente: number, id_medico: number, tipoExamenNombre: string, resultado: string, nivel_confianza: number }) {
  const dbClient = await getConnection();
  // Obtener id_tipo_examen a partir del nombre
  const tipoExamenRows = await dbClient.sql('SELECT id_tipo_examen FROM tiposexamen WHERE nombre = ?', data.tipoExamenNombre);
  if (!tipoExamenRows?.[0]?.id_tipo_examen) throw new Error('Tipo de examen no encontrado');
  const id_tipo_examen = tipoExamenRows[0].id_tipo_examen;
  // Insertar diagnóstico básico
  const insertResult = await dbClient.sql(
    `INSERT INTO diagnosticos (id_paciente, id_medico, id_tipo_examen, resultado, nivel_confianza, fecha_diagnostico, estado)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'Pendiente') RETURNING id_diagnostico`,
    data.id_paciente, data.id_medico, id_tipo_examen, data.resultado, data.nivel_confianza
  );
  let id_diagnostico;
  if (insertResult && Array.isArray(insertResult) && insertResult[0].id_diagnostico !== undefined) {
    id_diagnostico = Number(insertResult[0].id_diagnostico);
  } else if (insertResult && (insertResult as any).id_diagnostico !== undefined) {
    id_diagnostico = Number((insertResult as any).id_diagnostico);
  } else {
    const lastIdResult = await dbClient.sql('SELECT last_insert_rowid() as id');
    id_diagnostico = lastIdResult?.[0]?.id;
  }
  if (!id_diagnostico) throw new Error('Failed to retrieve new diagnostico ID after insert');
  return id_diagnostico;
}

// --- DIAGNÓSTICOS: Agregar diagnóstico (igual a addDiagnosticoBasico, alias para compatibilidad) ---
export async function addDiagnostico(data: { id_paciente: number, id_medico: number, tipoExamenNombre: string, resultado: string, nivel_confianza: number }) {
  // Reutiliza la lógica de addDiagnosticoBasico
  return addDiagnosticoBasico(data);
}

// --- PACIENTES: Obtener paciente por ID ---
export async function getPacienteById(id_usuario: number) {
  const repo = await getPacienteRepository();
  return repo.getPacienteById(id_usuario);
}

// --- PACIENTES: Actualizar paciente ---
export async function updatePaciente(id_usuario: number, data: any) {
  const repo = await getPacienteRepository();
  return repo.updatePaciente(id_usuario, data);
}

// --- PACIENTES: Eliminar paciente ---
export async function deletePaciente(id_usuario: number) {
  const repo = await getPacienteRepository();
  return repo.deletePaciente(id_usuario);
}

// --- USUARIOS: Obtener usuario por ID ---
export async function getUserById(id_usuario: number) {
  const repo = await getUserRepository();
  return repo.getUserById(id_usuario);
}

// --- USUARIOS: Actualizar usuario ---
export async function updateUser(id_usuario: number, data: any) {
  const repo = await getUserRepository();
  return repo.updateUser(id_usuario, data);
}

// --- USUARIOS: Eliminar usuario ---
export async function deleteUser(id_usuario: number) {
  const repo = await getUserRepository();
  return repo.deleteUser(id_usuario);
}
