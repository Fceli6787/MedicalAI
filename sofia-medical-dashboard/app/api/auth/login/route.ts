import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '../../../../lib/db'; // Asegúrate que getUser devuelve el objeto completo con id_usuario y roles
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

    // 1. Autenticación con Firebase
    const auth = getAuth(app);
    console.log(`[Login API] Attempting Firebase sign in for: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    console.log(`[Login API] Firebase sign in successful for UID: ${firebaseUser.uid}`);

    // 2. Verificar usuario en base de datos SQL
    console.log(`[Login API] Fetching user data from DB for email: ${email}`);
    const dbUser = await getUser(email); // getUser debe devolver el objeto completo
    if (!dbUser) {
       console.error(`[Login API] User not found in DB for email: ${email}`);
      // Considerar si deberías desautenticar de Firebase aquí si el usuario no existe en tu DB
      // await signOut(auth); 
      return NextResponse.json(
        { error: 'Usuario no encontrado en la base de datos local' },
        { status: 404 }
      );
    }
     console.log(`[Login API] DB User found:`, dbUser);

    // 3. Validar estado del usuario
    if (dbUser.estado !== 'Activo') {
       console.warn(`[Login API] User account is not active for email: ${email}`);
       // Considerar desautenticar de Firebase
       // await signOut(auth);
      return NextResponse.json(
        { error: 'La cuenta de usuario no está activa' },
        { status: 403 }
      );
    }

    // 4. Preparar respuesta con los nombres de campo correctos que espera AuthContext
    // Asegúrate que dbUser contiene todas estas propiedades desde lib/db -> getUser
    const userDataForContext = {
      id_usuario: dbUser.id_usuario, // *** CORRECCIÓN: Usar 'id_usuario' ***
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
      firebase_uid: firebaseUser.uid, // Usar el UID de Firebase que se acaba de autenticar
      roles: dbUser.roles || [], // *** CORRECCIÓN: Usar 'roles' (array) ***
      // 'rol' individual no es necesario si ya tienes 'roles'
    };
    console.log(`[Login API] Prepared user data for context:`, userDataForContext);

    // Devolver el objeto completo dentro de la clave 'user'
    return NextResponse.json({ user: userDataForContext }, { status: 200 });

  } catch (error: any) {
    console.error('[Login API] Error during login process:', error);
    
    // Manejo de errores específicos de Firebase
    if (error.code) { // Los errores de Firebase tienen un 'code'
        switch (error.code) {
            case 'auth/invalid-credential': // Código común para email/pass incorrecto
            case 'auth/wrong-password':
            case 'auth/user-not-found': // Firebase no encontró el email
                 console.warn(`[Login API] Firebase Auth Error: ${error.code}`);
                 return NextResponse.json(
                    { error: 'Correo o contraseña inválidos' },
                    { status: 401 } // Unauthorized
                 );
            case 'auth/too-many-requests':
                 console.warn(`[Login API] Firebase Auth Error: ${error.code}`);
                 return NextResponse.json(
                    { error: 'Demasiados intentos fallidos. Intenta más tarde.' },
                    { status: 429 } // Too Many Requests
                 );
            // Añadir otros códigos de error de Firebase si es necesario
            default:
                 console.error(`[Login API] Unhandled Firebase Error Code: ${error.code}`);
        }
    }
    
    // Error genérico si no es un error conocido de Firebase
    return NextResponse.json(
      { error: 'Error interno del servidor durante la autenticación' },
      { status: 500 }
    );
  }
}
