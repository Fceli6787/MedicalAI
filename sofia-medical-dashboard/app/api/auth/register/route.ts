import { NextRequest, NextResponse } from 'next/server';
import { registerMedico } from '../../../../lib/db'; // Importar la nueva función registerMedico
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '../../../../lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const {
      id_tipo_documento,
      id_pais,
      nui,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      email,
      password,
      id_especialidad,
      numero_tarjeta_profesional,
      años_experiencia,
    } = await request.json();

    // Validar campos requeridos para el registro de médico
    if (!id_tipo_documento || !id_pais || !nui || !primer_nombre || !primer_apellido || !email || !password || !id_especialidad || !numero_tarjeta_profesional) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos para el registro de médico.' },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth
    const auth = getAuth(app);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Register medical user in MySQL database using the new function
    await registerMedico({
      id_tipo_documento: parseInt(id_tipo_documento),
      id_pais: parseInt(id_pais),
      nui,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      correo: email,
      firebase_uid: firebaseUser.uid,
      id_especialidad: parseInt(id_especialidad),
      numero_tarjeta_profesional,
      años_experiencia: años_experiencia ? parseInt(años_experiencia) : null,
    });

    return NextResponse.json({ message: 'Médico registrado exitosamente' }, { status: 201 });
  } catch (error: any) {
    console.error('Error in registration API:', error);
    // Manejo de errores específicos de Firebase Auth
    if (error.code === 'auth/email-already-in-use') {
      return NextResponse.json(
        { error: 'El correo electrónico ya está en uso' },
        { status: 409 }
      );
    }
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'La contraseña es demasiado débil' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
