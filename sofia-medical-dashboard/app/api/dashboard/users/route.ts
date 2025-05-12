// app/api/dashboard/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUsers, getFullUserByFirebaseUID, getUserMfaConfig } from '../../../../lib/db'; 
// Asegúrate que la ruta a lib/db sea correcta y que getFullUserByFirebaseUID esté exportada.

export async function GET(request: NextRequest) {
  try {
    // Usar request.nextUrl.searchParams para obtener los parámetros de búsqueda
    const firebaseUid = request.nextUrl.searchParams.get('firebase_uid');

    console.log(`[API Users GET] Request URL (original): ${request.url}`);
    console.log(`[API Users GET] Request nextUrl: ${request.nextUrl.pathname}${request.nextUrl.search}`);


    if (firebaseUid) {
      console.log(`[API Users GET] firebase_uid recibido de searchParams: '${firebaseUid}'`);
      const userFromDb = await getFullUserByFirebaseUID(firebaseUid);

      if (userFromDb) {
        console.log(`[API Users GET] Usuario completo de DB (antes de MFA):`, userFromDb);

        let mfaEnabledForUser = false;
        if (userFromDb.id_usuario) {
          console.log(`[API Users GET] Obteniendo estado MFA para usuario ID: ${userFromDb.id_usuario}`);
          const mfaConfig = await getUserMfaConfig(userFromDb.id_usuario);
          if (mfaConfig && mfaConfig.mfa_enabled === 1) {
            mfaEnabledForUser = true;
          }
          console.log(`[API Users GET] Estado MFA para usuario ID ${userFromDb.id_usuario}: ${mfaEnabledForUser}`);
        } else {
          console.warn(`[API Users GET] No se encontró id_usuario en userFromDb para verificar MFA.`);
        }
        
        const userWithMfaStatus = {
          ...userFromDb,
          mfa_enabled: mfaEnabledForUser,
        };

        console.log(`[API Users GET] Devolviendo usuario (con todos los detalles y MFA):`, userWithMfaStatus);
        return NextResponse.json({ user: userWithMfaStatus });
      } else {
        console.warn(`[API Users GET] Usuario no encontrado en DB para firebase_uid: ${firebaseUid}`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    } else {
      console.log(`[API Users GET] firebase_uid NO proporcionado en searchParams. Obteniendo todos los usuarios.`);
      const allUsers = await getUsers();
      return NextResponse.json({ users: allUsers });
    }
  } catch (error: any) {
    console.error('[API Users GET] Error obteniendo usuarios:', error.message, error.stack);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}
