# SOF-IA: Asistente de Inteligencia Artificial Médica
![Logo SOF-IA](https://github.com/user-attachments/assets/47933f0a-6f45-475b-b312-8372fa85eb08)

Un asistente de IA diseñado para apoyar a los profesionales médicos en diagnósticos, análisis de radiografías e interpretación de imágenes diagnósticas.

## 💡 Propósito

Este proyecto busca ser un valioso apoyo para profesionales médicos, optimizando el tiempo en diagnósticos, análisis de radiografías e interpretación de imágenes. Ofrece interacción a través de:

*   **Interfaz Gráfica (Texto e Imagen):** Un dashboard intuitivo para gestionar diagnósticos asistidos por IA.

---

## 🛠️ Tecnologías Implementadas

El proyecto integra las siguientes tecnologías para un desarrollo robusto y una experiencia de usuario fluida:

### 💻 Frontend
![React logo](https://res.cloudinary.com/harendra21/image/upload/v1742472944/withcodeexample.com/building-a-react-app-with-tailwind-css_e0pv0i.jpg)
*   **React:** Framework para construir interfaces de usuario modernas, interactivas y dinámicas.
*   **CSS:** Encargado del diseño visual, asegurando una experiencia atractiva y funcional.

### ⚙️ Backend
![Next.js logo](https://github.com/user-attachments/assets/ffdf7e72-a31f-4347-8c2c-f916710146a2)
*   **Next.js:** Framework de React para renderizado del lado del servidor y generación de sitios estáticos, utilizado para implementar funcionalidades clave como autenticación de usuarios.
    ```bash
    npm install -g pnpm
    pnpm install
    ```
*   **API de OpenRouter.ai:** Utiliza el modelo **Qwen2.5 VL 72B Instruct**, entrenado específicamente para Medicina y Salud, con **capacidades avanzadas de razonamiento y solución de problemas** para un asistente médico efectivo.

### 🗄️ Gestión de Datos
![SQLite Cloud logo](https://sqlitecloud.io/social/logo.png)
*   **SQLite Cloud:** Sistema de gestión de bases de datos en la nube para almacenar información de usuarios (correo, nombre, chats archivados, tipo de inicio de sesión).
    *   La base de datos debe cargarse previamente desde el archivo `database.sql` (ubicado en la raíz del proyecto) en [SQLite Cloud](https://sqlitecloud.io/).
    *   Configura la conexión en el archivo `.env.local` con la URL, puerto y API key proporcionados por SQLite Cloud.
    ```env
    DATABASE_URL=sqlitecloud://<api-key>@<host>:<port>/database.sql
    ```

---

### ✨ Características del Modelo Qwen 2.5 VL 72B Instruct

### 🎯 Orientación Específica (System Instructions para Medicina y Salud)

Mediante system instructions, el modelo Qwen 2.5 VL es guiado para áreas como Medicina y Salud. Esto asegura respuestas adaptadas y precisas, basadas en conocimientos médicos actualizados hasta 2025, ideal para profesionales de la salud.

*   **🧠 Razonamiento Avanzado:**
    Modelo experimental con capacidades superiores de análisis, solución de problemas y toma de decisiones en contextos médicos complejos. Rendimiento eficiente y rápido.

*   **🖼️ Multimodalidad (Procesamiento de Imágenes y PDF):**
    Procesa texto, imágenes, videos, audio y extrae información de documentos PDF, ampliando su utilidad en entornos profesionales.

*   **📈 Escalabilidad:**
    Diseñado para funcionar eficientemente bajo cargas pesadas, manejando múltiples solicitudes simultáneas sin comprometer velocidad ni estabilidad.

*   **🌐 Capacidades Multilingües:**
    Probablemente ofrece compatibilidad con varios idiomas, facilitando su uso global (inferido de modelos Qwen previos).

*   **🔒 Privacidad y Seguridad:**
    Permite elegir entre respuestas más precisas (con posible acceso a datos históricos) o mayor privacidad. Destaca la importancia de la privacidad en su diseño.

---

## 🚀 Instalación y Configuración

Sigue estos pasos para poner en marcha el proyecto:

1.  **Clonar el repositorio:**

    ```bash
    git clone https://github.com/Fceli6787/MedicalAI/
    ```
2.  **Instalar dependencias:**

    ```bash
    pnpm install
    ```
3.  **Configurar variables de entorno:**

    *   Crea un archivo `.env.local` en la raíz del proyecto.
    *   Configura la conexión a la base de datos y la API de OpenRouter.ai en este archivo.
    ```env
    DATABASE_URL=sqlitecloud://<api-key>@<host>:<port>/database.sql
    OPENROUTER_API_KEY=your_openrouter_api_key
    ```
4.  **Configurar la base de datos:**

    *   Asegúrate de que **SQLite Cloud** esté ejecutándose.
    *   Carga el archivo de base de datos ubicado en `database.sql` (en la raíz del proyecto) en SQLite Cloud utilizando el ingreso en [SQLite Cloud](https://sqlitecloud.io/).
    *   Verifica que la `DATABASE_URL` en `.env.local` sea correcta.
5.  **Ejecutar el servidor:**

    ```bash
    pnpm run dev
    ```

---

## 👥 Integrantes del Proyecto

*   **Project Leader:** Jaider Rodríguez
*   **Arquitecto de Software:** Marlon González
*   **SCRUM Master:** María Murcia
*   **Desarrolladores:** Juan Blanco, Michael Romero
*   **Desarrollador Backend:** Jheison Sosa
*   **Desarrollador Frontend:** Andres Celi
*   **(Antes) Ingeniero de Calidad de Software (QA), Ahora (Desarrollador):** Cristian Zabala
