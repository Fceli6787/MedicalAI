// app/api/dashboard/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
// Asegúrate que las funciones estén correctamente implementadas e importadas de lib/db.ts
import { getUsers, getUserByFirebaseUID, getUserMfaConfig } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get('firebase_uid');

    if (firebaseUid) {
      // Si se proporciona firebase_uid, buscar usuario por UID
      console.log(`[API Users] Fetching user by firebase_uid: ${firebaseUid}`);
      const userFromDb = await getUserByFirebaseUID(firebaseUid); // Esta función ya debería devolver el objeto con roles según tu db.ts

      if (userFromDb) {
        // --- OBTENER ESTADO DE MFA ---
        let mfaEnabledForUser = false;
        if (userFromDb.id_usuario) { // Asegurarse que id_usuario existe en el objeto devuelto
          console.log(`[API Users] Fetching MFA status for user ID: ${userFromDb.id_usuario}`);
          const mfaConfig = await getUserMfaConfig(userFromDb.id_usuario);
          if (mfaConfig && mfaConfig.mfa_enabled === 1) {
            mfaEnabledForUser = true;
          }
          console.log(`[API Users] MFA status for user ID ${userFromDb.id_usuario}: ${mfaEnabledForUser}`);
        } else {
          console.warn(`[API Users] No id_usuario found for user with firebase_uid ${firebaseUid} to check MFA status.`);
        }
        // --- FIN OBTENER ESTADO DE MFA ---

        // Combinar datos del usuario con el estado de MFA
        const userWithMfaStatus = {
          ...userFromDb,
          mfa_enabled: mfaEnabledForUser, // <--- AÑADIDO ESTADO MFA
        };

        console.log(`[API Users] User found and MFA status determined. Returning user:`, userWithMfaStatus);
        return NextResponse.json({ user: userWithMfaStatus });
      } else {
        console.warn(`[API Users] User not found for firebase_uid: ${firebaseUid}`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    } else {
      // Si no se proporciona firebase_uid, devolver todos los usuarios (comportamiento actual)
      // Esta parte probablemente no necesite el estado de MFA para cada usuario a menos que se requiera en la lista.
      // Por ahora, la dejamos como está. Si necesitas MFA status para todos, habría que iterar y consultar.
      console.log(`[API Users] firebase_uid not provided. Fetching all users.`);
      const allUsers = await getUsers();
      return NextResponse.json({ users: allUsers }); // Asegúrate que esto devuelva un objeto con la clave 'users' si el frontend lo espera así.
    }
  } catch (error: any) {
    console.error('[API Users] Error fetching users:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}
