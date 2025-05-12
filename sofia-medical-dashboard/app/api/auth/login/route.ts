// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
// Asegúrate que getUser y getUserMfaConfig estén correctamente implementados en lib/db.ts
import { getUser, getUserMfaConfig } from '../../../../lib/db';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../../../../lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

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
    const dbUser = await getUser(email);
    if (!dbUser) {
      console.error(`[Login API] User not found in DB for email: ${email}`);
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
      mfa_enabled: mfaEnabledForUser, // <--- AÑADIDO ESTADO MFA
    };
    
    // Verificación explícita del firebase_uid
    if (!userDataForContext.firebase_uid) {
      console.error('[Login API] ERROR CRÍTICO: firebase_uid es null o vacío:', userDataForContext.firebase_uid);
      userDataForContext.firebase_uid = firebaseUser.uid; // Garantizar que siempre tenga el valor de Firebase
      console.log('[Login API] Re-asignado firebase_uid desde Firebase:', userDataForContext.firebase_uid);
    }
    
    console.log(`[Login API] Prepared user data for context (with MFA status):`);
    console.log(`[Login API] - ID Usuario: ${userDataForContext.id_usuario}`);
    console.log(`[Login API] - Correo: ${userDataForContext.correo}`);
    console.log(`[Login API] - Firebase UID: ${userDataForContext.firebase_uid}`);
    console.log(`[Login API] - MFA Enabled: ${userDataForContext.mfa_enabled}`);

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
