// Contenido de app/api/diagnosticos/[id_diagnostico]/route.ts

import { type NextRequest, NextResponse } from 'next/server';
import { 
  getDiagnosticoDetalladoById, 
  deleteDiagnosticoCompletoById, 
  type DiagnosticoDetallado 
} from '@/lib/db'; 
import fs from 'fs'; 
import path from 'path'; 

const IMAGES_BASE_PATH = path.join(process.cwd(), 'private_uploads', 'diagnostic_images'); 
console.log(`[API GLOBAL] IMAGES_BASE_PATH inicializado como: ${IMAGES_BASE_PATH}`);

export async function GET(
  request: NextRequest,
  context: { params: { id_diagnostico: string } } // <--- CAMBIO AQUÍ
) {
  const id_diagnostico_str = context.params.id_diagnostico; // <--- CAMBIO AQUÍ
  console.log(`[API GET /api/diagnosticos/${id_diagnostico_str}] - Solicitud recibida.`);

  try {
    if (!id_diagnostico_str) {
      console.warn(`[API GET /api/diagnosticos/${id_diagnostico_str}] - Error: Falta el ID del diagnóstico.`);
      return NextResponse.json({ error: 'Falta el ID del diagnóstico en la ruta.' }, { status: 400 });
    }

    const id_diagnostico = parseInt(id_diagnostico_str, 10);
    if (isNaN(id_diagnostico)) {
      console.warn(`[API GET /api/diagnosticos/${id_diagnostico_str}] - Error: El ID no es un número.`);
      return NextResponse.json({ error: 'El ID del diagnóstico debe ser un número.' }, { status: 400 });
    }

    console.log(`[API GET /api/diagnosticos/${id_diagnostico}] - Llamando a getDiagnosticoDetalladoById...`);
    const diagnosticoDetallado: DiagnosticoDetallado | null = await getDiagnosticoDetalladoById(id_diagnostico);

    if (!diagnosticoDetallado) {
      console.warn(`[API GET /api/diagnosticos/${id_diagnostico}] - Diagnóstico no encontrado en la BD.`);
      return NextResponse.json({ error: 'Diagnóstico no encontrado.' }, { status: 404 });
    }
    console.log(`[API GET /api/diagnosticos/${id_diagnostico}] - Diagnóstico encontrado. imagen_url de BD: "${diagnosticoDetallado.imagen_url}", tipo: "${diagnosticoDetallado.imagen_tipo}"`);

    if (diagnosticoDetallado.imagen_url) {
      const currentImageUrl = diagnosticoDetallado.imagen_url;

      if (!currentImageUrl.startsWith('http') && 
          !currentImageUrl.startsWith('/') && 
          !currentImageUrl.startsWith('data:image')) {
        
        if (currentImageUrl.toUpperCase().startsWith('TEXT(') && currentImageUrl.endsWith(')')) {
          console.warn(`[API GET /api/diagnosticos/${id_diagnostico}] - ADVERTENCIA: imagen_url es "${currentImageUrl}". Problema en lib/db.ts o driver de BD. No se procesará.`);
          diagnosticoDetallado.imagen_url = null; 
        } else {
          const imageName = currentImageUrl; 
          const imagePath = path.join(IMAGES_BASE_PATH, imageName);
          console.log(`[API GET /api/diagnosticos/${id_diagnostico}] - Es nombre de archivo. Ruta completa construida: ${imagePath}`);

          try {
            if (fs.existsSync(imagePath)) {
              console.log(`[API GET /api/diagnosticos/${id_diagnostico}] - Archivo ${imagePath} EXISTE. Leyendo...`);
              const imageBuffer = fs.readFileSync(imagePath);
              if (imageBuffer.length === 0) {
                console.warn(`[API GET /api/diagnosticos/${id_diagnostico}] - ADVERTENCIA: Archivo ${imagePath} está VACÍO.`);
                diagnosticoDetallado.imagen_url = null;
              } else {
                const base64Image = imageBuffer.toString('base64');
                if (!base64Image) { 
                  console.warn(`[API GET /api/diagnosticos/${id_diagnostico}] - ADVERTENCIA: Conversión a Base64 resultó en string vacío para ${imagePath}.`);
                  diagnosticoDetallado.imagen_url = null;
                } else {
                  diagnosticoDetallado.imagen_url = base64Image; 
                  console.log(`[API GET /api/diagnosticos/${id_diagnostico}] - Imagen convertida a Base64. Longitud: ${base64Image.length}. Primeros 60 chars: ${base64Image.substring(0,60)}...`);
                }
              }
            } else {
              console.warn(`[API GET /api/diagnosticos/${id_diagnostico}] - ADVERTENCIA: Archivo de imagen NO encontrado en: ${imagePath}`);
              diagnosticoDetallado.imagen_url = null; 
            }
          } catch (fileError: any) {
            console.error(`[API GET /api/diagnosticos/${id_diagnostico}] - ERROR al leer/convertir archivo ${imagePath}:`, fileError.message, fileError.stack);
            diagnosticoDetallado.imagen_url = null; 
          }
        }
      } else {
        console.log(`[API GET /api/diagnosticos/${id_diagnostico}] - imagen_url ya es una URL/ruta/DataURI válida: ${currentImageUrl.substring(0,60)}...`);
      }
    } else {
        console.log(`[API GET /api/diagnosticos/${id_diagnostico}] - No hay imagen_url en los datos del diagnóstico.`);
    }

    console.log(`[API GET /api/diagnosticos/${id_diagnostico}] - Enviando respuesta al frontend. imagen_url final (primeros 60 chars si es string): ${typeof diagnosticoDetallado.imagen_url === 'string' ? diagnosticoDetallado.imagen_url.substring(0,60) + '...' : diagnosticoDetallado.imagen_url}`);
    return NextResponse.json(diagnosticoDetallado);

  } catch (error: any) {
    console.error(`[API GET /api/diagnosticos/${id_diagnostico_str}] - Error catastrófico:`, error);
    return NextResponse.json(
      { error: 'Error interno al obtener los detalles del diagnóstico.', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id_diagnostico: string } } // <--- CAMBIO AQUÍ
) {
  const id_diagnostico_str = context.params.id_diagnostico; // <--- CAMBIO AQUÍ
  console.log(`API DELETE /api/diagnosticos/${id_diagnostico_str}] - Solicitud recibida.`);
  try {
    if (!id_diagnostico_str) {
      console.warn(`[API DELETE /api/diagnosticos/${id_diagnostico_str}] - Error: Falta el ID.`);
      return NextResponse.json({ error: 'Falta el ID del diagnóstico en la ruta.' }, { status: 400 });
    }

    const id_diagnostico = parseInt(id_diagnostico_str, 10);
    if (isNaN(id_diagnostico)) {
      console.warn(`[API DELETE /api/diagnosticos/${id_diagnostico_str}] - Error: El ID no es un número.`);
      return NextResponse.json({ error: 'El ID del diagnóstico debe ser un número.' }, { status: 400 });
    }

    console.log(`[API DELETE /api/diagnosticos/${id_diagnostico}] - Llamando a deleteDiagnosticoCompletoById...`);
    const deleteResult = await deleteDiagnosticoCompletoById(id_diagnostico);

    if (deleteResult.success) {
      console.log(`[API DELETE /api/diagnosticos/${id_diagnostico}] - Eliminación exitosa.`);
      return NextResponse.json({ message: deleteResult.message }, { status: 200 }); 
    } else {
      const status = deleteResult.message.toLowerCase().includes("no se encontró") ? 404 : 500;
      console.warn(`[API DELETE /api/diagnosticos/${id_diagnostico}] - Falló la eliminación: ${deleteResult.message}`);
      return NextResponse.json({ error: deleteResult.message }, { status });
    }

  } catch (error: any) {
    console.error(`[API DELETE /api/diagnosticos/${id_diagnostico_str}] - Error catastrófico:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor al intentar eliminar el diagnóstico.', details: error.message },
      { status: 500 }
    );
  }
}
