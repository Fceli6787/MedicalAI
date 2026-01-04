# SOF-IA: Dashboard Médico Inteligente
<div align="center">

![Logo SOF-IA](https://github.com/user-attachments/assets/47933f0a-6f45-475b-b312-8372fa85eb08)

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)
[![SQLite Cloud](https://img.shields.io/badge/SQLite%20Cloud-Database-003b57?logo=sqlite)](https://sqlitecloud.io/)
[![OpenRouter AI](https://img.shields.io/badge/Qwen%202.5%20VL%2072B-AI%20Model-ff6b6b)](https://openrouter.ai/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**Asistente de IA especializado en diagnósticos médicos, análisis radiológico e interpretación de imágenes diagnósticas**

[Características](#características) • [Instalación](#instalación) • [Estructura](#estructura) • [API](#api) • [Contribuir](#contribuir)

</div>

---

## 📋 Tabla de Contenidos

- [Sobre el Proyecto](#sobre-el-proyecto)
- [Características Principales](#características)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Estructura del Proyecto](#estructura)
- [Configuración](#configuración)
- [API Endpoints](#api)
- [Módulos Clave](#módulos-clave)
- [Funcionalidades Médicas](#funcionalidades-médicas)
- [Seguridad](#seguridad)
- [Troubleshooting](#troubleshooting)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## 💡 Sobre el Proyecto

**SOF-IA** es un **dashboard médico inteligente** que integra inteligencia artificial avanzada para asistir a profesionales de la salud en:

- 🏥 **Diagnósticos asistidos**: Análisis de radiografías y estudios de imagen
- 🔍 **Interpretación de imágenes**: Procesamiento de DICOM, radiografías y documentos médicos
- 📊 **Gestión de pacientes**: Sistema completo de historiales clínicos
- 🛡️ **Autenticación médica**: MFA seguro y roles de usuario especializados
- ⚡ **Análisis en tiempo real**: Respuestas instantáneas del modelo IA Qwen 2.5 VL 72B

---

## ✨ Características

### 🧠 Inteligencia Artificial Médica
- **Modelo Qwen 2.5 VL 72B Instruct** entrenado específicamente para medicina y salud
- **Razonamiento avanzado** para análisis diagnóstico complejo
- **Procesamiento multimodal**: Texto, imágenes, PDF, videos
- **Conocimiento médico actualizado** hasta 2025

### 🩺 Gestión Médica Completa
- Gestión de pacientes con historiales completos
- Registro de diagnósticos con IA asistida
- Clasificación de tipos de examen
- Almacenamiento seguro de imágenes diagnósticas (DICOM)
- Generación automática de reportes en PDF

### 🔐 Seguridad Avanzada
- Autenticación con NextAuth.js + Firebase
- Autenticación de múltiples factores (MFA) con TOTP
- Validación con Cloudflare Turnstile
- Control de roles (Médicos, Pacientes, Administradores)
- Encriptación de datos sensibles

### 📱 Interfaz Profesional
- Dashboard intuitivo y responsivo
- Componentes UI modernos (Shadcn/ui)
- Tema oscuro/claro
- Tour de onboarding interactivo
- Notificaciones en tiempo real (Sonner)

### 📧 Comunicación
- Envío de correos transaccionales
- Notificaciones de MFA
- Retroalimentación de usuarios
- Integración SMTP Gmail

---

## 🛠️ Tecnologías

| Categoría | Tecnología | Descripción |
|-----------|-----------|-------------|
| **Frontend** | React 19.2, Next.js 16 | Framework moderno con SSR y API integrada |
| **Lenguaje** | TypeScript 5.8 | Tipado estático y desarrollo seguro |
| **Estilos** | Tailwind CSS 3.4, Shadcn/ui | Diseño moderno y componentes reutilizables |
| **Base de Datos** | SQLite Cloud | Base de datos en nube con alto rendimiento |
| **IA** | OpenRouter (Qwen 2.5 VL 72B) | Modelo especializado en medicina |
| **Autenticación** | NextAuth.js 4.24, Firebase | Autenticación segura y flexible |
| **MFA** | TOTP (otplib) | Autenticación de dos factores |
| **Seguridad** | Cloudflare Turnstile | Verificación anti-bots |
| **Almacenamiento** | Firebase Storage | Imágenes diagnósticas seguras |
| **Procesamiento de Imágenes** | DICOM Parser, Cornerstone | Visualización de imágenes médicas |
| **PDF** | jsPDF, html2canvas | Generación de reportes |
| **Email** | Nodemailer | Envío de correos transaccionales |
| **Gráficos** | Recharts | Visualización de datos médicos |

---

## 📦 Requisitos Previos

Antes de instalar, asegúrate de tener:

- **Node.js** 18+ ([descargar](https://nodejs.org/))
- **pnpm** 10.10.0+ ([instalar](https://pnpm.io/installation))
  ```bash
  npm install -g pnpm@10.10.0
  ```
- **Git** para clonar el repositorio
- Cuentas en:
  - [SQLite Cloud](https://sqlitecloud.io/) (Base de datos)
  - [OpenRouter.ai](https://openrouter.ai/) (API IA)
  - [Firebase Console](https://firebase.google.com/) (Autenticación)
  - [Cloudflare](https://www.cloudflare.com/) (Turnstile)
  - Gmail (SMTP para correos)

---

## 🚀 Instalación

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Fceli6787/MedicalAI.git
cd MedicalAI/sofia-medical-dashboard
```

### 2. Instalar Dependencias
```bash
pnpm install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto (copia de `.env.example`):

```env
# === NEXT.JS & SITE ===
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# === FIREBASE (Autenticación) ===
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

# === SQLITE CLOUD (Base de Datos) ===
NEXT_PUBLIC_SQLITECLOUD_URL=tu_sqlite_cloud_url
SQLITECLOUD_URL=tu_sqlite_cloud_url

# === OPENROUTER.AI (IA Médica) ===
NEXT_PUBLIC_OPENROUTER_API_KEY=tu_openrouter_api_key

# === CLOUDFLARE TURNSTILE (Anti-bot) ===
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=tu_site_key
CLOUDFLARE_TURNSTILE_SECRET_KEY=tu_secret_key

# === CORREO (Gmail SMTP) ===
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password
EMAIL_FROM="Sofia Medical <tu_email@gmail.com>"
```

### 4. Configurar Base de Datos
1. Crea una cuenta en [SQLite Cloud](https://sqlitecloud.io/)
2. Importa el archivo `sofia-medical.sql` en tu instancia
3. Actualiza `SQLITECLOUD_URL` en `.env.local`

### 5. Ejecutar el Servidor de Desarrollo
```bash
pnpm run dev
```

El dashboard estará disponible en: **http://localhost:3000**

---

## 📁 Estructura del Proyecto

```
sofia-medical-dashboard/
├── app/                          # Rutas y páginas de Next.js (App Router)
│   ├── api/                      # Endpoints REST API
│   │   ├── auth/                 # Autenticación (login, register)
│   │   ├── dashboard/            # Pacientes, diagnósticos, usuarios
│   │   ├── diagnosticos/         # Análisis y gestión de diagnósticos
│   │   ├── mfa/                  # Autenticación de múltiples factores
│   │   ├── pacientes/            # Registro y gestión de pacientes
│   │   ├── feedback/             # Retroalimentación de usuarios
│   │   └── debug/                # Endpoints de depuración
│   ├── dashboard/                # Panel de control principal
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── pacientes/            # Gestión de pacientes
│   │   ├── nuevo-diagnostico/    # Crear nuevo diagnóstico
│   │   ├── historial/            # Historiales médicos
│   │   └── configuracion/        # Configuración del usuario
│   ├── auth.ts                   # Configuración NextAuth
│   ├── layout.tsx                # Layout global
│   ├── page.tsx                  # Página de inicio
│   ├── login/                    # Página de login
│   └── register/                 # Página de registro
│
├── components/                   # Componentes React reutilizables
│   ├── ui/                       # Componentes Shadcn/ui (36 componentes)
│   ├── layout/                   # Componentes de layout (sidebar)
│   ├── bulk-upload-dialog.tsx    # Carga masiva de imágenes
│   ├── feedback-modal.tsx        # Modal de retroalimentación
│   ├── onboarding-tour-dialog.tsx # Tour guiado para nuevos usuarios
│   └── theme-provider.tsx        # Proveedor de temas
│
├── context/                      # Contextos React
│   └── AuthContext.tsx           # Contexto global de autenticación
│
├── hooks/                        # Hooks personalizados
│   ├── use-mobile.tsx            # Hook para detectar dispositivos móviles
│   ├── use-onboarding-tour.ts    # Hook para control del tour
│   └── use-toast.ts              # Hook para notificaciones
│
├── lib/                          # Lógica de negocio y utilidades
│   ├── db.ts                     # Conexión a SQLite Cloud
│   ├── firebase.ts               # Configuración de Firebase
│   ├── openrouter.ts             # Integración con API de IA
│   ├── generate-pdf.ts           # Generación de reportes PDF
│   ├── emailConfig.ts            # Configuración de correos
│   ├── types.ts                  # Tipos TypeScript globales
│   ├── utils.ts                  # Funciones utilitarias
│   │
│   ├── repositories/             # Acceso a datos (Patrón Repository)
│   │   ├── userRepository.ts     # Operaciones de usuarios
│   │   ├── pacienteRepository.ts # Gestión de pacientes
│   │   ├── diagnosticoRepository.ts # Gestión de diagnósticos
│   │   ├── medicoRepository.ts   # Información de médicos
│   │   ├── mfaRepository.ts      # Autenticación de dos factores
│   │   ├── rolRepository.ts      # Control de roles
│   │   ├── tipoExamenRepository.ts # Tipos de examen
│   │   └── metadataRepository.ts # Metadatos generales
│   │
│   ├── services/                 # Lógica de negocio (Services)
│   │   ├── emailService.ts       # Envío de correos
│   │   ├── imageStorageService.ts # Almacenamiento de imágenes
│   │   └── interfaces/           # Contratos de servicios
│   │
│   ├── constants/                # Constantes de la aplicación
│   │   └── queries.ts            # Queries SQL predefinidas
│   │
│   └── utils/                    # Utilidades específicas
│       └── mfa.ts                # Funciones de MFA y TOTP
│
├── src/                          # Código fuente adicional
│   └── lib/
│       └── dicomService.ts       # Servicio de procesamiento DICOM
│
├── public/                       # Archivos estáticos
├── styles/                       # Estilos CSS globales
├── private_uploads/              # Almacenamiento local de imágenes
│   └── diagnostic_images/        # Imágenes diagnósticas
│
├── auth.config.ts                # Configuración de autenticación
├── next.config.mjs               # Configuración de Next.js
├── tailwind.config.ts            # Configuración de Tailwind CSS
├── tsconfig.json                 # Configuración de TypeScript
├── postcss.config.mjs            # Configuración de PostCSS
├── components.json               # Configuración de Shadcn/ui
├── sofia-medical.sql             # Script de base de datos
└── package.json                  # Dependencias y scripts
```

---

## ⚙️ Configuración Detallada

### Variables de Entorno Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | URL de la aplicación | `http://localhost:3000` |
| `NEXT_PUBLIC_FIREBASE_*` | Credenciales Firebase | (Obtenidas de Firebase Console) |
| `NEXT_PUBLIC_SQLITECLOUD_URL` | URL de SQLite Cloud | `sqlitecloud://key@host:port/db` |
| `SQLITECLOUD_URL` | URL privada de SQLite Cloud | (Igual que la anterior) |
| `NEXT_PUBLIC_OPENROUTER_API_KEY` | Clave API de OpenRouter | (Obtenida de openrouter.ai) |
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | Clave pública Turnstile | (De Cloudflare Dashboard) |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Clave secreta Turnstile | (De Cloudflare Dashboard) |
| `EMAIL_*` | Configuración SMTP Gmail | (Tu cuenta Gmail + app password) |

### Obtener Credenciales

**Firebase:**
1. Ve a [Firebase Console](https://firebase.google.com/)
2. Crea un proyecto
3. Ve a Configuración → Proyecto → General
4. Copia las credenciales

**SQLite Cloud:**
1. Crea una cuenta en [sqlitecloud.io](https://sqlitecloud.io/)
2. Crea una base de datos
3. Copia el Connection String en `.env.local`

**OpenRouter:**
1. Registrate en [openrouter.ai](https://openrouter.ai/)
2. Ve a Keys en el dashboard
3. Genera una nueva clave API

**Cloudflare Turnstile:**
1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Seguridad → Bot Management
3. Crea una aplicación Turnstile

**Gmail SMTP:**
1. Habilita "Aplicaciones menos seguras" en tu cuenta Gmail
2. Genera una [contraseña de aplicación](https://myaccount.google.com/apppasswords)
3. Usa esa contraseña como `EMAIL_PASS`

---

## 🔌 API Endpoints

### Autenticación (`/api/auth/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Inicio de sesión de usuarios |
| `POST` | `/api/auth/register` | Registro de nuevos usuarios |
| `POST` | `/api/auth/logout` | Cierre de sesión |

### Pacientes (`/api/dashboard/pacientes/` y `/api/pacientes/`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------|
| `GET` | `/api/dashboard/pacientes` | Listar todos los pacientes | Requerida |
| `GET` | `/api/dashboard/pacientes/[id_usuario]` | Obtener paciente por ID | Requerida |
| `POST` | `/api/dashboard/pacientes` | Crear nuevo paciente | Requerida |
| `PUT` | `/api/dashboard/pacientes/[id_usuario]` | Actualizar paciente | Requerida |
| `DELETE` | `/api/dashboard/pacientes/[id_usuario]` | Eliminar paciente | Requerida |
| `POST` | `/api/pacientes/register` | Registro de paciente (público) | Opcional |

### Diagnósticos (`/api/dashboard/diagnosticos/` y `/api/diagnosticos/`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------|
| `GET` | `/api/dashboard/diagnosticos` | Listar diagnósticos | Requerida |
| `POST` | `/api/dashboard/diagnosticos/add` | Crear nuevo diagnóstico | Requerida |
| `GET` | `/api/diagnosticos/[id_diagnostico]` | Obtener diagnóstico por ID | Requerida |
| `PUT` | `/api/dashboard/diagnosticos/[id_diagnostico]` | Actualizar diagnóstico | Requerida |
| `DELETE` | `/api/dashboard/diagnosticos/[id_diagnostico]` | Eliminar diagnóstico | Requerida |

### MFA (`/api/mfa/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/mfa/setup` | Configurar MFA (genera QR) |
| `POST` | `/api/mfa/verify` | Verificar código TOTP |
| `POST` | `/api/mfa/disable` | Deshabilitar MFA |

### Usuarios (`/api/dashboard/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/dashboard/users` | Listar usuarios |
| `GET` | `/api/dashboard/medicos` | Listar médicos |

### Otros

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/feedback` | Enviar retroalimentación |
| `GET` | `/api/debug` | Endpoints de depuración |

---

## 🔑 Módulos Clave

### 🗄️ Repositories (Acceso a Datos)

**UserRepository**
```typescript
// Operaciones CRUD de usuarios
- createUser(userData)
- getUserById(id)
- updateUser(id, userData)
- deleteUser(id)
```

**PacienteRepository**
```typescript
// Gestión de pacientes
- getAllPacientes()
- getPacienteById(id)
- createPaciente(data)
- updatePaciente(id, data)
```

**DiagnosticoRepository**
```typescript
// Gestión de diagnósticos asistidos por IA
- getDiagnosticos()
- getDiagnosticoById(id)
- addDiagnosticoCompleto(data)
- updateDiagnostico(id, data)
```

**MfaRepository**
```typescript
// Autenticación de dos factores
- setupMFA(userId)
- verifyMFA(userId, code)
- disableMFA(userId)
```

### 📧 Services (Lógica de Negocio)

**EmailService**
- Envío de correos de confirmación
- Notificaciones de MFA
- Alertas para médicos
- Plantillas HTML personalizadas

**ImageStorageService**
- Almacenamiento de imágenes DICOM
- Validación de formatos
- Gestión de permisos

### 🧠 Integración IA (OpenRouter)

**openrouter.ts**
```typescript
// Análisis diagnóstico asistido
- analyzeImage(image): DiagnosisAIResult
- getAIMedicalInsights(symptoms): Insights
- generateDiagnosticReport(data): Report
```

---

## 🏥 Funcionalidades Médicas

### 📊 Gestión de Pacientes
- Registro completo de pacientes
- Historiales clínicos por paciente
- Almacenamiento de datos HIPAA-compliant
- Importación masiva de datos (CSV/Excel)

### 🔬 Análisis Diagnóstico
- Análisis asistido por IA del modelo Qwen 2.5 VL 72B
- Procesamiento de múltiples tipos de imágenes
- Validación automática de diagnósticos
- Historial de diagnósticos por paciente

### 🖼️ Procesamiento de Imágenes Médicas
- Soporte para DICOM (.dcm)
- Visualización de radiografías
- Procesamiento con Cornerstone.js
- Almacenamiento seguro en Firebase

### 📄 Generación de Reportes
- Reportes PDF automáticos
- Exportación de historiales
- Impresión formateada
- Firmas digitales (opcional)

### 👨‍⚕️ Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **Administrador** | Control total, gestión de usuarios, auditoría |
| **Médico** | Crear diagnósticos, ver pacientes, generar reportes |
| **Paciente** | Ver su historia, descargar reportes |

---

## 🔐 Seguridad

### Autenticación
- ✅ **NextAuth.js**: Manejo seguro de sesiones
- ✅ **Firebase**: Autenticación con múltiples proveedores
- ✅ **TOTP/MFA**: Autenticación de dos factores con otplib

### Validación
- ✅ **Zod**: Validación de tipos en frontend y backend
- ✅ **Cloudflare Turnstile**: Protección anti-bots
- ✅ **Rate limiting**: Límite de intentos de login

### Almacenamiento
- ✅ **Firebase Storage**: Almacenamiento encriptado
- ✅ **SQLite Cloud**: Base de datos segura en la nube
- ✅ **Variables de entorno**: Credenciales ocultas

### Datos Médicos
- ✅ **HIPAA-compliant**: Cumple con regulaciones de privacidad
- ✅ **Encriptación**: Datos sensibles encriptados
- ✅ **Auditoría**: Registro de accesos

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL is not set"
```bash
✅ Solución: Verifica que .env.local contenga SQLITECLOUD_URL
```

### Error: "OpenRouter API key invalid"
```bash
✅ Solución: Genera una nueva clave en openrouter.ai
✅ Verifica que sea mayor a $0 de crédito disponible
```

### Error: "DICOM file not supported"
```bash
✅ Solución: Verifica que sea un archivo DICOM válido (.dcm)
✅ Tamaño máximo recomendado: 50MB
```

### Error: "MFA code invalid"
```bash
✅ Solución: Verifica que el reloj del servidor esté sincronizado
✅ Código TOTP válido por solo 30 segundos
✅ No compartas el código QR con otros usuarios
```

### El dashboard carga muy lentamente
```bash
✅ Solución: Ejecuta pnpm run build
✅ Verifica la velocidad de tu conexión SQLite Cloud
✅ Valida que NEXT_PUBLIC_SITE_URL sea correcto
```

### Error al enviar correos
```bash
✅ Solución: Habilita "Aplicaciones menos seguras" en Gmail
✅ Usa una contraseña de aplicación (no la contraseña normal)
✅ Verifica que EMAIL_HOST, EMAIL_USER, EMAIL_PASS sean correctos
```

---

## 🚀 Scripts Disponibles

```bash
# Desarrollo con Turbopack
pnpm run dev

# Compilar para producción
pnpm run build

# Ejecutar en producción
pnpm run start

# Linting y validación de código
pnpm run lint
```

---

## 📱 Comandos Útiles

```bash
# Actualizar dependencias
pnpm update

# Instalar una nueva dependencia
pnpm add nombre-paquete

# Instalar dependencia de desarrollo
pnpm add -D nombre-paquete

# Ver tree de dependencias
pnpm ls

# Limpiar cache
pnpm store prune
```

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. **Fork** el repositorio
2. **Crea una rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abre un Pull Request**

### Líneas de Código
- Frontend: ~3,500+ líneas
- Backend/API: ~2,000+ líneas
- Componentes UI: ~4,000+ líneas
- Total del proyecto: ~10,000+ líneas

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Ver archivo [LICENSE](LICENSE) para más detalles.

---

## 📧 Soporte y Contacto

- **Reportar bugs**: [GitHub Issues](https://github.com/Fceli6787/MedicalAI/issues)
- **Sugerencias**: [GitHub Discussions](https://github.com/Fceli6787/MedicalAI/discussions)
- **Email**: contact@sofiamedical.com

---

## 🙏 Agradecimientos

- [Qwen2.5 VL 72B](https://openrouter.ai/) - Modelo de IA especializado
- [Next.js](https://nextjs.org/) - Framework moderno
- [Shadcn/ui](https://ui.shadcn.com/) - Componentes hermosos
- [SQLite Cloud](https://sqlitecloud.io/) - Base de datos en la nube
- Comunidad open-source de medicina digital

---

<div align="center">

### Hecho con ❤️ para profesionales de la salud

**[⬆ Volver arriba](#sofía-dashboard-médico-inteligente)**

</div>

## 👥 Integrante del Proyecto

*   **Desarrollador Full-Stack:** Andres Felipe Celi Jimenez

