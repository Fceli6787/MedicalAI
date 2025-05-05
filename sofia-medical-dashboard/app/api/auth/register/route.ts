import { NextRequest, NextResponse } from 'next/server';
import { registerMedico } from '../../../../lib/db'; // Importar la función registerMedico de sqlitecloud
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '../../../../lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const {
      tipoDocumentoCodigo, // Cambiado a código
      paisCodigo, // Cambiado a código
      nui,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      email,
      password,
      id_especialidad, // Se mantiene como ID por ahora
      numero_tarjeta_profesional,
      años_experiencia,
    } = await request.json();

    // Validar campos requeridos para el registro de médico
    // Ahora validamos por los códigos de tipo de documento y país
    if (!tipoDocumentoCodigo || !paisCodigo || !nui || !primer_nombre || !primer_apellido || !email || !password || !id_especialidad || !numero_tarjeta_profesional) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos para el registro de médico.' },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth
    const auth = getAuth(app);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Register medical user in SQLiteCloud database using the new function
    // Pasamos los códigos y el ID de especialidad
    await registerMedico({
      tipoDocumentoCodigo, // Pasamos el código
      paisCodigo, // Pasamos el código
      nui,
      primer_nombre,
      segundo_nombre: segundo_nombre || null, // Asegurar que sea null si no se proporciona
      primer_apellido,
      segundo_apellido: segundo_apellido || null, // Asegurar que sea null si no se proporciona
      correo: email, // La función registerMedico espera 'correo'
      firebase_uid: firebaseUser.uid,
      id_especialidad: parseInt(id_especialidad), // Convertir a número
      numero_tarjeta_profesional,
      años_experiencia: años_experiencia ? parseInt(años_experiencia) : null, // Convertir a número o null
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
    // Manejar errores de la base de datos (ej. tipo de documento o país no encontrado)
    if (error.message.includes('no encontrado')) {
         return NextResponse.json(
            { error: error.message }, // El mensaje de error de la función db ya es descriptivo
            { status: 400 }
         );
    }
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
