-- Base de datos: `sofiamedicalai`

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `areasinteres`

CREATE TABLE `areasinteres` (
  `id_area` INTEGER NOT NULL,
  `nombre` TEXT NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  PRIMARY KEY (`id_area`)
);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `areasinteresidentificadas`

CREATE TABLE `areasinteresidentificadas` (
  `id_imagen` INTEGER NOT NULL,
  `id_area` INTEGER NOT NULL,
  `coordenadas` TEXT DEFAULT NULL CHECK (json_valid(`coordenadas`)),
  `descripcion` TEXT DEFAULT NULL,
  PRIMARY KEY (`id_imagen`, `id_area`),
  FOREIGN KEY (`id_imagen`) REFERENCES `imagenesmedicas` (`id_imagen`),
  FOREIGN KEY (`id_area`) REFERENCES `areasinteres` (`id_area`)
);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `diagnosticos`

CREATE TABLE `diagnosticos` (
  `id_diagnostico` INTEGER NOT NULL,
  `id_paciente` INTEGER NOT NULL,
  `id_medico` INTEGER NOT NULL,
  `id_tipo_examen` INTEGER NOT NULL,
  `resultado` TEXT NOT NULL,
  `nivel_confianza` REAL NOT NULL,
  `fecha_diagnostico` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `estado` TEXT DEFAULT 'Pendiente' CHECK (`estado` IN ('Pendiente', 'Completado', 'Anulado')),
  PRIMARY KEY (`id_diagnostico`),
  FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id_usuario`),
  FOREIGN KEY (`id_medico`) REFERENCES `medicos` (`id_usuario`),
  FOREIGN KEY (`id_tipo_examen`) REFERENCES `tiposexamen` (`id_tipo_examen`)
);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `especialidades`

CREATE TABLE `especialidades` (
  `id_especialidad` INTEGER NOT NULL,
  `nombre` TEXT NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `estado` INTEGER DEFAULT 1,
  PRIMARY KEY (`id_especialidad`),
  UNIQUE (`nombre`)
);

-- Volcado de datos para la tabla `especialidades`

INSERT INTO `especialidades` (`id_especialidad`, `nombre`, `descripcion`, `estado`) VALUES
(1, 'Radiología', 'Especialista en diagnóstico por imágenes', 1),
(2, 'Neurología', 'Especialista en sistema nervioso', 1),
(3, 'Cardiología', 'Especialista en sistema cardiovascular', 1);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `historialmedicoespecialidades`

CREATE TABLE `historialmedicoespecialidades` (
  `id_medico` INTEGER NOT NULL,
  `id_especialidad` INTEGER NOT NULL,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE DEFAULT NULL,
  `certificado_url` TEXT DEFAULT NULL,
  PRIMARY KEY (`id_medico`, `id_especialidad`, `fecha_inicio`),
  FOREIGN KEY (`id_medico`) REFERENCES `medicos` (`id_usuario`),
  FOREIGN KEY (`id_especialidad`) REFERENCES `especialidades` (`id_especialidad`)
);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `imagenesmedicas`

CREATE TABLE `imagenesmedicas` (
  `id_imagen` INTEGER NOT NULL,
  `id_diagnostico` INTEGER NOT NULL,
  `tipo` TEXT NOT NULL CHECK (`tipo` IN ('DICOM', 'PNG', 'JPG')),
  `url` TEXT NOT NULL,
  `metadata` TEXT DEFAULT NULL CHECK (json_valid(`metadata`)),
  `fecha_carga` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_imagen`),
  FOREIGN KEY (`id_diagnostico`) REFERENCES `diagnosticos` (`id_diagnostico`)
);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `medicos`

CREATE TABLE `medicos` (
  `id_usuario` INTEGER NOT NULL,
  `id_especialidad` INTEGER NOT NULL,
  `numero_tarjeta_profesional` TEXT NOT NULL,
  `fecha_ingreso` DATE NOT NULL,
  `años_experiencia` INTEGER DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE (`numero_tarjeta_profesional`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  FOREIGN KEY (`id_especialidad`) REFERENCES `especialidades` (`id_especialidad`)
);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `notificaciones`

CREATE TABLE `notificaciones` (
  `id_notificacion` INTEGER NOT NULL,
  `id_tipo_notificacion` INTEGER NOT NULL,
  `id_usuario` INTEGER NOT NULL,
  `titulo` TEXT NOT NULL,
  `mensaje` TEXT NOT NULL,
  `link` TEXT DEFAULT NULL,
  `estado` TEXT DEFAULT 'No Leída' CHECK (`estado` IN ('No Leída', 'Leída', 'Archivada')),
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_lectura` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id_notificacion`),
  FOREIGN KEY (`id_tipo_notificacion`) REFERENCES `tiposnotificacion` (`id_tipo_notificacion`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `pacientes`

CREATE TABLE `pacientes` (
  `id_usuario` INTEGER NOT NULL,
  `grupo_sanguineo` TEXT DEFAULT NULL,
  `alergias` TEXT DEFAULT NULL,
  `antecedentes_medicos` TEXT DEFAULT NULL,
  `telefono_contacto` TEXT DEFAULT NULL,
  `direccion_residencial` TEXT DEFAULT NULL,
  `fecha_nacimiento` DATE DEFAULT NULL,
  `genero` TEXT DEFAULT NULL,
  `ocupacion` TEXT DEFAULT NULL,
  `info_seguro_medico` TEXT DEFAULT NULL,
  `contacto_emergencia` TEXT DEFAULT NULL,
  `historial_visitas` TEXT DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `paises`

CREATE TABLE `paises` (
  `id_pais` INTEGER NOT NULL,
  `codigo` TEXT NOT NULL,
  `nombre` TEXT NOT NULL,
  `estado` INTEGER DEFAULT 1,
  PRIMARY KEY (`id_pais`),
  UNIQUE (`codigo`)
);

-- Volcado de datos para la tabla `paises`

INSERT INTO `paises` (`id_pais`, `codigo`, `nombre`, `estado`) VALUES
(1, 'COL', 'Colombia', 1);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `recomendaciones`

CREATE TABLE `recomendaciones` (
  `id_recomendacion` INTEGER NOT NULL,
  `id_diagnostico` INTEGER NOT NULL,
  `descripcion` TEXT NOT NULL,
  `prioridad` TEXT DEFAULT 'Media' CHECK (`prioridad` IN ('Alta', 'Media', 'Baja')),
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_recomendacion`),
  FOREIGN KEY (`id_diagnostico`) REFERENCES `diagnosticos` (`id_diagnostico`)
);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `resetcodes`

CREATE TABLE `resetcodes` (
  `id_reset` INTEGER NOT NULL,
  `id_usuario` INTEGER NOT NULL,
  `codigo` TEXT NOT NULL,
  `fecha_expiracion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `estado` TEXT DEFAULT 'Activo' CHECK (`estado` IN ('Activo', 'Usado', 'Expirado')),
  PRIMARY KEY (`id_reset`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `roles`

CREATE TABLE `roles` (
  `id_rol` INTEGER NOT NULL,
  `nombre` TEXT NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `estado` INTEGER DEFAULT 1,
  PRIMARY KEY (`id_rol`),
  UNIQUE (`nombre`)
);

-- Volcado de datos para la tabla `roles`

INSERT INTO `roles` (`id_rol`, `nombre`, `descripcion`, `estado`) VALUES
(1, 'admin', 'Administrador del sistema', 1),
(2, 'medico', 'Médico que realiza diagnósticos', 1),
(3, 'paciente', 'Paciente que recibe diagnósticos', 1);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `seguimientorecomendaciones`

CREATE TABLE `seguimientorecomendaciones` (
  `id_seguimiento` INTEGER NOT NULL,
  `id_recomendacion` INTEGER NOT NULL,
  `estado` TEXT DEFAULT 'Pendiente' CHECK (`estado` IN ('Pendiente', 'En Progreso', 'Completada', 'Cancelada')),
  `notas` TEXT DEFAULT NULL,
  `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_seguimiento`),
  FOREIGN KEY (`id_recomendacion`) REFERENCES `recomendaciones` (`id_recomendacion`)
);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `sesionesusuario`

CREATE TABLE `sesionesusuario` (
  `id_sesion` TEXT NOT NULL,
  `id_usuario` INTEGER NOT NULL,
  `ip_address` TEXT DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_sesion`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `tiposdocumento`

CREATE TABLE `tiposdocumento` (
  `id_tipo_documento` INTEGER NOT NULL,
  `codigo` TEXT NOT NULL,
  `descripcion` TEXT NOT NULL,
  `estado` INTEGER DEFAULT 1,
  PRIMARY KEY (`id_tipo_documento`),
  UNIQUE (`codigo`)
);

-- Volcado de datos para la tabla `tiposdocumento`

INSERT INTO `tiposdocumento` (`id_tipo_documento`, `codigo`, `descripcion`, `estado`) VALUES
(1, 'CC', 'Cédula de Ciudadanía', 1),
(2, 'CE', 'Cédula de Extranjería', 1),
(3, 'PS', 'Pasaporte', 1);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `tiposexamen`

CREATE TABLE `tiposexamen` (
  `id_tipo_examen` INTEGER NOT NULL,
  `nombre` TEXT NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `estado` INTEGER DEFAULT 1,
  PRIMARY KEY (`id_tipo_examen`)
);

-- Volcado de datos para la tabla `tiposexamen`

INSERT INTO `tiposexamen` (`id_tipo_examen`, `nombre`, `descripcion`, `estado`) VALUES
(1, 'Radiografía', 'Imagen por rayos X', 1),
(2, 'Resonancia Magnética', 'Imagen por resonancia magnética nuclear', 1),
(3, 'Tomografía', 'Tomografía computarizada', 1);

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `tiposnotificacion`

CREATE TABLE `tiposnotificacion` (
  `id_tipo_notificacion` INTEGER NOT NULL,
  `nombre` TEXT NOT NULL,
  `plantilla` TEXT NOT NULL,
  `icono` TEXT DEFAULT NULL,
  `color` TEXT DEFAULT NULL,
  `estado` INTEGER DEFAULT 1,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_tipo_notificacion`)
);

-- Volcado de datos para la tabla `tiposnotificacion`

INSERT INTO `tiposnotificacion` (`id_tipo_notificacion`, `nombre`, `plantilla`, `icono`, `color`, `estado`, `fecha_creacion`) VALUES
(1, 'DiagnosticoCompletado', 'El diagnóstico para {paciente} ha sido completado. Haga clic para ver los resultados.', 'check-circle', '#059669', 1, '2025-04-29 19:30:57'),
(2, 'ResultadosDisponibles', 'Los resultados del análisis de {paciente} están disponibles para revisión.', 'clipboard-list', '#2563eb', 1, '2025-04-29 19:30:57'),
(3, 'RecordatorioCita', 'Recordatorio: Tiene una cita programada con {paciente} para {fecha}.', 'calendar', '#d97706', 1, '2025-04-29 19:30:57'),
(4, 'ActualizacionSistema', 'Se ha realizado una actualización importante en el sistema: {mensaje}', 'info-circle', '#6366f1', 1, '2025-04-29 19:30:57');

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `usuarios`

CREATE TABLE `usuarios` (
  `id_usuario` INTEGER NOT NULL,
  `id_tipo_documento` INTEGER NOT NULL,
  `id_pais` INTEGER NOT NULL,
  `nui` TEXT NOT NULL,
  `primer_nombre` TEXT NOT NULL,
  `segundo_nombre` TEXT DEFAULT NULL,
  `primer_apellido` TEXT NOT NULL,
  `segundo_apellido` TEXT DEFAULT NULL,
  `correo` TEXT NOT NULL,
  `firebase_uid` TEXT DEFAULT NULL,
  `fecha_registro` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `ultima_actividad` DATETIME DEFAULT NULL,
  `estado` TEXT DEFAULT 'Activo' CHECK (`estado` IN ('Activo', 'Inactivo', 'Bloqueado')),
  PRIMARY KEY (`id_usuario`),
  UNIQUE (`correo`),
  FOREIGN KEY (`id_tipo_documento`) REFERENCES `tiposdocumento` (`id_tipo_documento`),
  FOREIGN KEY (`id_pais`) REFERENCES `paises` (`id_pais`)
);

-- Volcado de datos para la tabla `usuarios`

INSERT INTO `usuarios` (`id_usuario`, `id_tipo_documento`, `id_pais`, `nui`, `primer_nombre`, `segundo_nombre`, `primer_apellido`, `segundo_apellido`, `correo`, `firebase_uid`, `fecha_registro`, `ultima_actividad`, `estado`) VALUES
(1, 1, 1, '123456', 'Juan', NULL, 'Rodriguez', NULL, 'maria.rodriguez@sofiamedical.com', 'b7r3RDUaW3XTFCLwKT8odLPz3KB2', '2025-04-29 14:35:44', NULL, 'Activo');

-- --------------------------------------------------------

-- Estructura de tabla para la tabla `usuariosroles`

CREATE TABLE `usuariosroles` (
  `id_usuario` INTEGER NOT NULL,
  `id_rol` INTEGER NOT NULL,
  `fecha_asignacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `estado` INTEGER DEFAULT 1,
  PRIMARY KEY (`id_usuario`, `id_rol`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`)
);

-- Volcado de datos para la tabla `usuariosroles`

INSERT INTO `usuariosroles` (`id_usuario`, `id_rol`, `fecha_asignacion`, `estado`) VALUES
(1, 2, '2025-04-29 14:35:44', 1);
