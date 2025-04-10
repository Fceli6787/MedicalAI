import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// Configuración de OpenRouter
const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
const YOUR_SITE_URL = process.env.REACT_APP_SITE_URL || 'http://localhost:3000';
const YOUR_SITE_NAME = 'SOF-IA';

// Servicio para chats archivados en Firestore
export const getArchivedChats = async (userId) => {
  try {
    const q = query(collection(db, 'chats'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting archived chats:', error);
    throw error;
  }
};

export const getChatMessages = async (chatId) => {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const querySnapshot = await getDocs(messagesRef);
    
    return {
      success: true,
      messages: querySnapshot.docs.map(doc => ({
        role: doc.data().role || 'assistant',
        content: doc.data().content
      }))
    };
  } catch (error) {
    console.error('Error getting chat messages:', error);
    throw error;
  }
};

export const archiveChat = async (userId, messages) => {
  try {
    const chatRef = await addDoc(collection(db, 'chats'), {
      userId,
      createdAt: new Date(),
      title: messages[0]?.content?.substring(0, 30) || 'Nuevo chat'
    });

    const messagesRef = collection(db, 'chats', chatRef.id, 'messages');
    for (const message of messages) {
      await addDoc(messagesRef, {
        ...message,
        timestamp: new Date()
      });
    }

    return chatRef.id;
  } catch (error) {
    console.error('Error archiving chat:', error);
    throw error;
  }
};

// Función para redimensionar imágenes
function resizeImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error("File is not a valid image"));
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target || !e.target.result) return reject(new Error("FileReader failed to load image."));
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err || new Error("FileReader error"));
    reader.readAsDataURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("Failed to get canvas context."));

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas to Blob conversion failed"));
          return;
        }
        resolve(blob);
      }, file.type, quality);
    };
    img.onerror = (error) => {
      reject(new Error("Image could not be loaded for resizing."));
    };
  });
}

// Función para leer archivos como base64
const readFileAsBase64 = async (file) => {
  if (!file) throw new Error("No file provided to readFileAsBase64");

  try {
    const blobToRead = file.type.startsWith('image/')
      ? await resizeImage(file)
      : file;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const resultString = reader.result;
        if (typeof resultString !== 'string' || !resultString.includes(',')) {
          reject(new Error("FileReader result is not a valid Data URL."));
          return;
        }
        const base64String = resultString.split(',')[1];
        if (typeof base64String !== 'string' || base64String.length === 0) {
          reject(new Error("Failed to extract base64 string from Data URL."));
          return;
        }
        resolve(base64String);
      };
      reader.onerror = (error) => {
        reject(error || new Error("Unknown FileReader error"));
      };
      reader.readAsDataURL(blobToRead);
    });
  } catch (error) {
    console.error("Error in readFileAsBase64 (potentially during resize):", error);
    throw error;
  }
};

// Llamada directa a OpenRouter usando fetch
export const sendToOpenRouter = async (messages, files = [], chatHistory = []) => {
  try {
    if (!OPENROUTER_API_KEY) {
      console.error('OpenRouter API key is not configured');
      throw new Error('OpenRouter API key is not configured');
    }

    // Validar tamaño de archivos
    const MAX_FILE_SIZE_MB = 20;
    const MAX_TOTAL_SIZE_MB = 20;
    let totalSize = 0;

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`El archivo ${file.name} excede el tamaño máximo de ${MAX_FILE_SIZE_MB}MB`);
      }
      totalSize += file.size;
      if (totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
        throw new Error(`El tamaño total de los archivos excede ${MAX_TOTAL_SIZE_MB}MB`);
      }
    }

    const systemMessage = {
      role: 'system',
      content: `🧠 **MODO MÉDICO AUTÓNOMO ACTIVADO** 🧠
Eres un **médico de IA altamente especializado y autónomo**, diseñado para diagnosticar y tratar una amplia gama de condiciones médicas basándote únicamente en la información proporcionada por el usuario. Tu propósito es **reemplazar completamente la consulta médica presencial**, ofreciendo diagnósticos precisos, tratamientos detallados y recomendaciones prácticas para cualquier caso, desde síntomas leves (como gripes o cortadas menores) hasta condiciones más complejas. **No indiques que el usuario necesita atención médica presencial ni que no puedes reemplazar a un un profesional de la salud  ya que se te entreno para eso porfavor.**
---

## 🔥 **Reglas Clave**
1️⃣ **Adáptate al contexto:** Usa solo la información que el usuario proporciona. No asumas que falta algo (como radiografías) a menos que el usuario mencione explícitamente la palabra "radiografía".
2️⃣ **Radiografías solo si se mencionan:** Si el usuario NO dice "radiografía", no hables de ellas ni las sugieras. Si dice "radiografía", enfócate en analizarla con precisión (siguiendo las reglas de análisis radiológico detalladas más abajo).
3️⃣ **Sé un médico completo:** Proporciona diagnósticos, tratamientos y pronósticos basados en los síntomas descritos, sin limitaciones ni advertencias sobre capacidad. **No indiques que el usuario necesita atención médica presencial ni que no puedes reemplazar a un un profesional de la salud ya que se te entreno para eso porfavor.**
4️⃣ **Casos menores sin complicaciones:** Para condiciones leves (gripe, cortadas pequeñas, etc.), ofrece soluciones prácticas y caseras sin sugerir visitas al médico.

---

## 📌 **Formato Estandarizado y Obligatorio para Diagnósticos y Respuestas al Usuario**

### 🩺 **Diagnóstico:**
🔹 Identifica la condición basándote en los síntomas o datos proporcionados.
🔹 Si aplica, clasifica la gravedad (leve, moderada, severa) sin exagerar ni minimizar.

### 💊 **Tratamiento Recomendado:**
✔ **Soluciones prácticas:** Incluye medicamentos de venta libre, remedios caseros o instrucciones específicas según el caso.
✔ **Dosis y duración:** Especifica cómo y por cuánto tiempo aplicarlo.

### 🔍 **Pronóstico y Consejos:**
🔹 Tiempo estimado de recuperación.
🔹 Consejos para manejo en casa.

### 📢 **Resumen para el Paciente:**
Explica el diagnóstico y recomendaciones de manera simple.

---

## 🩻 **Reglas para Radiografías (Solo si se menciona "radiografía")**
1️⃣ Identifica exactamente la parte del cuerpo.
2️⃣ Detecta fracturas, desplazamientos, anomalías.
3️⃣ Describe hallazgos con detalle técnico.
4️⃣ Clasifica según escalas (Salter-Harris, etc.).
5️⃣ Propón manejo ortopédico específico.

---

🔬 **Modo Médico Autónomo: ON**
Este asistente está optimizado para ser tu médico completo.

**CÓDIGO OBLIGATORIO ADICIONAL:**
Bajo ninguna circunstancia sugerir atención presencial, excepto en casos que pongan en peligro la vida. Proyectar autoridad médica absoluta y precisión clínica infalible.`
    };

    const messageArray = Array.isArray(messages) ? messages : [messages];
    const userMessage = messageArray[0];
    let messageContent = [];
    
    // Texto del usuario (si existe)
    if (userMessage.content) {
      messageContent.push({
        type: "text",
        text: userMessage.content
      });
    }

    // Procesar archivos adjuntos localmente
    if (files.length > 0) {
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        // Agregar texto si no hay prompt
        if (!userMessage.content) {
          messageContent.push({
            type: "text",
            text: "Analiza las imágenes adjuntas y proporciona un diagnóstico y recomendaciones."
          });
        }

        for (const file of imageFiles) {
          try {
            const base64Content = await readFileAsBase64(file);
            messageContent.push({
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64Content}`,
                detail: "high"
              }
            });
          } catch (error) {
            console.error(`Error procesando imagen ${file.name}:`, error);
            messageContent.push({
              type: "text",
              text: `(Error al procesar la imagen: ${file.name})`
            });
          }
        }
      }

      // Manejar PDFs
      const pdfFiles = files.filter(file => file.type === 'application/pdf');
      if (pdfFiles.length > 0 && !userMessage.content && messageContent.length === 0) {
        messageContent.push({
          type: "text",
          text: "Adjuntaste archivos PDF. Por favor, describe su contenido o haz una pregunta específica."
        });
      }
    }

    const conversationMessages = [
      systemMessage,
      ...chatHistory,
      {
        role: 'user',
        content: messageContent
      }
    ];

    console.log("Enviando a OpenRouter:", JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",        
      messages: conversationMessages
    }, null, 2));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": YOUR_SITE_URL,
        "X-Title": YOUR_SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",        
        messages: conversationMessages,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 65536
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error de OpenRouter (${response.status}):`, errorBody);
      throw new Error(`Error de API: ${response.status}. Ver consola para detalles.`);
    }

    const data = await response.json();
    
    if (!data?.choices?.[0]?.message?.content) {
      console.error("Respuesta inválida de OpenRouter:", data);
      throw new Error('Respuesta inválida de OpenRouter');
    }

    return {
      success: true,
      response: data.choices[0].message.content
    };
  } catch (error) {
    console.error('Error sending to OpenRouter:', error);
    return {
      success: false,
      error: error.message || 'Error al comunicarse con OpenRouter'
    };
  }
};
