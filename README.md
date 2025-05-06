 # SOF-IA: Asistente de Inteligencia Artificial Médica
![Logo SOF-IA](https://github.com/user-attachments/assets/47933f0a-6f45-475b-b312-8372fa85eb08)

Un asistente de IA diseñado para apoyar a los profesionales médicos en diagnósticos, análisis de radiografías e interpretación de imágenes diagnósticas.

## 💡 Propósito

Este modelo está diseñado para ofrecer un valioso apoyo a los profesionales médicos, optimizando el tiempo necesario para realizar diagnósticos, analizar radiografías e interpretar imágenes diagnósticas. Proporciona diversas opciones de interacción adaptadas a las necesidades del usuario:

*   **Texto y imagen en un informe⌨️:** Interfaz gráfica intuitiva que facilita el manejo de diagnosticos por medio de la Inteligencia artificial y un dashboard.

---

## 🛠️ Tecnologías Implementadas

Para garantizar el éxito del desarrollo y una experiencia excepcional, este proyecto integra las siguientes tecnologías:

### 💻 Frontend
<img src="https://res.cloudinary.com/harendra21/image/upload/v1742472944/withcodeexample.com/building-a-react-app-with-tailwind-css_e0pv0i.jpg" alt="React logo" width= "300"/>
*   **React:** Framework para desarrollar una interfaz de usuario moderna, interactiva y dinámica.
*   **CSS:** Encargado del diseño visual, asegurando una experiencia atractiva y funcional para los usuarios.

### ⚙️ Backend
<img src="https://images.seeklogo.com/logo-png/32/1/next-js-logo-png_seeklogo-321806.png" alt="Next logo" width= "300"/>
*   **Next.js:** Entorno de desarrollo orientado a eventos, usado para implementar funcionalidades clave como inicio de sesión y autenticación de usuarios.
    ```bash
    npm install -g pnpm
    pnpm install
    ```
*   **API de OpenRouter.ai:** Utiliza el modelo **Qwen2.5 VL 72B Instruct**, previamente entrenado específicamente para el área de Medicina y Salud. Este modelo cuenta con **capacidades avanzadas de razonamiento y solución de problemas**, haciéndolo ideal para ser un asistente médico efectivo.

### 🗄️ Gestión de Datos
<img src="https://sqlitecloud.io/social/logo.png" alt="SQLite logo" width= "300"/>
*   **SQLite Cloud:** Sistema de gestión de bases de datos encargado de almacenar información de los usuarios, como correo electrónico, nombre, chats archivados y tipo de inicio de sesión.
    *   La base de datos debe cargarse previamente desde el archivo `sofia/database.sql` mediante el ingreso en [SQLite Cloud](https://sqlitecloud.io/).
    *   Configura la conexión a la base de datos en el archivo `.env.local` con la URL, puerto y API key proporcionados por SQLite Cloud.
    ```env
    DATABASE_URL=sqlitecloud://<api-key>@<host>:<port>/sofia/database.sql
    ```

---

### ✨ Características del Modelo Qwen 2.5 VL 72B Instruct
<img src="https://camo.githubusercontent.com/ccaf5777a453a4a2736fd472e3b46b721b49bdaac6afe401bcaaeed4dc077ee0/68747470733a2f2f7169616e77656e2d7265732e6f73732d636e2d6265696a696e672e616c6979756e63732e636f6d2f5177656e322e352d564c2f7177656e322e35766c5f6c6f676f2e706e67" alt="Qwen 2.5 VL logo" width="300" />

# 🎯 Orientación Específica (System Instructions para Medicina y Salud)

A través de system instructions, el modelo Qwen 2.5 VL puede ser guiado específicamente para áreas como Medicina y Salud. Estas instrucciones definen cómo debe comportarse y responder dentro de este contexto, asegurando que las respuestas sean adaptadas y extremadamente precisas, basándose en conocimientos médicos relevantes y actualizados hasta el año 2025. Esto lo convierte en una herramienta ideal para profesionales de la salud que requieren diagnósticos o soluciones basadas en información científica confiable.

*   **🧠 Razonamiento Avanzado:**
    Este modelo experimental está diseñado para ofrecer capacidades superiores de análisis, solución de problemas y toma de decisiones en contextos complejos, como los médicos. Su rendimiento es eficiente y rápido, lo que permite abordar situaciones críticas con precisión y agilidad.

*   **🖼️ Multimodalidad (Procesamiento de Imágenes y PDF):**
    Una de las principales ventajas de Qwen 2.5 VL es su capacidad multimodal. Puede procesar no solo texto, sino también imágenes, videos y datos de audio. Además, ha sido mejorado para interpretar y extraer información relevante de documentos PDF, lo que amplía enormemente su utilidad en entornos profesionales donde se manejan informes técnicos, artículos científicos y gráficos médicos.

*   **📈 Escalabilidad:**
    El modelo está diseñado para funcionar eficientemente incluso bajo cargas pesadas. Puede manejar múltiples solicitudes simultáneas sin comprometer la velocidad ni la estabilidad del sistema. Esta característica es crucial para aplicaciones clínicas o industriales donde el tiempo de respuesta es esencial.

*   **🌐 Capacidades Multilingües:**
    Aunque no se menciona explícitamente en los datos recopilados, dado que Qwen ha desarrollado modelos previos con soporte multilingüe, podemos inferir que Qwen 2.5 VL 72B Instruct probablemente ofrezca compatibilidad con varios idiomas, facilitando su uso global.

*   **🔒 Privacidad y Seguridad:**
    Al utilizar este modelo, los usuarios tienen la opción de elegir entre respuestas más precisas asumiendo cierto acceso a datos personales o históricos previos. Esto destaca la importancia de la privacidad en su diseño, aunque siempre debe usarse con precaución según las necesidades del usuario.

---

## 🚀 Instalación y Configuración

Sigue estos pasos para poner en marcha el proyecto:

1.  **Clonar el repositorio:**

    ```bash
    git clone https://github.com/Fceli6787/MedicalAI/
    ```
2.  **Instalar dependencias:**

    ```bash
    npm install
    ```
3.  **Configurar la base de datos:**

    *   Asegúrate de que **SQLite Cloud** esté ejecutándose.
    *   Carga el archivo de base de datos ubicado en `sofia/database.sql` en SQLite Cloud utilizando el ingreso en [SQLite Cloud](https://sqlitecloud.io/).
    *   Configura la conexión a la base de datos en el archivo `.env.local` con la URL, puerto y API key proporcionados por SQLite Cloud.
    ```env
    DATABASE_URL=sqlitecloud://<api-key>@<host>:<port>/sofia/database.sql
    ```
4.  **Configurar las variables de entorno:**

    *   El proyecto incluye dos archivos `.env`:
        *   **Frontend:** El archivo `.env` se encuentra en la carpeta `sofia`. Modifica las credenciales según tu configuración.
        *   **Backend:** El archivo `.env` correspondiente está en la raíz del backend. También deberá ser modificado con las credenciales adecuadas.
5.  **Ejecutar el servidor:**

    ```bash
    pnpm run dev
    ```

---

## 👥 Integrantes del Proyecto

* **Project Leader:** Jaider Rodríguez
* **Arquitecto de Software:** Marlon González
* **SCRUM Master:** María Murcia
* **Desarrolladores:** Juan Blanco, Michael Romero
* **Desarrollador Backend:** Jheison Sosa
* **Desarrollador Frontend:** Andres Celi
* **(Antes) Ingeniero de Calidad de Software (QA):, Ahora (Desarrollador)** Cristian Zabala
