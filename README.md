
 # SOF-IA: Asistente de Inteligencia Artificial Médica
![Logo SOF-IA](https://github.com/user-attachments/assets/47933f0a-6f45-475b-b312-8372fa85eb08)

# Propósito del Modelo

El propósito de este modelo es servir como un valioso apoyo para los profesionales médicos, optimizando el tiempo necesario para realizar diagnósticos, analizar radiografías e interpretar imágenes diagnósticas. Además, ofrece diversas opciones de interacción adaptadas a las necesidades del usuario:

- **Audio**: Permite interactuar con el modelo en tiempo real mediante un sistema de reconocimiento y respuesta por voz, simulando una conversación con un médico.
- **Texto**: Ofrece una interfaz gráfica intuitiva que facilita la interacción escrita, similar a herramientas como ChatGPT, Gemini y Grok.

## Recursos Necesarios para el Desarrollo del Proyecto

Para implementar el proyecto, es necesario integrar las siguientes tecnologías:

- **React**: Será utilizado en el desarrollo del frontend, asegurando una interfaz de usuario moderna, dinámica e interactiva.
- **Node.js**: Este entorno se empleará para el desarrollo del backend. Permitirá implementar funcionalidades clave como el inicio de sesión y la autenticación de usuarios, aprovechando su naturaleza orientada a eventos.
- **CSS**: Responsable del diseño visual (frontend), asegurando una interfaz atractiva y funcional para que el usuario interactúe con el chatbot.
- **API de OpenRouter.ai**: Esta API será utilizada para procesar las solicitudes del usuario, empleando el modelo **Gemini 2.0 Flash Thinking**, previamente entrenado específicamente para el área de Medicina y Salud. Este modelo cuenta con **capacidades avanzadas de razonamiento y solución de problemas**, haciéndolo ideal para ser un asistente médico efectivo.
- **MySQL**: Un sistema de gestión de bases de datos que almacenará la información del usuario, incluyendo correo electrónico, nombre, chats archivados y tipo de inicio de sesión (local o mediante Firebase).
- **Firebase**: La herramienta de Google que se utilizará para la autenticación a través de cuentas de Google. Esta tecnología simplificará el proceso de inicio de sesión y ofrecerá una experiencia segura y confiable.

