// app/api/mfa/login-verify/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { authenticator } from 'otplib';
import crypto from 'crypto';

// IMPORTA TUS FUNCIONES REALES DESDE lib/db.ts
import { 
  getUserByFirebaseUID, // Para obtener id_usuario y correo si es necesario
  getUserMfaConfig      // Para obtener el mfa_secret y mfa_enabled
} from '@/lib/db'; // Ajusta la ruta si es diferente

// --- INTERFACES (pueden estar en un archivo de tipos compartido) ---
interface UserFromDb {
  id_usuario: number;
  correo: string; // Aunque no se usa directamente para verificar TOTP, es bueno tenerlo
  firebase_uid: string;
  // ... otros campos que devuelva tu función getUserByFirebaseUID
}

interface MfaConfigFromDb {
  id_usuario: number;
  mfa_secret: string; // Secreto CIFRADO
  mfa_enabled: number; // 0 o 1
}

/**
 * Descifra un payload cifrado.
 * (Esta función debe ser idéntica a la usada en los otros endpoints de MFA)
 */
function decrypt(encryptedPayloadJSON: string): string {
  try {
    const { iv: ivHex, encryptedData: encryptedHex } = JSON.parse(encryptedPayloadJSON);
    const algorithm = 'aes-256-cbc';
    const encryptionKeyHex = process.env.MFA_ENCRYPTION_KEY || 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    
    if (!process.env.MFA_ENCRYPTION_KEY) {
        console.warn("ADVERTENCIA: MFA_ENCRYPTION_KEY no está configurada. Usando clave de descifrado de ejemplo insegura.");
    }
    if (encryptionKeyHex.length !== 64) {
        console.error("ERROR CRÍTICO: MFA_ENCRYPTION_KEY debe ser de 64 caracteres hexadecimales.");
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
  try {
    console.log('[MFA Login Verify] Iniciando verificación MFA');
    let body;
    try {
      body = await request.json();
      console.log('[MFA Login Verify] Body recibido:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('[MFA Login Verify] Error al parsear el cuerpo de la solicitud:', parseError);
      return NextResponse.json({ error: 'Error al parsear el cuerpo de la solicitud. Debe ser un JSON válido.' }, { status: 400 });
    }
    
    const { firebase_uid, token: totpToken } = body;

    // Validación exhaustiva de los parámetros de entrada
    if (!firebase_uid) {
      console.error('[MFA Login Verify] Error: firebase_uid no proporcionado');
      return NextResponse.json({ error: 'firebase_uid es requerido en el cuerpo de la solicitud.' }, { status: 400 });
    }
    
    if (typeof firebase_uid !== 'string') {
      console.error('[MFA Login Verify] Error: firebase_uid debe ser un string, recibido:', typeof firebase_uid);
      return NextResponse.json({ error: 'firebase_uid debe ser un string.' }, { status: 400 });
    }
    
    if (firebase_uid.trim() === '') {
      console.error('[MFA Login Verify] Error: firebase_uid está vacío');
      return NextResponse.json({ error: 'firebase_uid no puede estar vacío.' }, { status: 400 });
    }

    if (!totpToken) {
      console.error('[MFA Login Verify] Error: token TOTP no proporcionado');
      return NextResponse.json({ error: 'Token TOTP es requerido en el cuerpo de la solicitud.' }, { status: 400 });
    }
    
    if (typeof totpToken !== 'string') {
      console.error('[MFA Login Verify] Error: token TOTP debe ser un string, recibido:', typeof totpToken);
      return NextResponse.json({ error: 'Token TOTP debe ser un string.' }, { status: 400 });
    }
    
    if (!/^\d{6}$/.test(totpToken)) {
      console.error('[MFA Login Verify] Error: Token TOTP inválido, debe ser 6 dígitos numéricos');
      return NextResponse.json({ error: 'Token TOTP inválido. Debe ser un código de 6 dígitos numéricos.' }, { status: 400 });
    }

    // Sanitizar el input
    const cleanUid = firebase_uid.trim();
    console.log(`[MFA Login Verify] Buscando usuario con firebase_uid: '${cleanUid}'`);
    
    // 1. Obtener el id_usuario a partir del firebase_uid
    console.time('[MFA Login Verify] Tiempo de consulta getUserByFirebaseUID');
    const user = await getUserByFirebaseUID(cleanUid) as UserFromDb | null;
    console.timeEnd('[MFA Login Verify] Tiempo de consulta getUserByFirebaseUID');
    
    if (!user) {
      console.error(`[MFA Login Verify] getUserByFirebaseUID devolvió null para firebase_uid: '${cleanUid}'`);
      return NextResponse.json({
        error: 'No autenticado, usuario no encontrado. Asegúrate de enviar el firebase_uid correcto en el cuerpo.',
        detail: 'La función getUserByFirebaseUID no encontró un usuario con el firebase_uid proporcionado.'
      }, { status: 404 });
    }
    
    if (!user.id_usuario) {
      console.error(`[MFA Login Verify] getUserByFirebaseUID devolvió un objeto sin id_usuario:`, JSON.stringify(user, null, 2));
      return NextResponse.json({
        error: 'Error en la estructura de datos del usuario. id_usuario no está presente.',
        detail: 'La función getUserByFirebaseUID devolvió un objeto de usuario incompleto.'
      }, { status: 500 });
    }
    
    console.log(`[MFA Login Verify] Usuario encontrado: ID=${user.id_usuario}, UID=${user.firebase_uid}`);

    // 2. Obtener la configuración MFA del usuario
    const mfaConfig = await getUserMfaConfig(user.id_usuario) as MfaConfigFromDb | null;

    if (!mfaConfig || !mfaConfig.mfa_secret) {
      console.warn(`[MFA Login Verify] No se encontró configuración MFA o secreto para el usuario ID: ${user.id_usuario}.`);
      // Esto podría indicar un intento de login MFA para un usuario que no lo tiene configurado,
      // o que el MFA fue deshabilitado y el frontend no lo reflejó.
      return NextResponse.json({ error: 'MFA no configurado para este usuario.' }, { status: 403 }); // Forbidden
    }

    if (mfaConfig.mfa_enabled !== 1) {
      console.warn(`[MFA Login Verify] MFA no está habilitado para el usuario ID: ${user.id_usuario}, aunque existe configuración.`);
      return NextResponse.json({ error: 'MFA no está activamente habilitado para este usuario.' }, { status: 403 }); // Forbidden
    }

    // 3. Descifrar el secreto MFA
    let decryptedSecret: string;
    try {
      decryptedSecret = decrypt(mfaConfig.mfa_secret);
    } catch (decryptionError: any) {
        console.error(`[MFA Login Verify] Fallo en descifrado para usuario ID ${user.id_usuario}:`, decryptionError.message);
        return NextResponse.json({ error: 'Error al procesar la configuración de MFA (fallo de descifrado).' }, { status: 500 });
    }
    
    // 4. Verificar el token TOTP
    authenticator.options = { step: 30, window: 1 }; // Permitir una ventana de tiempo
    const isTokenValid = authenticator.verify({
      token: totpToken,
      secret: decryptedSecret,
    });

    if (isTokenValid) {
      console.log(`[MFA Login Verify] Token TOTP VÁLIDO para usuario ID: ${user.id_usuario}.`);
      // El frontend ahora puede proceder a establecer la sesión completa.
      // No es necesario devolver datos del usuario aquí, solo la confirmación.
      return NextResponse.json({ success: true, message: 'Verificación MFA exitosa.' });
    } else {
      console.log(`[MFA Login Verify] Token TOTP INVÁLIDO para usuario ID: ${user.id_usuario}.`);
      // TODO: Considerar implementar un contador de intentos fallidos para bloquear temporalmente.
      return NextResponse.json({ error: 'Token TOTP inválido.' }, { status: 401 }); // Unauthorized
    }

  } catch (error: any) {
    console.error('Error general en /api/mfa/login-verify:', error.message);
    console.error('Stack trace:', error.stack);
    
    let errorMessage = 'Error interno del servidor durante la verificación MFA.';
    let errorDetail = error.message || 'Sin detalles adicionales';
    let statusCode = 500;
    
    // Personalizar mensajes según tipo de error
    if (error.message.includes("Clave de descifrado MFA mal configurada") ||
        error.message.includes("No se pudo descifrar el secreto MFA")) {
        errorMessage = 'Error en la configuración de seguridad MFA.';
        errorDetail = error.message;
    } else if (error.message.includes("getUserByFirebaseUID")) {
        errorMessage = 'Error al buscar el usuario para verificación MFA.';
        errorDetail = error.message;
    } else if (error.message.includes("getUserMfaConfig")) {
        errorMessage = 'Error al obtener la configuración MFA del usuario.';
        errorDetail = error.message;
    }
    
    return NextResponse.json({
      error: errorMessage,
      detail: errorDetail
    }, { status: statusCode });
  }
}
