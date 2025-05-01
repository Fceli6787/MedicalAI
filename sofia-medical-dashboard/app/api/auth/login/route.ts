import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '../../../../lib/db';
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // 2. Verificar usuario en base de datos SQL
    const dbUser = await getUser(email);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado en la base de datos' },
        { status: 404 }
      );
    }

    // 3. Validar estado del usuario
    if (dbUser.estado !== 'Activo') {
      return NextResponse.json(
        { error: 'La cuenta de usuario no está activa' },
        { status: 403 }
      );
    }

    // 4. Preparar respuesta
    const userData = {
      id: dbUser.id_usuario,
      email: dbUser.correo,
      name: `${dbUser.primer_nombre} ${dbUser.primer_apellido}`,
      role: dbUser.rol,
      firebaseUid: firebaseUser.uid
    };

    return NextResponse.json({ user: userData }, { status: 200 });

  } catch (error: any) {
    console.error('Error en login:', error);
    
    // Manejo de errores específicos de Firebase
    if (error.code === 'auth/wrong-password') {
      return NextResponse.json(
        { error: 'Correo o contraseña inválidos' },
        { status: 401 }
      );
    }
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error en la autenticación' },
      { status: 500 }
    );
  }
}
