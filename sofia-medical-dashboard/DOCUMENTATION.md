# Documentación del Proyecto: Sofia Medical Dashboard

Este documento sirve como guía para entender la implementación y estructura del proyecto Sofia Medical Dashboard.

## 1. Introducción

Sofia Medical Dashboard es una aplicación web diseñada para [Describe brevemente el propósito y funcionalidad principal del proyecto].

## 2. Estructura del Proyecto

El proyecto sigue una estructura de directorios organizada para separar las diferentes partes de la aplicación (frontend, backend, base de datos, etc.).

```
.
├── app/                  # Rutas y páginas de Next.js
│   ├── api/              # Endpoints de la API
│   │   ├── auth/         # Autenticación (login, register)
│   │   ├── dashboard/    # Endpoints relacionados con el dashboard (pacientes, usuarios, diagnósticos)
│   │   ├── mfa/          # Autenticación de Múltiples Factores
│   │   └── ...
│   ├── dashboard/        # Páginas del dashboard
│   ├── login/            # Página de login
│   ├── register/         # Página de registro
│   └── ...
├── components/           # Componentes reutilizables de React
│   ├── layout/           # Componentes de layout (sidebar, etc.)
│   └── ui/               # Componentes de UI (shadcn/ui u otros)
├── context/              # Contextos de React (AuthContext, etc.)
├── hooks/                # Hooks personalizados
├── lib/                  # Funciones de utilidad, configuración, conexión a DB, servicios externos
│   ├── constants/        # Constantes (queries SQL, etc.)
│   └── ...
├── public/               # Archivos estáticos
├── src/                  # Código fuente adicional (servicios, etc.)
│   └── lib/
├── styles/               # Archivos de estilos globales
├── .env.local            # Variables de entorno local
├── .gitignore            # Archivos y directorios a ignorar por Git
├── auth.config.ts        # Configuración de autenticación (NextAuth.js u otro)
├── database.sql          # Script de la base de datos
├── next.config.mjs       # Configuración de Next.js
├── package.json          # Dependencias del proyecto
├── pnpm-lock.yaml        # Archivo lock de pnpm
├── pnpm-workspace.yaml   # Configuración del workspace de pnpm
├── postcss.config.mjs    # Configuración de PostCSS
├── tailwind.config.ts    # Configuración de Tailwind CSS
├── tsconfig.json         # Configuración de TypeScript
└── ...                   # Otros archivos de configuración
```

## 3. Tecnologías Utilizadas

*   **Framework:** Next.js (React)
*   **Lenguaje:** TypeScript
*   **Estilos:** Tailwind CSS
*   **Base de Datos:** [Especificar el tipo de base de datos, ej: PostgreSQL, MySQL]
*   **ORM/Cliente DB:** [Especificar, ej: Prisma, Drizzle, node-postgres]
*   **Autenticación:** [Especificar, ej: NextAuth.js, implementación personalizada]
*   **MFA:** [Especificar la tecnología o método utilizado]
*   **Otros:** [Listar otras librerías o servicios importantes como shadcn/ui, OpenRouter, etc.]

## 4. Configuración del Entorno

Para configurar el proyecto localmente, sigue los siguientes pasos:

1.  Clona el repositorio.
2.  Instala las dependencias usando pnpm: `pnpm install`
3.  Crea un archivo `.env.local` en la raíz del proyecto y configura las variables de entorno necesarias. Consulta el archivo `.env.local.example` (si existe) o la sección de Variables de Entorno para más detalles.
4.  Configura la base de datos. Ejecuta el script `database.sql` en tu servidor de base de datos.
5.  Ejecuta las migraciones (si aplica).
6.  Inicia el servidor de desarrollo: `pnpm dev`

## 5. Base de Datos

La base de datos utilizada es [Especificar tipo de DB]. El esquema de la base de datos se define en `database.sql`.

*   **Conexión a la DB:** La lógica de conexión se encuentra en `lib/db.ts`.
*   **Queries:** Las queries SQL comunes se pueden encontrar en `lib/constants/queries.ts`.

[Detallar aquí las tablas principales y sus relaciones si es necesario]

## 6. Autenticación y Autorización

El sistema de autenticación maneja el registro, inicio de sesión y autenticación de múltiples factores (MFA).

*   **Configuración:** La configuración principal se encuentra en `auth.config.ts`.
*   **Flujo de Login:** Implementado en `app/login/page.tsx` y el endpoint `app/api/auth/login/route.ts`.
*   **Flujo de Registro:** Implementado en `app/register/page.tsx` y el endpoint `app/api/auth/register/route.ts`.
*   **MFA:** Los endpoints relacionados con MFA se encuentran en `app/api/mfa/`.
*   **Contexto de Autenticación:** `context/AuthContext.tsx` provee el estado de autenticación a través de la aplicación.

[Detallar aquí el flujo de autenticación, cómo funciona MFA, roles de usuario si existen, etc.]

## 7. API Endpoints

Los endpoints de la API se encuentran en el directorio `app/api/`. Siguen la convención de Next.js para Route Handlers.

*   **`/api/auth/...`:** Endpoints de autenticación.
*   **`/api/dashboard/pacientes/...`:** Gestión de pacientes.
    *   `GET /api/dashboard/pacientes`: Obtener lista de pacientes.
    *   `GET /api/dashboard/pacientes/[id_usuario]`: Obtener paciente por ID de usuario.
    *   [Listar otros endpoints de pacientes]
*   **`/api/dashboard/diagnosticos/...`:** Gestión de diagnósticos.
    *   `GET /api/dashboard/diagnosticos`: Obtener lista de diagnósticos.
    *   `POST /api/dashboard/diagnosticos/add`: Agregar nuevo diagnóstico.
    *   [Listar otros endpoints de diagnósticos]
*   **`/api/dashboard/users/...`:** Gestión de usuarios.
    *   `GET /api/dashboard/users`: Obtener lista de usuarios.
    *   [Listar otros endpoints de usuarios]
*   **`/api/mfa/...`:** Endpoints de MFA.
*   **`/api/pacientes/register`:** Registro de pacientes (posiblemente diferente al registro de usuarios del dashboard).
*   **`/api/diagnosticos/[id_diagnostico]`:** Obtener diagnóstico por ID.

[Detallar aquí la funcionalidad de los endpoints más importantes, parámetros esperados, respuestas, etc.]

## 8. Frontend

La interfaz de usuario está construida con React y Next.js.

*   **Páginas:** Las páginas principales se encuentran en `app/`.
    *   `app/dashboard/page.tsx`: Página principal del dashboard.
    *   `app/dashboard/pacientes/page.tsx`: Página de gestión de pacientes.
    *   `app/dashboard/nuevo-diagnostico/page.tsx`: Página para crear nuevos diagnósticos.
    *   `app/login/page.tsx`: Página de inicio de sesión.
    *   `app/register/page.tsx`: Página de registro.
    *   [Listar otras páginas importantes]
*   **Componentes UI:** Se utilizan componentes de `components/ui/` (basados en shadcn/ui) para elementos básicos de la interfaz.
*   **Componentes de Layout:** `components/layout/sidebar.tsx` define la barra lateral de navegación.
*   **Contextos:** `context/AuthContext.tsx` gestiona el estado global de autenticación.
*   **Hooks Personalizados:** `hooks/use-mobile.tsx` y `hooks/use-toast.ts` son ejemplos de hooks personalizados para lógica específica del frontend.

[Detallar aquí la estructura de las páginas principales, cómo se utilizan los componentes, manejo de estado en el frontend, etc.]

## 9. Funcionalidades Específicas

*   **Gestión de Pacientes:** Describe el flujo para ver, agregar, editar y eliminar pacientes.
*   **Gestión de Diagnósticos:** Describe cómo se crean, visualizan y gestionan los diagnósticos. Menciona la relación con las imágenes (`private_uploads/diagnostic_images/`).
*   **Autenticación de Múltiples Factores (MFA):** Explica cómo se configura y verifica el MFA.
*   **Generación de PDF:** La funcionalidad para generar PDFs se encuentra en `lib/generate-pdf.ts`. Describe qué tipo de PDFs se generan y cómo.
*   **Integración con OpenRouter:** Describe cómo se utiliza el servicio de OpenRouter (`lib/openrouter.ts`) y para qué propósito (ej: generación de texto, análisis).
*   **Servicio DICOM:** Describe la funcionalidad relacionada con archivos DICOM implementada en `src/lib/dicomService.ts`.

[Añadir secciones para otras funcionalidades importantes si las hay]

## 10. Despliegue

[Añadir notas sobre cómo desplegar la aplicación en un entorno de producción, si es relevante.]

---

**Nota:** Este documento es una guía inicial. Debe ser completado con detalles específicos de la implementación, diagramas (si son útiles), ejemplos de código y cualquier otra información relevante para entender completamente el proyecto.
