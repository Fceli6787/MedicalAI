import { NextRequest, NextResponse } from 'next/server';
import { getUsers, getUserByFirebaseUid } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get('firebase_uid');

    if (firebaseUid) {
      // Si se proporciona firebase_uid, buscar usuario por UID
      const user = await getUserByFirebaseUid(firebaseUid);
      if (user) {
        // Devolver el objeto de usuario completo con el array de roles
        return NextResponse.json({ user });
      } else {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    } else {
      // Si no se proporciona firebase_uid, devolver todos los usuarios (comportamiento actual)
      const users = await getUsers();
      return NextResponse.json(users);
    }
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}
