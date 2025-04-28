ts
import { addUser, getUser, validateUserRole } from '@/lib/db';
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
    await addUser(user.uid, name, email);
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
    const userRole = await validateUserRole(user.uid);
    return { user: { ...userData, role: userRole } };
  } catch (error: any) {
    console.error(error); throw new Error(error.message); } }