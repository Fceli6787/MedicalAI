import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfile, UpdateUserProfileData } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authConfig } from '../../../../auth.config';

export async function PUT(request: NextRequest) {
  try {
    console.log('API PUT /api/dashboard/profile - Solicitud recibida');
    
    const session = await getServerSession(authConfig);
    if (!session?.user?.firebase_uid) {
      console.log('API PUT /api/dashboard/profile - No autorizado');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('API PUT /api/dashboard/profile - Datos recibidos:', body);

    // Validar campos requeridos
    const requiredFields = ['primer_nombre', 'primer_apellido', 'correo'];
    for (const field of requiredFields) {
      if (!body[field]) {
        console.log(`API PUT /api/dashboard/profile - Falta campo requerido: ${field}`);
        return NextResponse.json(
          { error: `Falta el campo obligatorio: ${field}` },
          { status: 400 }
        );
      }
    }

    // Actualizar perfil
    const updatedUser = await updateUserProfile(session.user.firebase_uid, body as UpdateUserProfileData);
    console.log('API PUT /api/dashboard/profile - Perfil actualizado exitosamente');

    return NextResponse.json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('Error en PUT /api/dashboard/profile:', error);
    if (error.message && error.message.includes('no encontrado')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Error al actualizar el perfil' },
      { status: 500 }
    );
  }
}