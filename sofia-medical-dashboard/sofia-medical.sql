CREATE TABLE `areasinteres` (
  `id_area` INTEGER NOT NULL,
  `nombre` TEXT NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  PRIMARY KEY (`id_area`)
);


CREATE TABLE `areasinteresidentificadas` (
  `id_imagen` INTEGER NOT NULL,
  `id_area` INTEGER NOT NULL,
  `coordenadas` TEXT DEFAULT NULL CHECK (json_valid(`coordenadas`)),
  `descripcion` TEXT DEFAULT NULL,
  PRIMARY KEY (`id_imagen`, `id_area`),
  FOREIGN KEY (`id_imagen`) REFERENCES `imagenesmedicas` (`id_imagen`),
  FOREIGN KEY (`id_area`) REFERENCES `areasinteres` (`id_area`)
);


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

INSERT INTO diagnosticos (id_diagnostico, id_paciente, id_medico, id_tipo_examen, resultado, nivel_confianza, fecha_diagnostico, estado) VALUES (1, 4, 1, 1, 'Fractura de radio', 0.95, '2025-05-08 19:46:26', 'Completado');
INSERT INTO diagnosticos (id_diagnostico, id_paciente, id_medico, id_tipo_examen, resultado, nivel_confianza, fecha_diagnostico, estado) VALUES (2, 5, 1, 1, 'Fractura de la clavícula', 0.95, '2025-05-11 04:42:27', 'Completado');
INSERT INTO diagnosticos (id_diagnostico, id_paciente, id_medico, id_tipo_examen, resultado, nivel_confianza, fecha_diagnostico, estado) VALUES (3, 4, 1, 1, 'Fractura de cadera', 0.95, '2025-05-14 23:44:40', 'Completado');
INSERT INTO diagnosticos (id_diagnostico, id_paciente, id_medico, id_tipo_examen, resultado, nivel_confianza, fecha_diagnostico, estado) VALUES (4, 4, 6, 1, 'Fractura de cráneo', 0.95, '2025-05-20 02:15:27', 'Completado');
INSERT INTO diagnosticos (id_diagnostico, id_paciente, id_medico, id_tipo_examen, resultado, nivel_confianza, fecha_diagnostico, estado) VALUES (5, 4, 6, 4, 'Sinusitis Maxilar Derecha', 0.95, '2025-05-21 04:15:24', 'Completado');
INSERT INTO diagnosticos (id_diagnostico, id_paciente, id_medico, id_tipo_examen, resultado, nivel_confianza, fecha_diagnostico, estado) VALUES (6, 4, 6, 1, 'Prótesis Total de Rodilla con posible Aflojamiento Aséptico', 0.95, '2025-05-22 00:25:28', 'Completado');

CREATE TABLE `especialidades` (
  `id_especialidad` INTEGER NOT NULL,
  `nombre` TEXT NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `estado` INTEGER DEFAULT 1,
  PRIMARY KEY (`id_especialidad`),
  UNIQUE (`nombre`)
);

INSERT INTO especialidades (id_especialidad, nombre, descripcion, estado) VALUES (1, 'Radiología', 'Especialista en diagnóstico por imágenes', 1);
INSERT INTO especialidades (id_especialidad, nombre, descripcion, estado) VALUES (2, 'Neurología', 'Especialista en sistema nervioso', 1);
INSERT INTO especialidades (id_especialidad, nombre, descripcion, estado) VALUES (3, 'Cardiología', 'Especialista en sistema cardiovascular', 1);

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

INSERT INTO imagenesmedicas (id_imagen, id_diagnostico, tipo, url, metadata, fecha_carga) VALUES (1, 1, 'JPG', 'generated_image_for_diag_1.jpg', '{"imageBase64Provided":true,"originalFileName":"forearm-x-ray-after-car-600nw-2291903371.jpg","aiAnalysisDetails":{"condition":"Fractura de radio","confidence":95,"description":"Fractura diafisaria del radio con desplazamiento mínimo. Integridad del cúbito preservada. Sin signos de fractura abierta. No se observan anomalías óseas adicionales","pronostico":{"tiempo_recuperacion":"6-8 semanas","probabilidad_mejoria":"95%"}}}', '2025-05-08 19:46:26');
INSERT INTO imagenesmedicas (id_imagen, id_diagnostico, tipo, url, metadata, fecha_carga) VALUES (2, 2, 'JPG', 'diag_2_1746938550872-117568549.jpg', '{"originalFileName":"generated_image_for_diag_2.jpg","aiAnalysisDetails":{"condition":"Fractura de la clavícula","confidence":95,"description":"Se observa una fractura de la clavícula en su tercio medio.. La fractura presenta desplazamiento, con los extremos óseos separados.. No se observan signos de fracturas asociadas en la escápula o en las costillas adyacentes.. La piel y los tejidos blandos circundantes no muestran signos de lesión penetrante o abierta.","recomendaciones":["Inmovilización del hombro y del brazo con una férula o cabestrillo para permitir la correcta alineación y curación de la fractura.","Aplicación de hielo en la zona afectada durante los primeros días para reducir la inflamación y el dolor.","Administración de analgésicos no opioides para el control del dolor.","Realización de ejercicios de movilidad y fortalecimiento del hombro una vez que la fractura haya comenzado a sanar, bajo supervisión médica.","Seguimiento radiológico para evaluar la evolución de la fractura y asegurar una correcta consolidación."],"pronostico":{"tiempo_recuperacion":"6-8 semanas","probabilidad_mejoria":"95%"}}}', '2025-05-11 04:42:27');
INSERT INTO imagenesmedicas (id_imagen, id_diagnostico, tipo, url, metadata, fecha_carga) VALUES (3, 3, 'JPG', 'diag_3_1747266279998-361253040.jpg', '{"originalFileName":"ha-extraido-brazo-roto-brazo-derecho_872789-242.jpg","aiAnalysisDetails":{"condition":"Fractura de cadera","confidence":95,"description":"Fractura de la cadera en la región del cuello femoral. Desplazamiento significativo de los fragmentos óseos. Ausencia de signos de infección en la imagen. Presencia de osteoporosis en el hueso adyacente","recomendaciones":["Inmovilización inmediata del área afectada","Aplicación de hielo para reducir el dolor e inflamación","Administración de analgésicos y antiinflamatorios según prescripción","Cirugía ortopédica para la reducción y fijación de la fractura","Rehabilitación física postoperatoria para recuperar la movilidad y fortaleza"],"pronostico":{"tiempo_recuperacion":"6-12 meses","probabilidad_mejoria":"85%"}}}', '2025-05-14 23:44:40');
INSERT INTO imagenesmedicas (id_imagen, id_diagnostico, tipo, url, metadata, fecha_carga) VALUES (4, 4, 'JPG', 'diag_4_1747707327171-686775601.jpg', '{"originalFileName":"descarga.jpg","aiAnalysisDetails":{"condition":"Fractura de cráneo","confidence":95,"description":"Se observa una línea de fractura lineal en la región parietal derecha del cráneo.. No hay evidencia de desplazamiento óseo.. No se observan signos de hemorragia intracraneal.. La estructura ósea circundante parece intacta.","recomendaciones":["Aplicar hielo en la zona afectada para reducir la inflamación.","Descanso absoluto y evitar actividades físicas intensas.","Tomar analgésicos como paracetamol para el manejo del dolor.","Monitorear signos de complicaciones como mareos, náuseas o cambios en el nivel de conciencia.","Realizar seguimiento con controles radiológicos periódicos para evaluar la evolución de la fractura."],"pronostico":{"tiempo_recuperacion":"6-8 semanas","probabilidad_mejoria":"90%"}}}', '2025-05-20 02:15:27');
INSERT INTO imagenesmedicas (id_imagen, id_diagnostico, tipo, url, metadata, fecha_carga) VALUES (5, 5, 'JPG', 'diag_5_1747800933954-902156195.jpg', '{"originalFileName":"1.3-ullal-entre-premolars.jpg","aiAnalysisDetails":{"condition":"Sinusitis Maxilar Derecha","confidence":95,"description":"Opacificación del seno maxilar derecho en la radiografía panorámica dental, indicativo de inflamación o acumulación de fluidos.. Posible engrosamiento de la membrana mucosa del seno maxilar derecho, sugerido por la radiodensidad aumentada en comparación con el seno maxilar izquierdo.. Ausencia de evidencia clara de lesiones dentales asociadas o infecciones periapicales que puedan contribuir a la sinusitis.","recomendaciones":["Descongestionantes orales o nasales para reducir la inflamación y facilitar el drenaje del seno.","Irrigación nasal con solución salina para limpiar los senos y aliviar la congestión.","Analgésicos de venta libre (ibuprofeno o paracetamol) para controlar el dolor y la inflamación.","Considerar el uso de antibióticos si los síntomas persisten o empeoran, bajo supervisión médica.","Evitar factores irritantes como el humo del tabaco y alérgenos conocidos.","Mantener una buena hidratación para ayudar a fluidificar las secreciones."],"pronostico":{"tiempo_recuperacion":"2-4 semanas con tratamiento adecuado","probabilidad_mejoria":"85%"}}}', '2025-05-21 04:15:25');
INSERT INTO imagenesmedicas (id_imagen, id_diagnostico, tipo, url, metadata, fecha_carga) VALUES (6, 6, 'JPG', 'diag_6_1747873528787-125338556.jpg', '{"originalFileName":"Fractura-periprotesica-de-Rodilla-2.jpg","aiAnalysisDetails":{"condition":"Prótesis Total de Rodilla con posible Aflojamiento Aséptico","confidence":95,"description":"Visualización de implantes protésicos en la articulación de la rodilla.. Evidencia radiolúcida alrededor de los componentes protésicos femoral y tibial, sugestiva de posible aflojamiento aséptico.. Osteólisis periprotésica leve identificada alrededor de los componentes de la prótesis.. No hay evidencia de fracturas periprotésicas agudas.. La alineación general de la prótesis parece aceptable en esta vista AP.","recomendaciones":["Se recomienda manejo del dolor con analgésicos según sea necesario. Considerar AINEs o paracetamol.","Fisioterapia con ejercicios de fortalecimiento muscular suaves para promover la estabilidad de la rodilla.","Considerar modificación de actividades para minimizar la carga en la rodilla afectada.","Evaluación adicional con estudios de imagen avanzados, como gammagrafía ósea o aspiración articular, para descartar infección.","Consulta con cirujano ortopédico especialista en reemplazo articular para evaluar la necesidad de revisión de la prótesis, según la progresión de los síntomas y hallazgos adicionales."],"pronostico":{"tiempo_recuperacion":"Variable, dependiendo de la intervención (conservadora o quirúrgica)","probabilidad_mejoria":"Moderada a alta con el manejo adecuado; la revisión de la prótesis puede mejorar el dolor y la función significativamente."}}}', '2025-05-22 00:25:28');

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

INSERT INTO medicos (id_usuario, id_especialidad, numero_tarjeta_profesional, fecha_ingreso, años_experiencia) VALUES (1, 1, 'TP123', '2025-05-08', 5);
INSERT INTO medicos (id_usuario, id_especialidad, numero_tarjeta_profesional, fecha_ingreso, años_experiencia) VALUES (6, 2, '4343242', '2025-05-12', 2);

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

INSERT INTO pacientes (id_usuario, grupo_sanguineo, alergias, antecedentes_medicos, telefono_contacto, direccion_residencial, fecha_nacimiento, genero, ocupacion, info_seguro_medico, contacto_emergencia, historial_visitas) VALUES (4, NULL, NULL, NULL, NULL, NULL, 1985, 'otro', NULL, NULL, NULL, NULL);
INSERT INTO pacientes (id_usuario, grupo_sanguineo, alergias, antecedentes_medicos, telefono_contacto, direccion_residencial, fecha_nacimiento, genero, ocupacion, info_seguro_medico, contacto_emergencia, historial_visitas) VALUES (5, 'A+', NULL, NULL, '42542421', 'Calle 222 # 47 - 32', '2024-01-02', 'masculino', 'Ingenierio ', 'EPS Sura', 'SOFIA ANDREA YURLEIDYS 3273562733', NULL);
INSERT INTO pacientes (id_usuario, grupo_sanguineo, alergias, antecedentes_medicos, telefono_contacto, direccion_residencial, fecha_nacimiento, genero, ocupacion, info_seguro_medico, contacto_emergencia, historial_visitas) VALUES (11, 'AB+', NULL, NULL, '3122454352', 'Calle 144 # 70C - 23', '1994-05-18', 'Femenino', 'Ingeniera', 'EPS Nueva EPS', 'SOFIA ANDREA YURLEIDYS 3273562733', NULL);

CREATE TABLE `paises` (
  `id_pais` INTEGER NOT NULL,
  `codigo` TEXT NOT NULL,
  `nombre` TEXT NOT NULL,
  `estado` INTEGER DEFAULT 1,
  PRIMARY KEY (`id_pais`),
  UNIQUE (`codigo`)
);

INSERT INTO paises (id_pais, codigo, nombre, estado) VALUES (1, 'COL', 'Colombia', 1);

CREATE TABLE `recomendaciones` (
  `id_recomendacion` INTEGER NOT NULL,
  `id_diagnostico` INTEGER NOT NULL,
  `descripcion` TEXT NOT NULL,
  `prioridad` TEXT DEFAULT 'Media' CHECK (`prioridad` IN ('Alta', 'Media', 'Baja')),
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_recomendacion`),
  FOREIGN KEY (`id_diagnostico`) REFERENCES `diagnosticos` (`id_diagnostico`)
);

INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (1, 1, 'Aplicar férula de inmovilización por 4-6 semanas', 'Media', '2025-05-08 19:46:26');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (2, 1, 'Administrar analgésicos como paracetamol o ibuprofeno según necesidad', 'Media', '2025-05-08 19:46:27');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (3, 1, 'Realizar reposo relativo y evitar esfuerzos en el brazo afectado', 'Media', '2025-05-08 19:46:27');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (4, 1, 'Revisar la evolución en 2 semanas para evaluar la consolidación', 'Media', '2025-05-08 19:46:27');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (5, 2, 'Inmovilización del hombro y del brazo con una férula o cabestrillo para permitir la correcta alineación y curación de la fractura.', 'Media', '2025-05-11 04:42:27');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (6, 2, 'Aplicación de hielo en la zona afectada durante los primeros días para reducir la inflamación y el dolor.', 'Media', '2025-05-11 04:42:27');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (7, 2, 'Administración de analgésicos no opioides para el control del dolor.', 'Media', '2025-05-11 04:42:28');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (8, 2, 'Realización de ejercicios de movilidad y fortalecimiento del hombro una vez que la fractura haya comenzado a sanar, bajo supervisión médica.', 'Media', '2025-05-11 04:42:28');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (9, 2, 'Seguimiento radiológico para evaluar la evolución de la fractura y asegurar una correcta consolidación.', 'Media', '2025-05-11 04:42:28');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (10, 3, 'Inmovilización inmediata del área afectada', 'Media', '2025-05-14 23:44:40');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (11, 3, 'Aplicación de hielo para reducir el dolor e inflamación', 'Media', '2025-05-14 23:44:40');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (12, 3, 'Administración de analgésicos y antiinflamatorios según prescripción', 'Media', '2025-05-14 23:44:40');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (13, 3, 'Cirugía ortopédica para la reducción y fijación de la fractura', 'Media', '2025-05-14 23:44:40');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (14, 3, 'Rehabilitación física postoperatoria para recuperar la movilidad y fortaleza', 'Media', '2025-05-14 23:44:40');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (15, 4, 'Aplicar hielo en la zona afectada para reducir la inflamación.', 'Media', '2025-05-20 02:15:27');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (16, 4, 'Descanso absoluto y evitar actividades físicas intensas.', 'Media', '2025-05-20 02:15:27');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (17, 4, 'Tomar analgésicos como paracetamol para el manejo del dolor.', 'Media', '2025-05-20 02:15:27');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (18, 4, 'Monitorear signos de complicaciones como mareos, náuseas o cambios en el nivel de conciencia.', 'Media', '2025-05-20 02:15:27');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (19, 4, 'Realizar seguimiento con controles radiológicos periódicos para evaluar la evolución de la fractura.', 'Media', '2025-05-20 02:15:27');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (20, 5, 'Descongestionantes orales o nasales para reducir la inflamación y facilitar el drenaje del seno.', 'Media', '2025-05-21 04:15:25');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (21, 5, 'Irrigación nasal con solución salina para limpiar los senos y aliviar la congestión.', 'Media', '2025-05-21 04:15:25');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (22, 5, 'Analgésicos de venta libre (ibuprofeno o paracetamol) para controlar el dolor y la inflamación.', 'Media', '2025-05-21 04:15:26');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (23, 5, 'Considerar el uso de antibióticos si los síntomas persisten o empeoran, bajo supervisión médica.', 'Media', '2025-05-21 04:15:26');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (24, 5, 'Evitar factores irritantes como el humo del tabaco y alérgenos conocidos.', 'Media', '2025-05-21 04:15:27');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (25, 5, 'Mantener una buena hidratación para ayudar a fluidificar las secreciones.', 'Media', '2025-05-21 04:15:27');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (26, 6, 'Se recomienda manejo del dolor con analgésicos según sea necesario. Considerar AINEs o paracetamol.', 'Media', '2025-05-22 00:25:28');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (27, 6, 'Fisioterapia con ejercicios de fortalecimiento muscular suaves para promover la estabilidad de la rodilla.', 'Media', '2025-05-22 00:25:28');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (28, 6, 'Considerar modificación de actividades para minimizar la carga en la rodilla afectada.', 'Media', '2025-05-22 00:25:28');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (29, 6, 'Evaluación adicional con estudios de imagen avanzados, como gammagrafía ósea o aspiración articular, para descartar infección.', 'Media', '2025-05-22 00:25:28');
INSERT INTO recomendaciones (id_recomendacion, id_diagnostico, descripcion, prioridad, fecha_creacion) VALUES (30, 6, 'Consulta con cirujano ortopédico especialista en reemplazo articular para evaluar la necesidad de revisión de la prótesis, según la progresión de los síntomas y hallazgos adicionales.', 'Media', '2025-05-22 00:25:28');

CREATE TABLE `roles` (
  `id_rol` INTEGER NOT NULL,
  `nombre` TEXT NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `estado` INTEGER DEFAULT 1,
  PRIMARY KEY (`id_rol`),
  UNIQUE (`nombre`)
);

INSERT INTO roles (id_rol, nombre, descripcion, estado) VALUES (1, 'admin', 'Administrador del sistema', 1);
INSERT INTO roles (id_rol, nombre, descripcion, estado) VALUES (2, 'medico', 'Médico que realiza diagnósticos', 1);
INSERT INTO roles (id_rol, nombre, descripcion, estado) VALUES (3, 'paciente', 'Paciente que recibe diagnósticos', 1);

CREATE TABLE `seguimientorecomendaciones` (
  `id_seguimiento` INTEGER NOT NULL,
  `id_recomendacion` INTEGER NOT NULL,
  `estado` TEXT DEFAULT 'Pendiente' CHECK (`estado` IN ('Pendiente', 'En Progreso', 'Completada', 'Cancelada')),
  `notas` TEXT DEFAULT NULL,
  `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_seguimiento`),
  FOREIGN KEY (`id_recomendacion`) REFERENCES `recomendaciones` (`id_recomendacion`)
);

INSERT INTO seguimientorecomendaciones (id_seguimiento, id_recomendacion, estado, notas, fecha_actualizacion) VALUES (1, 1, 'Pendiente', 'Seguimiento inicial generado automáticamente.', '2025-05-08 19:46:26');
INSERT INTO seguimientorecomendaciones (id_seguimiento, id_recomendacion, estado, notas, fecha_actualizacion) VALUES (2, 2, 'Pendiente', 'Seguimiento inicial generado automáticamente.', '2025-05-08 19:46:27');
INSERT INTO seguimientorecomendaciones (id_seguimiento, id_recomendacion, estado, notas, fecha_actualizacion) VALUES (3, 3, 'Pendiente', 'Seguimiento inicial generado automáticamente.', '2025-05-08 19:46:27');
INSERT INTO seguimientorecomendaciones (id_seguimiento, id_recomendacion, estado, notas, fecha_actualizacion) VALUES (4, 4, 'Pendiente', 'Seguimiento inicial generado automáticamente.', '2025-05-08 19:46:27');

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


CREATE TABLE `tiposdocumento` (
  `id_tipo_documento` INTEGER NOT NULL,
  `codigo` TEXT NOT NULL,
  `descripcion` TEXT NOT NULL,
  `estado` INTEGER DEFAULT 1,
  PRIMARY KEY (`id_tipo_documento`),
  UNIQUE (`codigo`)
);

INSERT INTO tiposdocumento (id_tipo_documento, codigo, descripcion, estado) VALUES (1, 'CC', 'Cédula de Ciudadanía', 1);
INSERT INTO tiposdocumento (id_tipo_documento, codigo, descripcion, estado) VALUES (2, 'CE', 'Cédula de Extranjería', 1);
INSERT INTO tiposdocumento (id_tipo_documento, codigo, descripcion, estado) VALUES (3, 'PS', 'Pasaporte', 1);

CREATE TABLE `tiposexamen` (
  `id_tipo_examen` INTEGER NOT NULL,
  `nombre` TEXT NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `estado` INTEGER DEFAULT 1,
  PRIMARY KEY (`id_tipo_examen`)
);

INSERT INTO tiposexamen (id_tipo_examen, nombre, descripcion, estado) VALUES (1, 'Radiografía', 'Imagen por rayos X', 1);
INSERT INTO tiposexamen (id_tipo_examen, nombre, descripcion, estado) VALUES (2, 'Resonancia Magnética', 'Imagen por resonancia magnética nuclear', 1);
INSERT INTO tiposexamen (id_tipo_examen, nombre, descripcion, estado) VALUES (3, 'Tomografía', 'Tomografía computarizada', 1);
INSERT INTO tiposexamen (id_tipo_examen, nombre, descripcion, estado) VALUES (4, 'Otro', 'Otros tipos de exámenes no categorizados', 'Activo');

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

INSERT INTO tiposnotificacion (id_tipo_notificacion, nombre, plantilla, icono, color, estado, fecha_creacion) VALUES (1, 'DiagnosticoCompletado', 'El diagnóstico para {paciente} ha sido completado. Haga clic para ver los resultados.', 'check-circle', '#059669', 1, '2025-04-29 19:30:57');
INSERT INTO tiposnotificacion (id_tipo_notificacion, nombre, plantilla, icono, color, estado, fecha_creacion) VALUES (2, 'ResultadosDisponibles', 'Los resultados del análisis de {paciente} están disponibles para revisión.', 'clipboard-list', '#2563eb', 1, '2025-04-29 19:30:57');
INSERT INTO tiposnotificacion (id_tipo_notificacion, nombre, plantilla, icono, color, estado, fecha_creacion) VALUES (3, 'RecordatorioCita', 'Recordatorio: Tiene una cita programada con {paciente} para {fecha}.', 'calendar', '#d97706', 1, '2025-04-29 19:30:57');
INSERT INTO tiposnotificacion (id_tipo_notificacion, nombre, plantilla, icono, color, estado, fecha_creacion) VALUES (4, 'ActualizacionSistema', 'Se ha realizado una actualización importante en el sistema: {mensaje}', 'info-circle', '#6366f1', 1, '2025-04-29 19:30:57');

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
  `estado` TEXT DEFAULT 'Activo' CHECK (`estado` IN ('Activo', 'Inactivo', 'Bloqueado')), ultima_ip_login TEXT, ultima_ubicacion_login TEXT,
  PRIMARY KEY (`id_usuario`),
  UNIQUE (`correo`),
  FOREIGN KEY (`id_tipo_documento`) REFERENCES `tiposdocumento` (`id_tipo_documento`),
  FOREIGN KEY (`id_pais`) REFERENCES `paises` (`id_pais`)
);

INSERT INTO usuarios (id_usuario, id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, fecha_registro, ultima_actividad, estado, ultima_ip_login, ultima_ubicacion_login) VALUES (1, 1, 1, '123456', 'Juan', NULL, 'Rodriguez', NULL, 'maria.rodriguez@sofiamedical.com', 'b7r3RDUaW3XTFCLwKT8odLPz3KB2', '2025-04-29 14:35:44', '2025-05-24 15:34:54', 'Activo', '::1', 'UNKNOWN_LOCATION');
INSERT INTO usuarios (id_usuario, id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, fecha_registro, ultima_actividad, estado, ultima_ip_login, ultima_ubicacion_login) VALUES (3, 1, 1, '1353545', 'Sofia', NULL, 'Andrei', NULL, 'sofiahermochita133@gmail.com', NULL, '2025-05-07 19:11:33', NULL, 'Activo', NULL, NULL);
INSERT INTO usuarios (id_usuario, id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, fecha_registro, ultima_actividad, estado, ultima_ip_login, ultima_ubicacion_login) VALUES (4, 1, 1, '4542524', 'Juan', NULL, 'Andrei', NULL, 'juan.yurle@gmail.com', NULL, '2025-05-07 19:26:59', NULL, 'Activo', NULL, NULL);
INSERT INTO usuarios (id_usuario, id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, fecha_registro, ultima_actividad, estado, ultima_ip_login, ultima_ubicacion_login) VALUES (5, 1, 1, '43413413', 'Juan', NULL, 'Mikailo', NULL, 'juan.mikalo@gmail.com', NULL, '2025-05-07 19:31:46', NULL, 'Activo', NULL, NULL);
INSERT INTO usuarios (id_usuario, id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, fecha_registro, ultima_actividad, estado, ultima_ip_login, ultima_ubicacion_login) VALUES (6, 1, 1, '431424', 'Sofia', 'Karolina', 'Hernandez', 'Hernandez', 'sofia.karolinah@sofiamedical.com', 'asCXkbQ24STpBgbfWKR8jBFXUAt1', '2025-05-12 05:33:41', NULL, 'Activo', NULL, NULL);
INSERT INTO usuarios (id_usuario, id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, fecha_registro, ultima_actividad, estado, ultima_ip_login, ultima_ubicacion_login) VALUES (7, 1, 1, '1433542', 'Miguel', 'Gerardo', 'Gutierrez', 'Pomino', 'miguel.palomino@sofiamedical.com', 't65t41BdzLQC5Ahuq2q8mKRQaLe2', '2025-05-14 19:49:45', NULL, 'Activo', NULL, NULL);
INSERT INTO usuarios (id_usuario, id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, fecha_registro, ultima_actividad, estado, ultima_ip_login, ultima_ubicacion_login) VALUES (8, 1, 1, '1034397986', 'juan', 'sebastian', 'blanco', 'Barbosa', 'sebastianblanco760@gmail.com', 'cXFLImoyNWO2uykVNbQPi5BuTe82', '2025-05-14 23:40:22', NULL, 'Activo', NULL, NULL);
INSERT INTO usuarios (id_usuario, id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, fecha_registro, ultima_actividad, estado, ultima_ip_login, ultima_ubicacion_login) VALUES (9, 1, 1, '154542524', 'Juan', 'KIKI', 'Mikailo', 'KIKI', 'jua.jose@sofiamedical.com', 'h02Lv4xPpyai11dgyXbB7MytCHC3', '2025-05-21 23:52:04', NULL, 'Activo', NULL, NULL);
INSERT INTO usuarios (id_usuario, id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, fecha_registro, ultima_actividad, estado, ultima_ip_login, ultima_ubicacion_login) VALUES (10, 1, 1, '46807653', 'juan', NULL, 'torres', NULL, 'juant@gmail.com', NULL, '2025-05-22 00:03:47', NULL, 'Activo', NULL, NULL);
INSERT INTO usuarios (id_usuario, id_tipo_documento, id_pais, nui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, firebase_uid, fecha_registro, ultima_actividad, estado, ultima_ip_login, ultima_ubicacion_login) VALUES (11, 1, 1, '12345678', 'gloria', NULL, 'gutierrez', NULL, 'gloria@gmail.com', NULL, '2025-05-22 18:15:37', NULL, 'Activo', NULL, NULL);

CREATE TABLE `usuariosroles` (
  `id_usuario` INTEGER NOT NULL,
  `id_rol` INTEGER NOT NULL,
  `fecha_asignacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `estado` INTEGER DEFAULT 1,
  PRIMARY KEY (`id_usuario`, `id_rol`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`)
);

INSERT INTO usuariosroles (id_usuario, id_rol, fecha_asignacion, estado) VALUES (1, 2, '2025-04-29 14:35:44', 1);
INSERT INTO usuariosroles (id_usuario, id_rol, fecha_asignacion, estado) VALUES (3, 3, '2025-05-07 19:11:34', 1);
INSERT INTO usuariosroles (id_usuario, id_rol, fecha_asignacion, estado) VALUES (4, 3, '2025-05-07 19:27:00', 1);
INSERT INTO usuariosroles (id_usuario, id_rol, fecha_asignacion, estado) VALUES (5, 3, '2025-05-07 19:31:46', 1);
INSERT INTO usuariosroles (id_usuario, id_rol, fecha_asignacion, estado) VALUES (6, 2, '2025-05-12 05:33:41', 1);
INSERT INTO usuariosroles (id_usuario, id_rol, fecha_asignacion, estado) VALUES (7, 2, '2025-05-14 15:00:00', 1);
INSERT INTO usuariosroles (id_usuario, id_rol, fecha_asignacion, estado) VALUES (11, 3, '2025-05-22 18:15:37', 1);

CREATE TABLE usuarios_mfa_config (
    id_usuario INTEGER NOT NULL PRIMARY KEY, -- Clave primaria y foránea que referencia a usuarios
    mfa_secret TEXT NOT NULL,                -- El secreto TOTP (debe almacenarse CIFRADO)
    mfa_enabled INTEGER NOT NULL DEFAULT 0,  -- 0 para false (configuración pendiente o deshabilitado), 1 para true (habilitado y verificado)
    mfa_verified_at DATETIME DEFAULT NULL,   -- Fecha y hora de cuándo se verificó y habilitó el MFA
    -- Puedes añadir más campos aquí si es necesario, como la fecha de creación del secreto.
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE -- Si se elimina un usuario, se elimina su config MFA
);

INSERT INTO usuarios_mfa_config (id_usuario, mfa_secret, mfa_enabled, mfa_verified_at) VALUES (1, '{"iv":"42b01132adfada4fa4fb9d9f8fb621d6","encryptedData":"0edf2c76e8f34ca5f324064b305c59611a48338a989904916c587d4e1599b8c3"}', 1, '2025-05-12 04:34:51');
INSERT INTO usuarios_mfa_config (id_usuario, mfa_secret, mfa_enabled, mfa_verified_at) VALUES (7, '{"iv":"f102385a64214ba25ba0a77c0d7a52c3","encryptedData":"6b1a46b709933fe6feb09adb2a74ad2dcc1b38ca114b63cea72fed7c8a9649aa"}', 1, '2025-05-14 20:24:01');
INSERT INTO usuarios_mfa_config (id_usuario, mfa_secret, mfa_enabled, mfa_verified_at) VALUES (9, '{"iv":"d6dc340c22994ca7ffcd330fb832dcc2","encryptedData":"820130569ac7bfc6a07f7ac2c6ccae0f8bb538b8e0645094809bf6bc85c4f825"}', 1, '2025-05-21 23:56:40');

CREATE TABLE mfa_recovery_codes (
    id_recovery_code INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL,
    code_hash TEXT NOT NULL, -- Almacena el HASH del código de recuperación, no el código en texto plano
    is_used INTEGER NOT NULL DEFAULT 0, -- 0 para no usado, 1 para usado
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME DEFAULT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE
);


