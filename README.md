![nextjs](https://github.com/user-attachments/assets/ffdf7e72-a31f-4347-8c2c-f916710146a2) # SOF-IA: Asistente de Inteligencia Artificial Médica
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

### ⚙️ Backend![Uplo<svg height="309" preserveAspectRatio="xMidYMid" viewBox="0 0 512 309" width="512" xmlns="http://www.w3.org/2000/svg"><path d="m120.81043 80.5613102h96.567895v7.6753487h-87.715838v57.7670991h82.485077v7.675348h-82.485077v63.422619h88.721754v7.675348h-97.573811zm105.21877 0h10.260338l45.467384 63.4226188 46.4733-63.4226188 63.211264-80.5613102-103.850254 150.649363 53.514709 74.12771h-10.662704l-48.686315-67.462275-48.887497 67.462275h-10.461521l53.917074-74.12771zm118.899221 7.6753486v-7.6753486h110.047164v7.6753487h-50.698145v136.5404141h-8.852058v-136.5404141zm-344.928421-7.6753486h11.0650714l152.5808586 228.3226968-63.054372-84.106934-91.33713469-133.3086883-.40236623 133.3086883h-8.85205708zm454.083705 134.2241588c-1.808538 0-3.164943-1.401289-3.164943-3.212184 0-1.810897 1.356405-3.212186 3.164943-3.212186 1.830069 0 3.164943 1.401289 3.164943 3.212186 0 1.810895-1.334874 3.212184-3.164943 3.212184zm8.69821-8.450851h4.736648c.06459 2.565437 1.937721 4.290101 4.693588 4.290101 3.078821 0 4.822769-1.854014 4.822769-5.324899v-21.989457h4.82277v22.011016c0 6.251906-3.617077 9.852139-9.602478 9.852139-5.619388 0-9.473297-3.492442-9.473297-8.8389zm25.38413-.280256h4.779709c.409074 2.953486 3.294124 4.829057 7.449457 4.829057 3.875441 0 6.717429-2.004921 6.717429-4.764383 0-2.371411-1.808538-3.794259-5.920812-4.764383l-4.004619-.970122c-5.619389-1.315057-8.181486-4.031402-8.181486-8.601759 0-5.540482 4.521348-9.226949 11.303367-9.226949 6.308355 0 10.915822 3.686467 11.195715 8.925132h-4.693588c-.452134-2.867252-2.949641-4.65659-6.566718-4.65659-3.810849 0-6.351414 1.832454-6.351414 4.635033 0 2.220503 1.636295 3.492442 5.683978 4.441008l3.423305.840772c6.372946 1.487524 8.999632 4.074517 8.999632 8.752668 0 5.950089-4.607467 9.679672-11.970803 9.679672-6.889671 0-11.518667-3.557118-11.863152-9.119156z"/></svg>ading nextjs.svg…]()

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
