"use client";
// Importar registerMedico y getFullUserByFirebaseUID de lib/db
import { registerMedico, getFullUserByFirebaseUID } from '@/lib/db';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  // signOut, // Descomentar si se necesita signOut aquí
} from 'firebase/auth';
import { app } from '@/lib/firebase';

const auth = getAuth(app);

// Interfaz User debe coincidir con FullUserFromDB o lo que devuelva getFullUserByFirebaseUID
export interface User {
  id_usuario: number;
  id_tipo_documento: number;
  id_pais: number;
  nui: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  correo: string;
  fecha_registro: string;
  ultima_actividad: string | null;
  estado: string;
  firebase_uid: string;
  roles: string[]; // roles del usuario (ej. ['medico'])
}

// Interfaz para los datos de registro del médico, incluyendo todos los campos para registerMedico
interface MedicoRegistrationData {
  // Campos para Firebase Auth
  email: string;
  password: string;

  // Campos para la tabla 'usuarios' y 'medicos' a través de registerMedico
  tipoDocumentoCodigo: string;
  paisCodigo: string;
  nui: string;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  id_especialidad: number;
  numero_tarjeta_profesional: string;
  años_experiencia?: number | null; // Opcional
}

/**
 * Registra un nuevo médico en Firebase Authentication y luego en la base de datos local.
 * @param data - Objeto con todos los datos necesarios para el registro del médico.
 */
export async function registerNewMedico(data: MedicoRegistrationData): Promise<void> {
  try {
    // 1. Crear usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    const firebaseUser = userCredential.user;
    console.log(`Usuario creado en Firebase con UID: ${firebaseUser.uid}`);

    // 2. Preparar datos y llamar a registerMedico para la base de datos local
    //    La función registerMedico en lib/db.ts ya maneja la creación en 'usuarios',
    //    la asignación en 'usuariosroles', y la creación en 'medicos'.
    await registerMedico({
      tipoDocumentoCodigo: data.tipoDocumentoCodigo,
      paisCodigo: data.paisCodigo,
      nui: data.nui,
      primer_nombre: data.primer_nombre,
      segundo_nombre: data.segundo_nombre,
      primer_apellido: data.primer_apellido,
      segundo_apellido: data.segundo_apellido,
      correo: data.email, // Usar el email para la BD local también
      firebase_uid: firebaseUser.uid, // Vincular con Firebase UID
      id_especialidad: data.id_especialidad,
      numero_tarjeta_profesional: data.numero_tarjeta_profesional,
      años_experiencia: data.años_experiencia,
    });

    console.log(`Médico registrado en Firebase y BD local: ${data.email}`);

  } catch (error: any) {
    console.error("Error en registerNewMedico:", error);
    // Considera un manejo de error más robusto, como eliminar el usuario de Firebase si falla la BD local.
    throw new Error(error.message || "Error durante el proceso de registro del médico.");
  }
}

/**
 * Inicia sesión de un usuario (médico) con Firebase y obtiene sus datos de la BD local.
 * @param email - Correo electrónico del médico.
 * @param password - Contraseña del médico.
 * @returns Una promesa que resuelve al objeto User del médico.
 * @throws Error si el login falla, el usuario no se encuentra en la BD local, o no tiene el rol 'medico'.
 */
export async function loginMedico(
  email: string,
  password: string
): Promise<{ user: User }> {
  try {
    // 1. Iniciar sesión en Firebase
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;
    console.log(`Usuario autenticado en Firebase: ${firebaseUser.uid}`);

    // 2. Obtener datos completos del usuario de la BD local usando getFullUserByFirebaseUID
    const localUserData = await getFullUserByFirebaseUID(firebaseUser.uid);

    if (!localUserData) {
      console.error(`Error en login: No se encontró el usuario local para Firebase UID ${firebaseUser.uid}.`);
      // Es importante manejar este caso. Si el usuario está en Firebase pero no en la BD local,
      // podría ser un estado inconsistente.
      // Considera cerrar sesión de Firebase aquí.
      // await auth.signOut();
      throw new Error('Credenciales inválidas o usuario no registrado completamente en el sistema.');
    }
    
    // 3. Verificar que el usuario tenga el rol 'medico'
    if (!localUserData.roles || !localUserData.roles.includes('medico')) {
        console.warn(`Intento de login por usuario no médico o sin roles definidos: ${email}. Roles: ${localUserData.roles?.join(', ')}`);
        // await auth.signOut(); // Cerrar sesión de Firebase
        throw new Error('Acceso denegado. Esta cuenta no tiene permisos de médico.');
    }

    console.log(`Médico logueado y datos locales obtenidos: ${localUserData.correo}, Roles: ${localUserData.roles.join(', ')}`);
    return { user: localUserData as User }; // Cast a User si la estructura es compatible

  } catch (error: any) {
    console.error("Error en loginMedico:", error);
    // Mapear errores comunes de Firebase a mensajes más amigables
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Correo electrónico o contraseña incorrectos.');
    }
    throw new Error(error.message || "Error durante el inicio de sesión.");
  }
}

// export async function signOutFirebase() {
//   try {
//     await signOut(auth);
//     console.log("Usuario deslogueado de Firebase");
//   } catch (error: any) {
//     console.error("Error al cerrar sesión en Firebase:", error);
//     throw new Error(error.message || "Error al cerrar sesión.");
//   }
// }
