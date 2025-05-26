// app/api/mfa/login-verify/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { authenticator } from 'otplib';
// IMPORTA TUS FUNCIONES REALES DESDE lib/db.ts
import { 
  getUserByFirebaseUID, // Para obtener id_usuario y correo si es necesario
  getUserMfaConfig      // Para obtener el mfa_secret y mfa_enabled
} from '@/lib/db'; // Ajusta la ruta si es diferente
import { decryptMfaSecret, mfaErrorResponse } from '@/lib/utils/mfa';

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
 * Valida los parámetros de entrada para la verificación MFA.
 * @param firebase_uid - UID de Firebase del usuario.
 * @param totpToken - Token TOTP proporcionado por el usuario.
 * @returns Un objeto de error si hay un problema de validación, o null si todo es válido.
 */
function validateMfaLoginInput(firebase_uid: any, totpToken: any) {
  if (!firebase_uid) {
    return { error: 'firebase_uid es requerido en el cuerpo de la solicitud.', status: 400 };
  }
  if (typeof firebase_uid !== 'string') {
    return { error: 'firebase_uid debe ser un string.', status: 400 };
  }
  if (firebase_uid.trim() === '') {
    return { error: 'firebase_uid no puede estar vacío.', status: 400 };
  }
  if (!totpToken) {
    return { error: 'Token TOTP es requerido en el cuerpo de la solicitud.', status: 400 };
  }
  if (typeof totpToken !== 'string') {
    return { error: 'Token TOTP debe ser un string.', status: 400 };
  }
  if (!/^\d{6}$/.test(totpToken)) {
    return { error: 'Token TOTP inválido. Debe ser un código de 6 dígitos numéricos.', status: 400 };
  }
  return null;
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
      return NextResponse.json({ error: 'Error al parsear el cuerpo de la solicitud. Debe ser un JSON válido.' }, { status: 400 });
    }
    const { firebase_uid, token: totpToken } = body;
    // Validación de entrada
    const validation = validateMfaLoginInput(firebase_uid, totpToken);
    if (validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }
    const cleanUid = firebase_uid.trim();
    // 1. Obtener el id_usuario a partir del firebase_uid
    const user = await getUserByFirebaseUID(cleanUid) as UserFromDb | null;
    if (!user) {
      return NextResponse.json({
        error: 'No autenticado, usuario no encontrado. Asegúrate de enviar el firebase_uid correcto en el cuerpo.',
        detail: 'La función getUserByFirebaseUID no encontró un usuario con el firebase_uid proporcionado.'
      }, { status: 404 });
    }
    if (!user.id_usuario) {
      return NextResponse.json({
        error: 'Error en la estructura de datos del usuario. id_usuario no está presente.',
        detail: 'La función getUserByFirebaseUID devolvió un objeto de usuario incompleto.'
      }, { status: 500 });
    }
    // 2. Obtener la configuración MFA del usuario
    const mfaConfig = await getUserMfaConfig(user.id_usuario) as MfaConfigFromDb | null;
    if (!mfaConfig || !mfaConfig.mfa_secret) {
      return NextResponse.json({ error: 'MFA no configurado para este usuario.' }, { status: 403 });
    }
    if (mfaConfig.mfa_enabled !== 1) {
      return NextResponse.json({ error: 'MFA no está activamente habilitado para este usuario.' }, { status: 403 });
    }
    // 3. Descifrar el secreto MFA
    let decryptedSecret: string;
    try {
      decryptedSecret = decryptMfaSecret(mfaConfig.mfa_secret);
    } catch (decryptionError: any) {
      return NextResponse.json({ error: 'Error al procesar la configuración de MFA (fallo de descifrado).' }, { status: 500 });
    }
    // 4. Verificar el token TOTP
    authenticator.options = { step: 30, window: 1 };
    const isTokenValid = authenticator.verify({
      token: totpToken,
      secret: decryptedSecret,
    });
    if (isTokenValid) {
      return NextResponse.json({ success: true, message: 'Verificación MFA exitosa.' });
    } else {
      return NextResponse.json({ error: 'Token TOTP inválido.' }, { status: 401 });
    }
  } catch (error: any) {
    const { errorMessage, errorDetail, statusCode } = mfaErrorResponse(error);
    return NextResponse.json({ error: errorMessage, detail: errorDetail }, { status: statusCode });
  }
}
