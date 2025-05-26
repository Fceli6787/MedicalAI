// lib/utils/mfa.ts
import crypto from 'crypto';

/**
 * Descifra un payload cifrado MFA (AES-256-CBC).
 * @param encryptedPayloadJSON JSON con iv y encryptedData en hex.
 * @returns string descifrado
 * @throws Error si la clave es inválida o el descifrado falla
 */
export function decryptMfaSecret(encryptedPayloadJSON: string): string {
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

/**
 * Cifra un texto usando AES-256-CBC para MFA.
 */
export function encryptMfaSecret(text: string): string {
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

/**
 * Centraliza el manejo de errores para MFA login-verify.
 */
export function mfaErrorResponse(error: any) {
  let errorMessage = 'Error interno del servidor durante la verificación MFA.';
  let errorDetail = error.message || 'Sin detalles adicionales';
  let statusCode = 500;

  if (error.message?.includes("Clave de descifrado MFA mal configurada") ||
      error.message?.includes("No se pudo descifrar el secreto MFA")) {
    errorMessage = 'Error en la configuración de seguridad MFA.';
    errorDetail = error.message;
  } else if (error.message?.includes("getUserByFirebaseUID")) {
    errorMessage = 'Error al buscar el usuario para verificación MFA.';
    errorDetail = error.message;
  } else if (error.message?.includes("getUserMfaConfig")) {
    errorMessage = 'Error al obtener la configuración MFA del usuario.';
    errorDetail = error.message;
  }

  return { errorMessage, errorDetail, statusCode };
}
