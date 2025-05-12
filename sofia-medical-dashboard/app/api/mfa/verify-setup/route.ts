// app/api/mfa/verify-setup/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { authenticator } from 'otplib';
import crypto from 'crypto';

// IMPORTA TUS FUNCIONES REALES DESDE lib/db.ts
import { 
  getUserByFirebaseUID, // Corregido: Usar el nombre exacto de la función exportada en lib/db.ts
  getUserMfaConfig, 
  enableUserMfa 
} from '@/lib/db'; // Ajusta la ruta si es diferente

// --- INTERFACES (pueden estar en un archivo de tipos compartido si lo prefieres) ---

interface AuthenticatedUser { // Asegúrate que el tipo devuelto por getUserByFirebaseUid coincida
  id_usuario: number;
  correo: string;
  firebase_uid: string;
}

interface MfaConfigFromDb { // Asegúrate que el tipo devuelto por getUserMfaConfig coincida
  id_usuario: number;
  mfa_secret: string; 
  mfa_enabled: number; 
  mfa_verified_at?: string; // Hacemos el campo opcional para evitar errores cuando no está presente
}

/**
 * Parsea el request para obtener el firebase_uid y luego busca al usuario en la DB.
 * Esta función ahora utiliza la función importada getUserByFirebaseUid de lib/db.ts.
 * @param request - El objeto NextRequest.
 * @returns Una promesa que resuelve al objeto del usuario autenticado o null.
 */
async function getAuthenticatedUserForVerify(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const body = await request.json();
    const { firebase_uid } = body;

    if (!firebase_uid || typeof firebase_uid !== 'string') {
      console.warn("getAuthenticatedUserForVerify: firebase_uid no proporcionado en el cuerpo del request o es inválido.");
      return null;
    }
    
    (request as any).__parsedBody = body; // Guardar cuerpo para acceso posterior al 'token'

    // Utiliza la función importada de lib/db.ts
    const user = await getUserByFirebaseUID(firebase_uid); 
    if (user) {
      console.log(`getAuthenticatedUserForVerify: Usuario encontrado en DB para firebase_uid: ${firebase_uid}`);
      // Asegúrate que el objeto 'user' devuelto por getUserByFirebaseUid tenga las propiedades id_usuario, correo, firebase_uid
      return user as AuthenticatedUser; // Puede ser necesario un type assertion si la firma exacta difiere
    } else {
      console.warn(`getAuthenticatedUserForVerify: Usuario NO encontrado en DB para firebase_uid: ${firebase_uid}`);
      return null;
    }
  } catch (error) {
    console.error("getAuthenticatedUserForVerify: Error al parsear JSON del request o al obtener usuario:", error);
    return null;
  }
}

/**
 * Descifra un payload cifrado (que contiene IV y datos cifrados).
 * @param encryptedPayloadJSON - Una cadena JSON que contiene 'iv' y 'encryptedData'.
 * @returns El texto descifrado.
 * @throws Error si el descifrado falla o la clave no está configurada.
 */
function decrypt(encryptedPayloadJSON: string): string {
  try {
    const { iv: ivHex, encryptedData: encryptedHex } = JSON.parse(encryptedPayloadJSON);
    const algorithm = 'aes-256-cbc';
    const encryptionKeyHex = process.env.MFA_ENCRYPTION_KEY || 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    
    if (!process.env.MFA_ENCRYPTION_KEY) {
        console.warn("ADVERTENCIA: La variable de entorno MFA_ENCRYPTION_KEY no está configurada. Usando una clave de descifrado de ejemplo que NO ES SEGURA.");
    }
    if (encryptionKeyHex.length !== 64) {
        console.error("ERROR CRÍTICO: MFA_ENCRYPTION_KEY debe tener 64 caracteres hexadecimales. La configuración actual es insegura.");
        throw new Error("Clave de descifrado MFA mal configurada.");
    }

    const key = Buffer.from(encryptionKeyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error: any) {
    console.error("Error al descifrar el secreto MFA:", error.message);
    throw new Error(`No se pudo descifrar el secreto MFA. Detalle: ${error.message}`);
  }
}

// --- Handler del Endpoint POST ---
export async function POST(request: NextRequest) {
  let user: AuthenticatedUser | null = null;
  
  try {
    user = await getAuthenticatedUserForVerify(request);

    if (!user || !user.id_usuario) {
      return NextResponse.json({ error: 'No autenticado o ID de usuario no encontrado. Asegúrate de enviar firebase_uid.' }, { status: 401 });
    }

    const body = (request as any).__parsedBody;
    if (!body || !body.token) {
      return NextResponse.json({ error: 'Cuerpo del request inválido o token TOTP no proporcionado.' }, { status: 400 });
    }
    const token: string = body.token;

    if (typeof token !== 'string' || !/^\d{6}$/.test(token)) {
      return NextResponse.json({ error: 'Token TOTP inválido. Debe ser un código de 6 dígitos.' }, { status: 400 });
    }

    // Utiliza la función importada de lib/db.ts
    const mfaConfig = await getUserMfaConfig(user.id_usuario);

    if (!mfaConfig || !mfaConfig.mfa_secret) {
      console.warn(`[MFA Verify] No se encontró configuración MFA o secreto para el usuario ID: ${user.id_usuario}. ¿Se completó el paso de setup?`);
      return NextResponse.json({ error: 'MFA no configurado inicialmente para este usuario o secreto no encontrado.' }, { status: 404 });
    }

    if (mfaConfig.mfa_enabled === 1) {
      console.log(`[MFA Verify] MFA ya está habilitado para el usuario ID: ${user.id_usuario}.`);
      return NextResponse.json({ success: true, message: 'MFA ya está habilitado para este usuario.' }, { status: 200 });
    }

    let decryptedSecret: string;
    try {
      decryptedSecret = decrypt(mfaConfig.mfa_secret);
    } catch (decryptionError: any) {
        console.error(`[MFA Verify] Fallo en descifrado para usuario ID ${user.id_usuario}:`, decryptionError.message);
        return NextResponse.json({ error: 'Error al procesar la configuración de MFA (fallo de descifrado).' }, { status: 500 });
    }
    
    console.log(`[MFA Verify] Verificando token para usuario ${user.id_usuario}. Secreto descifrado (preview): ${decryptedSecret.substring(0,3)}...`);

    authenticator.options = { step: 30, window: 1 }; 
    const isTokenValid = authenticator.verify({
      token: token,
      secret: decryptedSecret,
    });

    if (isTokenValid) {
      // Utiliza la función importada de lib/db.ts
      const mfaEnabledSuccessfully = await enableUserMfa(user.id_usuario);
      if (mfaEnabledSuccessfully) {
        console.log(`[MFA Verify] MFA habilitado exitosamente para usuario ID: ${user.id_usuario}.`);
      // Obtener datos actualizados del usuario
      const updatedUser = await getUserByFirebaseUID(user.firebase_uid);
      if (!updatedUser) {
        console.warn(`[MFA Setup] No se encontró el usuario después de habilitar MFA para UID: ${user.firebase_uid}`);
        return NextResponse.json({ success: true, message: 'MFA habilitado, pero no se encontró el usuario.' }, { status: 404 });
      }

      // Obtener datos actualizados del usuario y su configuración MFA
      const updatedMfaConfig = await getUserMfaConfig(user.id_usuario);
      if (!updatedMfaConfig) {
        console.warn(`[MFA Setup] No se encontró la configuración MFA después de habilitarla para usuario ID: ${user.id_usuario}`);
        return NextResponse.json({ 
          success: true, 
          message: 'MFA habilitado en DB pero no se encontró la configuración actualizada.',
          user: {
            id_usuario: user.id_usuario,
            correo: user.correo,
            firebase_uid: user.firebase_uid,
            mfa_enabled: true
          }
        });
      }

      console.log(`[MFA Setup] MFA habilitado exitosamente para usuario ID: ${user.id_usuario}`);
      return NextResponse.json({ 
        success: true, 
        message: 'MFA habilitado exitosamente.',
        user: {
          id_usuario: user.id_usuario,
          correo: user.correo,
          firebase_uid: user.firebase_uid,
          mfa_enabled: true,
          mfa_verified_at: updatedMfaConfig.mfa_verified_at
        }
      });
      } else {
        console.error(`[MFA Verify] Error al actualizar la base de datos para habilitar MFA para usuario ID: ${user.id_usuario}.`);
        return NextResponse.json({ error: 'No se pudo habilitar MFA en la base de datos después de una verificación de token exitosa.' }, { status: 500 });
      }
    } else {
      console.log(`[MFA Verify] Token TOTP inválido para usuario ID: ${user.id_usuario}.`);
      return NextResponse.json({ error: 'Token TOTP inválido.' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error general en /api/mfa/verify-setup:', error);
    let errorMessage = 'Error interno del servidor al verificar la configuración de MFA.';
    if (error.message.includes("Clave de descifrado MFA mal configurada") || 
        error.message.includes("No se pudo descifrar el secreto MFA")) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
