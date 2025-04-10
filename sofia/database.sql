-- Base de datos: MedicalAI
CREATE DATABASE MedicalAI;
USE MedicalAI;

-- Tabla: Usuarios
CREATE TABLE Usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    nombre_completo VARCHAR(255) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE
);

-- Tabla: Credenciales 
CREATE TABLE Credenciales (
    id_usuario INT PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

-- Tabla: Autenticacion
CREATE TABLE Autenticacion (
    id_usuario INT,
    proveedor_autenticacion ENUM('local', 'google') NOT NULL,
    id_proveedor VARCHAR(255) NULL,
    PRIMARY KEY (id_usuario, proveedor_autenticacion),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

-- Tabla: ChatsArchivados
CREATE TABLE ChatsArchivados (
    id_chat INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    fecha_archivado DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

-- Tabla: MensajesArchivados (versión simplificada)
CREATE TABLE MensajesArchivados (
    id_mensaje INT PRIMARY KEY AUTO_INCREMENT,
    id_chat INT NOT NULL,
    tipo_remitente ENUM('usuario', 'ia') NOT NULL,
    contenido TEXT NOT NULL,
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_chat) REFERENCES ChatsArchivados(id_chat) ON DELETE CASCADE
) COMMENT 'Almacena todos los mensajes del chat';

-- Tabla nueva para adjuntos (opcional)
CREATE TABLE AdjuntosMensajes (
    id_adjunto INT PRIMARY KEY AUTO_INCREMENT,
    id_mensaje INT NOT NULL,
    tipo VARCHAR(50) NOT NULL COMMENT 'imagen/pdf/etc',
    url VARCHAR(512) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_mensaje) REFERENCES MensajesArchivados(id_mensaje) ON DELETE CASCADE
) COMMENT 'Almacena archivos adjuntos a mensajes';
