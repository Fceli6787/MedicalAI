// app/api/mfa/setup/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { authenticator } from 'otplib';
import crypto from 'crypto';

// --- IMPORTA TUS FUNCIONES REALES DESDE lib/db.ts ---
import { 
  getUserByFirebaseUID, // Asegúrate que este nombre coincida con tu exportación en lib/db.ts
  saveOrUpdateUserMfaConfig as saveOrUpdateUserMfaConfigInDb // Renombrado para claridad si es necesario
} from '@/lib/db'; // Ajusta la ruta si es necesario

// --- INTERFACES ---
interface AuthenticatedUser {
  id_usuario: number;
  correo: string;
  firebase_uid: string;
}

/**
 * Parsea el request para obtener el firebase_uid y luego busca al usuario en la DB
 * utilizando la función importada de lib/db.ts.
 * @param request - El objeto NextRequest.
 * @returns Una promesa que resuelve al objeto del usuario autenticado o null.
 */
async function getAuthenticatedUserForSetup(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Se accede al cuerpo parseado que se guardó en el request
    // Esto asume que el handler POST ya parseó el cuerpo y lo adjuntó.
    // Para mayor robustez, esta función también podría parsear si es la primera en hacerlo.
    const body = (request as any).__parsedBody || await request.json();
    if (!(request as any).__parsedBody) (request as any).__parsedBody = body; // Guardar si se parseó aquí

    console.log("[MFA Setup API / getAuthenticatedUserForSetup] Cuerpo procesado para obtener firebase_uid:", body);
    const { firebase_uid } = body;

    if (!firebase_uid || typeof firebase_uid !== 'string') {
      console.warn("[MFA Setup API / getAuthenticatedUserForSetup] firebase_uid no proporcionado o inválido en el cuerpo.");
      return null;
    }
    
    const user = await getUserByFirebaseUID(firebase_uid); 
    
    if (user) {
      console.log(`[MFA Setup API / getAuthenticatedUserForSetup] Usuario encontrado via lib/db.ts para firebase_uid: ${firebase_uid}`);
      return user as AuthenticatedUser;
    } else {
      console.warn(`[MFA Setup API / getAuthenticatedUserForSetup] Usuario NO encontrado via lib/db.ts para firebase_uid: ${firebase_uid}`);
      return null;
    }
  } catch (error) {
    console.error("[MFA Setup API / getAuthenticatedUserForSetup] Error:", error);
    return null;
  }
}

/**
 * Cifra un texto usando AES-256-CBC.
 */
function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc';
  const encryptionKeyHex = process.env.MFA_ENCRYPTION_KEY || 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'; 
  
  if (!process.env.MFA_ENCRYPTION_KEY) {
      console.warn("ADVERTENCIA: La variable de entorno MFA_ENCRYPTION_KEY no está configurada. Usando una clave de cifrado de ejemplo que NO ES SEGURA para producción.");
  }
  if (encryptionKeyHex.length !== 64) {
      console.error("ERROR CRÍTICO: MFA_ENCRYPTION_KEY debe tener 64 caracteres hexadecimales (representando 32 bytes). La configuración actual es insegura.");
      throw new Error("Clave de cifrado MFA mal configurada.");
  }

  const key = Buffer.from(encryptionKeyHex, 'hex');
  const iv = crypto.randomBytes(16); 

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return JSON.stringify({ iv: iv.toString('hex'), encryptedData: encrypted });
}

// --- Handler del Endpoint POST ---
export async function POST(request: NextRequest) {
  console.log("[MFA Setup API / POST] Request recibido en /api/mfa/setup"); // <--- LOG AÑADIDO
  try {
    // Parsear el cuerpo aquí primero para asegurar que __parsedBody esté disponible para getAuthenticatedUserForSetup
    // y para loguear el payload recibido.
    // Clonamos el request para poder leer el cuerpo múltiples veces si fuera necesario (aunque aquí solo una vez).
    const clonedRequest = request.clone();
    const bodyForLogging = await clonedRequest.json();
    console.log("[MFA Setup API / POST] Payload recibido del frontend:", bodyForLogging); // <--- LOG AÑADIDO

    // Adjuntar el cuerpo parseado al request original para que getAuthenticatedUserForSetup lo use
    (request as any).__parsedBody = bodyForLogging;

    const user = await getAuthenticatedUserForSetup(request); // Esta función ahora usará el cuerpo parseado
    
    if (!user || !user.id_usuario || !user.correo) {
      console.warn("[MFA Setup API / POST] Autenticación fallida o datos de usuario incompletos. User object:", user);
      return NextResponse.json({ error: 'No autenticado, ID de usuario o correo no encontrado. Asegúrate de enviar firebase_uid en el cuerpo.' }, { status: 401 });
    }

    const secretInPlainText = authenticator.generateSecret();
    const encryptedSecretToStore = encrypt(secretInPlainText);

    const savedSuccessfully = await saveOrUpdateUserMfaConfigInDb(user.id_usuario, encryptedSecretToStore);

    if (!savedSuccessfully) {
      console.error(`[MFA Setup API / POST] Fallo al guardar la configuración MFA para el usuario ID: ${user.id_usuario}`);
      return NextResponse.json({ error: 'No se pudo guardar la configuración MFA en la base de datos.' }, { status: 500 });
    }

    const appName = 'SOFIA AI Medical';
    const otpauthUrl = authenticator.keyuri(user.correo, appName, secretInPlainText);

    console.log(`[MFA Setup API / POST] Proceso completado para ${user.correo}.`);
    console.log(`   - OTPAuth URL generada: ${otpauthUrl}`);
    
    if (process.env.NODE_ENV === 'development') {
        (process.env as any).LAST_ENCRYPTED_SECRET_DEBUG = encryptedSecretToStore;
        console.log(`[MFA Setup API - DEBUG] Secreto cifrado guardado en process.env.LAST_ENCRYPTED_SECRET_DEBUG`);
    }

    return NextResponse.json({
      otpauthUrl: otpauthUrl,
    });

  } catch (error: any) {
    // Si el error es por parseo de JSON (ej. cuerpo vacío o malformado)
    if (error instanceof SyntaxError && error.message.toLowerCase().includes("json")) {
        console.error('[MFA Setup API / POST] Error al parsear el cuerpo JSON del request:', error.message);
        return NextResponse.json({ error: 'Cuerpo del request inválido. Se esperaba un JSON con firebase_uid.' }, { status: 400 });
    }
    console.error('Error general en /api/mfa/setup:', error);
    let errorMessage = 'Error interno del servidor al configurar MFA.';
    if (error.message === "Clave de cifrado MFA mal configurada.") {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
