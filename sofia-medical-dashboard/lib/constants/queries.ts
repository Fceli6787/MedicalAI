// Consultas SQL para la aplicación Sofia Medical Dashboard

export const COUNT_ROLES = 'SELECT COUNT(*) as count FROM Roles';

export const SELECT_ROLE_BY_NAME = 'SELECT id_rol FROM Roles WHERE nombre = ?';
export const INSERT_ROLE = 'INSERT INTO Roles (nombre) VALUES (?)';

export const SELECT_TIPODOCUMENTO_BY_CODIGO = 'SELECT id_tipo_documento FROM TiposDocumento WHERE codigo = ?';
export const INSERT_TIPODOCUMENTO = 'INSERT INTO TiposDocumento (id_tipo_documento, codigo, descripcion) VALUES (?, ?, ?)';

export const SELECT_PAIS_BY_CODIGO = 'SELECT id_pais FROM Paises WHERE codigo = ?';
export const INSERT_PAIS = 'INSERT INTO Paises (id_pais, codigo, nombre) VALUES (?, ?, ?)';

export const SELECT_TIPOEXAMEN_BY_NOMBRE = 'SELECT id_tipo_examen FROM TiposExamen WHERE nombre = ?';
export const INSERT_TIPOEXAMEN = 'INSERT INTO TiposExamen (id_tipo_examen, nombre, descripcion) VALUES (?, ?, ?)';

export const SELECT_ESPECIALIDAD_BY_NOMBRE = 'SELECT id_especialidad FROM Especialidades WHERE nombre = ?';
export const INSERT_ESPECIALIDAD = 'INSERT INTO Especialidades (id_especialidad, nombre, descripcion) VALUES (?, ?, ?)';

export const SELECT_ALL_USUARIOS = 'SELECT * FROM Usuarios';

export const INSERT_USUARIO_FULL = `
  INSERT INTO Usuarios (id_usuario, id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, fecha_registro, ultima_actividad, estado)
  VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, NULL, ?)
`;

export const SELECT_USUARIO_BY_CORREO = 'SELECT id_usuario FROM Usuarios WHERE correo = ?';

export const INSERT_USUARIO_ROL = 'INSERT INTO UsuariosRoles (id_usuario, id_rol) VALUES (?, ?)';

export const INSERT_MEDICO = `
  INSERT INTO Medicos (id_usuario, id_especialidad, numero_tarjeta_profesional, fecha_ingreso, años_experiencia)
  VALUES (?, ?, ?, ?, ?)
`;

export const SELECT_ALL_PACIENTES = `
  SELECT
    p.id_paciente,
    u.primer_nombre,
    u.segundo_nombre,
    u.primer_apellido,
    u.segundo_apellido,
    u.correo,
    u.fecha_registro,
    p.grupo_sanguineo,
    p.alergias,
    p.antecedentes_medicos,
    (SELECT COUNT(*) FROM Diagnosticos d WHERE d.id_paciente = p.id_paciente) AS diagnosticosTotales,
    (SELECT MAX(fecha_diagnostico) FROM Diagnosticos d WHERE d.id_paciente = p.id_paciente) AS ultimo_diagnostico
  FROM Pacientes p
  JOIN Usuarios u ON p.id_paciente = u.id_usuario
`;

export const SELECT_ALL_DIAGNOSTICOS = 'SELECT * FROM Diagnosticos';

// Consulta para addPaciente (construida dinámicamente en la función, no como constante fija)
// export const INSERT_PACIENTE = 'INSERT INTO Pacientes (...) VALUES (...)';

// Consulta para addDiagnostico (construida dinámicamente en la función, no como constante fija)
// export const INSERT_DIAGNOSTICO = 'INSERT INTO Diagnosticos (...) VALUES (...)';

export const SELECT_USUARIO_BY_FIREBASE_UID = `
  SELECT id_usuario, id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, fecha_registro, ultima_actividad, estado, firebase_uid
  FROM Usuarios WHERE firebase_uid = ?
`;

export const SELECT_ROLES_BY_USUARIO_ID = `
  SELECT r.nombre FROM Roles r JOIN UsuariosRoles ur ON r.id_rol = ur.id_rol WHERE ur.id_usuario = ?
`;

export const SELECT_USUARIO_BY_CORREO_BASIC = `
  SELECT id_usuario, correo, primer_nombre, primer_apellido, estado
  FROM Usuarios WHERE correo = ?
`;

export const VALIDATE_USER_ROLE = `
  SELECT 1
  FROM UsuariosRoles ur
  JOIN Roles r ON ur.id_rol = r.id_rol
  JOIN Usuarios u ON ur.id_usuario = u.id_usuario
  WHERE u.correo = ? AND r.nombre = ?
`;
