// Tipos y interfaces para pacientes

export interface Paciente {
  id_usuario: number;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  fecha_nacimiento?: string | number | Date | null;
  genero?: string | null;
  email?: string;
  correo?: string;
  telefono_contacto?: string | null;
  direccion_residencial?: string | null;
  tipoDocumentoCodigo?: string;
  tipo_documento_codigo?: string;
  paisCodigo?: string;
  pais_codigo?: string;
  nui?: string;
  grupo_sanguineo?: string | null;
  ocupacion?: string | null;
  info_seguro_medico?: string | null;
  contacto_emergencia?: string | null;
  ultimo_diagnostico?: string | null;
  diagnosticosTotales?: number | null;
}

// Ajuste: PacienteUserData permite null en segundo_nombre y segundo_apellido, y agrega 'correo' como alias de 'email'.
export interface PacienteUserData {
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  email: string;
  correo?: string; // Alias para compatibilidad
  tipoDocumentoCodigo: string;
  paisCodigo: string;
  nui: string;
  estado?: string;
  roles?: string[];
}

// Ajuste: PacienteDetails ahora incluye los campos de usuario necesarios para updatePaciente
export interface PacienteDetails {
  primer_nombre?: string;
  segundo_nombre?: string | null;
  primer_apellido?: string;
  segundo_apellido?: string | null;
  email?: string;
  correo?: string;
  tipoDocumentoCodigo?: string;
  paisCodigo?: string;
  nui?: string;
  estado?: string;
  fecha_nacimiento?: Date | string | null;
  genero?: string | null;
  telefono_contacto?: string | null;
  direccion_residencial?: string | null;
  grupo_sanguineo?: string | null;
  ocupacion?: string | null;
  info_seguro_medico?: string | null;
  contacto_emergencia?: string | null;
  alergias?: string | null;
  antecedentes_medicos?: string | null;
  historial_visitas?: string | null;
}

export interface SearchedPatient {
  id_usuario: number;
  primer_nombre: string;
  primer_apellido: string;
  nui: string;
}

// Nueva interfaz User global
export interface User {
  id_usuario: number;
  id_tipo_documento: number;
  id_pais: number;
  nui: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  correo: string;
  fecha_registro: string;
  ultima_actividad: string | null;
  estado: string;
  firebase_uid: string;
  rol?: string; // Hacemos 'rol' opcional aquí para compatibilidad
  roles: string[];
  mfa_enabled?: boolean;
  // Campos para médicos
  id_especialidad?: number;
  numero_tarjeta_profesional?: string;
  años_experiencia?: number;
}
