
 # SOF-IA: Asistente de Inteligencia Artificial Médica
![Logo SOF-IA](https://github.com/user-attachments/assets/47933f0a-6f45-475b-b312-8372fa85eb08)


El propósito de este modelo es servir como un valioso apoyo para los profesionales médicos, optimizando el tiempo necesario para realizar diagnósticos, analizar radiografías e interpretar imágenes diagnósticas. Además, ofrece diversas opciones de interacción adaptadas a las necesidades del usuario:

- **Audio**: Permite interactuar con el modelo en tiempo real mediante un sistema de reconocimiento y respuesta por voz, simulando una conversación con un médico.
- **Texto**: Ofrece una interfaz gráfica intuitiva que facilita la interacción escrita, similar a herramientas como ChatGPT, Gemini y Grok.

## Recursos Necesarios para el Desarrollo del Proyecto

Para implementar el proyecto, es necesario integrar las siguientes tecnologías:

- **PHP**: Utilizado para desarrollar el backend con programación orientada a objetos. Este lenguaje permitirá implementar funcionalidades como inicio de sesión y autenticación de usuarios.
- **CSS**: Responsable del diseño visual (frontend), asegurando una interfaz atractiva y funcional para que el usuario interactúe con el chatbot.
- **API de Gemini**: Esta API procesará las solicitudes del usuario. Se empleará el modelo más reciente, Gemini 2.0 Flash Thinking, diseñado específicamente para el área de Medicina y Salud. Este modelo cuenta con capacidades avanzadas de razonamiento y solución de problemas, haciéndolo ideal para ser un asistente médico efectivo.
- **MySQL**: Un sistema de gestión de bases de datos que almacenará la información del usuario, incluyendo correo electrónico, nombre, chats archivados y tipo de inicio de sesión (local o mediante Firebase).
- **Firebase**: La herramienta de Google que se utilizará para la autenticación a través de cuentas de Google. Esta tecnología simplificará el proceso de inicio de sesión y ofrecerá una experiencia segura y confiable.
