// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserMfaConfig, updateLastLoginInfo, getFullUserByFirebaseUID } from '../../../../lib/db';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../../../../lib/firebase';
import { EmailService } from '../../../../lib/services/emailService';
import { transporter } from '../../../../lib/emailConfig';
import { IEmailService } from '../../../../lib/services/interfaces/IEmailService'; // Importar la interfaz

// Helper para normalizar IPs de loopback para comparación
const normalizeIpForComparison = (ip: string | null | undefined): string | null => {
  if (!ip) return null;
  // Normaliza '::1' (IPv6 loopback) a '127.0.0.1' (IPv4 loopback) para que se consideren iguales
  if (ip === '::1' || ip === '127.0.0.1') {
    return '127.0.0.1';
  }
  return ip;
};

export async function POST(request: NextRequest) {
  try {
    const { email, password, turnstileToken } = await request.json();

    // 1. Verificar el token de Cloudflare Turnstile
    if (!turnstileToken) {
      console.warn('[Login API] Turnstile token missing.');
      return NextResponse.json(
        { error: 'Verificación de seguridad requerida. Por favor, recarga la página.' },
        { status: 400 }
      );
    }

    const CLOUDFLARE_TURNSTILE_SECRET_KEY = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

    if (!CLOUDFLARE_TURNSTILE_SECRET_KEY) {
      console.error('[Login API] CLOUDFLARE_TURNSTILE_SECRET_KEY is not set.');
      return NextResponse.json(
        { error: 'Error de configuración del servidor: clave secreta de Turnstile no encontrada.' },
        { status: 500 }
      );
    }

    const turnstileVerificationUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const turnstileFormData = new FormData();
    turnstileFormData.append('secret', CLOUDFLARE_TURNSTILE_SECRET_KEY);
    turnstileFormData.append('response', turnstileToken);
    turnstileFormData.append('remoteip', request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''); // Opcional: IP del usuario

    console.log('[Login API] Sending Turnstile verification request...');
    const turnstileResponse = await fetch(turnstileVerificationUrl, {
      method: 'POST',
      body: turnstileFormData,
    });

    const turnstileData = await turnstileResponse.json();
    console.log('[Login API] Turnstile verification response:', turnstileData);

    if (!turnstileData.success) {
      console.warn('[Login API] Turnstile verification failed:', turnstileData['error-codes']);
      return NextResponse.json(
        { error: 'Verificación de seguridad fallida. Por favor, inténtalo de nuevo.' },
        { status: 403 }
      );
    }
    console.log('[Login API] Turnstile verification successful.');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const auth = getAuth(app);
    console.log(`[Login API] Attempting Firebase sign in for: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    console.log(`[Login API] Firebase sign in successful for UID: ${firebaseUser.uid}`);

    console.log(`[Login API] Fetching user data from DB for email: ${email}`);
    // Usar getFullUserByFirebaseUID para obtener también la IP y ubicación
    const dbUser = await getFullUserByFirebaseUID(firebaseUser.uid);
    if (!dbUser) {
      console.error(`[Login API] User not found in DB for firebase_uid: ${firebaseUser.uid}`);
      return NextResponse.json(
        { error: 'Usuario no encontrado en la base de datos local' },
        { status: 404 }
      );
    }
    console.log(`[Login API] DB User found:`, dbUser);

    if (dbUser.estado !== 'Activo') {
      console.warn(`[Login API] User account is not active for email: ${email}`);
      return NextResponse.json(
        { error: 'La cuenta de usuario no está activa' },
        { status: 403 }
      );
    }

    // --- OBTENER ESTADO DE MFA ---
    let mfaEnabledForUser = false;
    if (dbUser.id_usuario) {
      const mfaConfig = await getUserMfaConfig(dbUser.id_usuario);
      if (mfaConfig && mfaConfig.mfa_enabled === 1) {
        mfaEnabledForUser = true;
      }
      console.log(`[Login API] MFA status for user ID ${dbUser.id_usuario}: ${mfaEnabledForUser}`);
    } else {
      console.warn(`[Login API] No id_usuario found for user ${email} to check MFA status.`);
    }
    // --- FIN OBTENER ESTADO DE MFA ---

    // --- Detección de IP Anómala ---
    const currentIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'UNKNOWN_IP';
    const normalizedCurrentIp = normalizeIpForComparison(currentIp);

    const lastLoginIp = dbUser.ultima_ip_login;
    const normalizedLastLoginIp = normalizeIpForComparison(lastLoginIp);
    const lastLoginLocation = dbUser.ultima_ubicacion_login; // Si se implementa la geolocalización

    if (normalizedLastLoginIp && normalizedLastLoginIp !== normalizedCurrentIp) {
      console.warn(`[Login API] ALERTA DE SEGURIDAD: Inicio de sesión desde una IP diferente para usuario ${email}. IP anterior: ${lastLoginIp} (normalizada: ${normalizedLastLoginIp}), IP actual: ${currentIp} (normalizada: ${normalizedCurrentIp})`);
      
      // Enviar correo de alerta si el usuario NO tiene MFA habilitado
      if (!mfaEnabledForUser) {
        const loginTime = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }); // Formato de hora local
        const emailService = new EmailService(transporter, process.env.EMAIL_FROM || 'no-reply@example.com');
        await emailService.sendLoginAlertEmail(
          dbUser.correo,
          dbUser.primer_nombre || dbUser.correo, // Usar primer nombre o correo si no hay nombre
          currentIp,
          lastLoginIp,
          loginTime
        );
      }
    } else if (!lastLoginIp) {
      console.log(`[Login API] Primer inicio de sesión o IP no registrada para usuario ${email}. Registrando IP actual: ${currentIp}`);
    }

    // Actualizar la última IP y actividad del usuario para TODOS los usuarios
    await updateLastLoginInfo(dbUser.id_usuario, currentIp, 'UNKNOWN_LOCATION'); // 'UNKNOWN_LOCATION' por ahora
    console.log(`[Login API] Última IP de login (${currentIp}) y actividad actualizadas para usuario ID: ${dbUser.id_usuario}`);
    // --- FIN Detección de IP Anómala ---

    const userDataForContext = {
      id_usuario: dbUser.id_usuario,
      id_tipo_documento: dbUser.id_tipo_documento,
      id_pais: dbUser.id_pais,
      nui: dbUser.nui,
      primer_nombre: dbUser.primer_nombre,
      segundo_nombre: dbUser.segundo_nombre,
      primer_apellido: dbUser.primer_apellido,
      segundo_apellido: dbUser.segundo_apellido,
      correo: dbUser.correo,
      fecha_registro: dbUser.fecha_registro,
      ultima_actividad: dbUser.ultima_actividad,
      estado: dbUser.estado,
      firebase_uid: firebaseUser.uid,
      roles: dbUser.roles || [],
      mfa_enabled: mfaEnabledForUser,
      ultima_ip_login: currentIp, // Incluir la IP actual en los datos del contexto
      ultima_ubicacion_login: 'UNKNOWN_LOCATION', // Incluir la ubicación actual en los datos del contexto
    };
    
    // Verificación explícita del firebase_uid
    if (!userDataForContext.firebase_uid) {
      console.error('[Login API] ERROR CRÍTICO: firebase_uid es null o vacío:', userDataForContext.firebase_uid);
      userDataForContext.firebase_uid = firebaseUser.uid; // Garantizar que siempre tenga el valor de Firebase
      console.log('[Login API] Re-asignado firebase_uid desde Firebase:', userDataForContext.firebase_uid);
    }
    
    console.log(`[Login API] Prepared user data for context (with MFA status and IP):`);
    console.log(`[Login API] - ID Usuario: ${userDataForContext.id_usuario}`);
    console.log(`[Login API] - Correo: ${userDataForContext.correo}`);
    console.log(`[Login API] - Firebase UID: ${userDataForContext.firebase_uid}`);
    console.log(`[Login API] - MFA Enabled: ${userDataForContext.mfa_enabled}`);
    console.log(`[Login API] - Current IP: ${userDataForContext.ultima_ip_login}`);

    // Enviar notificación de inicio de sesión exitoso a médicos
    if (dbUser.roles && dbUser.roles.includes('medico')) {
      const loginTime = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
      const emailService = new EmailService(transporter, process.env.EMAIL_FROM || 'no-reply@example.com');
      await emailService.sendSuccessfulLoginNotification(
        dbUser.correo,
        dbUser.primer_nombre || dbUser.correo,
        currentIp,
        loginTime
      );
    }

    return NextResponse.json({ user: userDataForContext }, { status: 200 });

  } catch (error: any) {
    console.error('[Login API] Error during login process:', error);
    if (error.code) {
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          console.warn(`[Login API] Firebase Auth Error: ${error.code}`);
          return NextResponse.json({ error: 'Correo o contraseña inválidos' }, { status: 401 });
        case 'auth/too-many-requests':
          console.warn(`[Login API] Firebase Auth Error: ${error.code}`);
          return NextResponse.json({ error: 'Demasiados intentos fallidos. Intenta más tarde.' }, { status: 429 });
        default:
          console.error(`[Login API] Unhandled Firebase Error Code: ${error.code}`);
      }
    }
    return NextResponse.json(
      { error: 'Error interno del servidor durante la autenticación' },
      { status: 500 }
    );
  }
}
