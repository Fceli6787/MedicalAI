-- Crear base de datos
CREATE DATABASE SOFIAMedicalAI;
USE SOFIAMedicalAI;

-- Tabla: TiposDocumento
CREATE TABLE TiposDocumento (
    id_tipo_documento INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    descripcion VARCHAR(50) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
);

-- Tabla: Roles
CREATE TABLE Roles (
    id_rol INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    estado BOOLEAN DEFAULT TRUE
);

-- Tabla: Especialidades
CREATE TABLE Especialidades (
    id_especialidad INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    estado BOOLEAN DEFAULT TRUE
);

-- Tabla: Paises
CREATE TABLE Paises (
    id_pais INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(3) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
);

-- Tabla: Usuarios
CREATE TABLE Usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    id_tipo_documento INT NOT NULL,
    id_pais INT NOT NULL,
    nui VARCHAR(20) NOT NULL,
    primer_nombre VARCHAR(50) NOT NULL,
    segundo_nombre VARCHAR(50),
    primer_apellido VARCHAR(50) NOT NULL,
    segundo_apellido VARCHAR(50),
    correo VARCHAR(255) NOT NULL UNIQUE,
    firebase_uid VARCHAR(255) UNIQUE,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultima_actividad DATETIME,
    estado ENUM('Activo', 'Inactivo', 'Bloqueado') DEFAULT 'Activo',
    FOREIGN KEY (id_tipo_documento) REFERENCES TiposDocumento(id_tipo_documento),
    FOREIGN KEY (id_pais) REFERENCES Paises(id_pais)
);

-- Tabla: UsuariosRoles
CREATE TABLE UsuariosRoles (
    id_usuario INT NOT NULL,
    id_rol INT NOT NULL,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id_usuario, id_rol),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_rol) REFERENCES Roles(id_rol)
);

-- Tabla: SesionesUsuario (Usando TIMESTAMP)
CREATE TABLE SesionesUsuario (
    id_sesion VARCHAR(255) PRIMARY KEY,
    id_usuario INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

-- Tabla: ResetCodes (Para recuperación de contraseña)
CREATE TABLE ResetCodes (
    id_reset INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NULL,
    usado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

-- Tabla: Medicos
CREATE TABLE Medicos (
    id_medico INT PRIMARY KEY,
    id_especialidad INT NOT NULL,
    numero_tarjeta_profesional VARCHAR(50) NOT NULL UNIQUE,
    fecha_ingreso DATE NOT NULL,
    años_experiencia INT,
    FOREIGN KEY (id_medico) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_especialidad) REFERENCES Especialidades(id_especialidad)
);

-- Tabla: HistorialMedicoEspecialidades
CREATE TABLE HistorialMedicoEspecialidades (
    id_medico INT NOT NULL,
    id_especialidad INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    certificado_url VARCHAR(512),
    PRIMARY KEY (id_medico, id_especialidad, fecha_inicio),
    FOREIGN KEY (id_medico) REFERENCES Medicos(id_medico),
    FOREIGN KEY (id_especialidad) REFERENCES Especialidades(id_especialidad)
);

-- Tabla: Pacientes
CREATE TABLE Pacientes (
    id_paciente INT PRIMARY KEY,
    grupo_sanguineo VARCHAR(5),
    alergias TEXT,
    antecedentes_medicos TEXT,
    FOREIGN KEY (id_paciente) REFERENCES Usuarios(id_usuario)
);

-- Tabla: TiposExamen
CREATE TABLE TiposExamen (
    id_tipo_examen INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE
);

-- Tabla: Diagnosticos
CREATE TABLE Diagnosticos (
    id_diagnostico INT PRIMARY KEY AUTO_INCREMENT,
    id_paciente INT NOT NULL,
    id_medico INT NOT NULL,
    id_tipo_examen INT NOT NULL,
    resultado TEXT NOT NULL,
    nivel_confianza DECIMAL(5, 2) NOT NULL,
    fecha_diagnostico DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('Pendiente', 'Completado', 'Anulado') DEFAULT 'Pendiente',
    FOREIGN KEY (id_paciente) REFERENCES Pacientes(id_paciente),
    FOREIGN KEY (id_medico) REFERENCES Medicos(id_medico),
    FOREIGN KEY (id_tipo_examen) REFERENCES TiposExamen(id_tipo_examen)
);

-- Tabla: AreasInteres
CREATE TABLE AreasInteres (
    id_area INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Tabla: ImagenesMedicas
CREATE TABLE ImagenesMedicas (
    id_imagen INT PRIMARY KEY AUTO_INCREMENT,
    id_diagnostico INT NOT NULL,
    tipo ENUM('DICOM', 'PNG', 'JPG') NOT NULL,
    url VARCHAR(512) NOT NULL,
    metadata JSON,
    fecha_carga DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_diagnostico) REFERENCES Diagnosticos(id_diagnostico)
);

-- Tabla: AreasInteresIdentificadas
CREATE TABLE AreasInteresIdentificadas (
    id_imagen INT NOT NULL,
    id_area INT NOT NULL,
    coordenadas JSON,
    descripcion TEXT,
    PRIMARY KEY (id_imagen, id_area),
    FOREIGN KEY (id_imagen) REFERENCES ImagenesMedicas(id_imagen),
    FOREIGN KEY (id_area) REFERENCES AreasInteres(id_area)
);

-- Tabla: Recomendaciones
CREATE TABLE Recomendaciones (
    id_recomendacion INT PRIMARY KEY AUTO_INCREMENT,
    id_diagnostico INT NOT NULL,
    descripcion TEXT NOT NULL,
    prioridad ENUM('Alta', 'Media', 'Baja') DEFAULT 'Media',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_diagnostico) REFERENCES Diagnosticos(id_diagnostico)
);

-- Tabla: SeguimientoRecomendaciones
CREATE TABLE SeguimientoRecomendaciones (
    id_seguimiento INT PRIMARY KEY AUTO_INCREMENT,
    id_recomendacion INT NOT NULL,
    estado ENUM('Pendiente', 'En Progreso', 'Completada', 'Cancelada') DEFAULT 'Pendiente',
    notas TEXT,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_recomendacion) REFERENCES Recomendaciones(id_recomendacion)
);

-- Tabla: TiposNotificacion
CREATE TABLE TiposNotificacion (
    id_tipo_notificacion INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    plantilla TEXT NOT NULL,
    icono VARCHAR(50),
    color VARCHAR(20),
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Notificaciones
CREATE TABLE Notificaciones (
    id_notificacion INT PRIMARY KEY AUTO_INCREMENT,
    id_tipo_notificacion INT NOT NULL,
    id_usuario INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    link VARCHAR(255),
    estado ENUM('No Leída', 'Leída', 'Archivada') DEFAULT 'No Leída',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura TIMESTAMP NULL,
    FOREIGN KEY (id_tipo_notificacion) REFERENCES TiposNotificacion(id_tipo_notificacion),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

-- Insertar roles básicos
INSERT INTO Roles (nombre, descripcion) VALUES
('admin', 'Administrador del sistema'),
('medico', 'Médico que realiza diagnósticos'),
('paciente', 'Paciente que recibe diagnósticos');

-- Insertar tipos de documento comunes
INSERT INTO TiposDocumento (codigo, descripcion) VALUES
('CC', 'Cédula de Ciudadanía'),
('CE', 'Cédula de Extranjería'),
('PS', 'Pasaporte');

-- Insertar algunos países
INSERT INTO Paises (codigo, nombre) VALUES
('COL', 'Colombia');

-- Insertar especialidades médicas comunes
INSERT INTO Especialidades (nombre, descripcion) VALUES
('Radiología', 'Especialista en diagnóstico por imágenes'),
('Neurología', 'Especialista en sistema nervioso'),
('Cardiología', 'Especialista en sistema cardiovascular');

-- Insertar tipos de examen
INSERT INTO TiposExamen (nombre, descripcion) VALUES
('Radiografía', 'Imagen por rayos X'),
('Resonancia Magnética', 'Imagen por resonancia magnética nuclear'),
('Tomografía', 'Tomografía computarizada');

-- Insertar tipos de notificación básicos
INSERT INTO TiposNotificacion (nombre, plantilla, icono, color) VALUES
('DiagnosticoCompletado', 'El diagnóstico para {paciente} ha sido completado. Haga clic para ver los resultados.', 'check-circle', '#059669'),
('ResultadosDisponibles', 'Los resultados del análisis de {paciente} están disponibles para revisión.', 'clipboard-list', '#2563eb'),
('RecordatorioCita', 'Recordatorio: Tiene una cita programada con {paciente} para {fecha}.', 'calendar', '#d97706'),
('ActualizacionSistema', 'Se ha realizado una actualización importante en el sistema: {mensaje}', 'info-circle', '#6366f1');

-- Índices para optimizar consultas
CREATE INDEX idx_notificaciones_usuario_estado ON Notificaciones(id_usuario, estado);
CREATE INDEX idx_notificaciones_fecha ON Notificaciones(fecha_creacion);
CREATE INDEX idx_sesiones_usuario ON SesionesUsuario(id_usuario);
CREATE INDEX idx_sesiones_expiracion ON SesionesUsuario(fecha_expiracion);
CREATE INDEX idx_reset_codigo ON ResetCodes(codigo);
CREATE INDEX idx_reset_usuario ON ResetCodes(id_usuario);
