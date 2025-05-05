"use client";
import { addBasicUser, getUser } from '@/lib/db'; // Cambiada la importación a addBasicUser
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { app } from '@/lib/firebase';

const auth = getAuth(app);

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
  fecha_registro: Date;
  ultima_actividad: Date | null;
  estado: string; firebase_uid: string; role: string;
}

export async function register(name: string, email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Dividir el nombre completo en primer nombre y primer apellido
    const nameParts = name.split(' ');
    const primer_nombre = nameParts[0];
    const primer_apellido = nameParts.slice(1).join(' '); // El resto es el apellido

    // Llamar a addBasicUser con los datos requeridos
    await addBasicUser({
      primer_nombre: primer_nombre,
      primer_apellido: primer_apellido,
      correo: email,
      firebase_uid: user.uid,
    });

  } catch (error: any) {
    console.error(error);
    throw new Error(error.message);
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ user: User }> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    const userData = await getUser(user.uid);
    if (!userData) throw new Error('User not found');
    // Eliminada la validación de rol ya que validateUserRole no está disponible
    // Si se necesita el rol, se debe obtener de userData o de otra fuente
    return { user: { ...userData, role: userData.role || 'default' } }; // Asumiendo que userData podría tener un campo 'role' o asignando un rol por defecto
  } catch (error: any) {
    console.error(error); throw new Error(error.message); } }
