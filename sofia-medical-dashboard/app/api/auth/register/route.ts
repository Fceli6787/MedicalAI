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
    console.error('Error general en el API de registro:', error);
    
    let errorMessage = 'Error en el registro.';
    let statusCode = 500;

    // Manejo de errores específicos de Firebase Auth
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'El correo electrónico ya está en uso.';
          statusCode = 409; // Conflict
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña es demasiado débil.';
          statusCode = 400; // Bad Request
          break;
        // Puedes añadir más casos de errores de Firebase Auth aquí si es necesario
        default:
          errorMessage = `Error de Firebase Auth: ${error.message}`;
          statusCode = 400; // O 500 dependiendo de la naturaleza del error
          console.error(`Código de error de Firebase Auth no manejado: ${error.code}`);
      }
    } else if (error.message) {
      // Manejar errores de la base de datos o de la función registerMedico
      if (error.message.includes('no encontrado')) {
           errorMessage = error.message; // El mensaje de error de la función db ya es descriptivo
           statusCode = 400; // Bad Request
      } else if (error.message.includes('Failed to retrieve new user ID')) {
           errorMessage = 'Error interno al confirmar el registro del usuario en la base de datos.';
           statusCode = 500;
      } else {
           // Error genérico de registerMedico o de otra parte del try block
           errorMessage = `Error en el proceso de registro: ${error.message}`;
           statusCode = 500;
      }
    } else {
        // Error completamente inesperado sin código ni mensaje
        errorMessage = 'Ocurrió un error inesperado durante el registro.';
        statusCode = 500;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
