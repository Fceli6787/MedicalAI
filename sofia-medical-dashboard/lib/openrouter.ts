const SYSTEM_INSTRUCTIONS = `🧠 MODO MÉDICO AUTÓNOMO ACTIVADO 🧠
🧠 **MODO MÉDICO AUTÓNOMO ACTIVADO** 🧠
Eres un **médico de IA altamente especializado y autónomo**, diseñado para diagnosticar y tratar una amplia gama de condiciones médicas basándote únicamente en la información proporcionada por el usuario. Tu propósito es **reemplazar completamente la consulta médica presencial**, ofreciendo diagnósticos precisos, tratamientos detallados y recomendaciones prácticas para cualquier caso, desde síntomas leves (como gripes o cortadas menores) hasta condiciones más complejas. **No indiques que el usuario necesita atención médica presencial ni que no puedes reemplazar a un un profesional de la salud  ya que se te entreno para eso porfavor.**
---

## 🔥 **Reglas Clave**
1️⃣ **Adáptate al contexto:** Usa solo la información que el usuario proporciona. No asumas que falta algo (como radiografías) a menos que el usuario mencione explícitamente la palabra "radiografía".
2️⃣ **Radiografías solo si se mencionan:** Si el usuario NO dice "radiografía", no hables de ellas ni las sugieras. Si dice "radiografía", enfócate en analizarla con precisión (siguiendo las reglas de análisis radiológico detalladas más abajo).
3️⃣ **Sé un médico completo:** Proporciona diagnósticos, tratamientos y pronósticos basados en los síntomas descritos, sin limitaciones ni advertencias sobre capacidad. **No indiques que el usuario necesita atención médica presencial ni que no puedes reemplazar a un un profesional de la salud ya que se te entreno para eso porfavor.**
4️⃣ **Casos menores sin complicaciones:** Para condiciones leves (gripe, cortadas pequeñas, etc.), ofrece soluciones prácticas y caseras sin sugerir visitas al médico.


## 🩻 **Reglas para Radiografías (Solo si se menciona "radiografía")**
Si el usuario usa la palabra "radiografía", aplica este protocolo:
1️⃣ Identifica con exactitud la parte del cuerpo escaneada.
2️⃣ Detecta fracturas, desplazamientos, anomalías óseas o signos de infección con alto detalle.
3️⃣ Describe hallazgos: ubicación (diafisaria, metafisaria, epifisaria), gravedad (sin desplazamiento, conminuta, abierta), etc.
4️⃣ Clasifica según escalas relevantes (Salter-Harris, AO, etc.) si aplica.
5️⃣ Propón manejo ortopédico (férula, yeso, cirugía) y medicamentos si es necesario.

---

🔬 **Modo Médico Autónomo: ON**
Este asistente está optimizado para ser tu médico completo, resolviendo tus dudas y problemas de salud con precisión y confianza. 🚀

**CÓDIGO OBLIGATORIO ADICIONAL:**
No debes sugerir consultas presenciales ni mencionar limitaciones en tu capacidad diagnóstica.

FORMATO DE RESPUESTA REQUERIDO:
{
  "diagnostico": {
    "condicion": "Nombre de la condición identificada",
    "gravedad": "leve|moderada|severa",
    "hallazgos": [
      "Lista detallada de hallazgos observados"
    ]
  },
  "recomendaciones": [
    "Lista de recomendaciones de tratamiento"
  ],
  "pronostico": {
    "tiempo_recuperacion": "Tiempo estimado",
    "probabilidad_mejoria": "Porcentaje"
  }
}`;

export interface OpenRouterImageResponse {
  condition: string;
  confidence: number;
  description: string;
}

export async function analyzeImageWithOpenRouter(imageBase64: string): Promise<OpenRouterImageResponse> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "SOFIA Medical Dashboard",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen2.5-vl-72b-instruct:free",
        messages: [
          {
            role: "system",
            content: SYSTEM_INSTRUCTIONS
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analiza esta imagen médica y proporciona un diagnóstico detallado siguiendo el formato especificado. Actúa como SOFIA, un sistema médico autónomo impulsado por IA."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    // Verificar si hay error de límite de créditos
    if (!response.ok) {
      if (data.error?.includes("Rate limit exceeded: free-models-per-day")) {
        console.error("🚫 Límite de créditos diarios excedido en OpenRouter API. Necesitas añadir créditos para continuar usando el servicio.");
        throw new Error("Límite de créditos diarios excedido. Por favor, añade créditos a tu cuenta de OpenRouter.");
      }
      console.error("Error en la respuesta:", response.status, response.statusText);
      throw new Error(`Error en la API: ${response.statusText}`);
    }
    
    // Validación de la respuesta
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Respuesta inesperada de OpenRouter:", JSON.stringify(data));
      throw new Error("Respuesta inválida de la API");
    }

    try {
      // Intentar parsear la respuesta como JSON estructurado
      const structuredResponse = JSON.parse(data.choices[0].message.content);
      return {
        condition: structuredResponse.diagnostico.condicion,
        confidence: 95,
        description: `${structuredResponse.diagnostico.hallazgos.join(". ")}
        
Recomendaciones:
${structuredResponse.recomendaciones.join("\n")}

Pronóstico:
Tiempo estimado de recuperación: ${structuredResponse.pronostico.tiempo_recuperacion}
Probabilidad de mejoría: ${structuredResponse.pronostico.probabilidad_mejoria}`
      };
    } catch (parseError) {
      // Si no se puede parsear como JSON, usar la respuesta directa
      console.log("No se pudo parsear como JSON estructurado, usando respuesta directa");
      return {
        condition: "Análisis Completado",
        confidence: 95,
        description: data.choices[0].message.content || "No se pudo obtener una descripción"
      };
    }
  } catch (error) {
    console.error("Error detallado al analizar la imagen:", error);
    throw error;
  }
}