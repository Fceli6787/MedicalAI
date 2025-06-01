import { type NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../../../lib/db';
import { DiagnosticoRepositoryImpl } from '../../../../../lib/repositories/diagnosticoRepository';
import { LocalImageStorageService } from '../../../../../lib/services/imageStorageService';
import { generateDiagnosisPDF, DiagnosisReportData } from '../../../../../lib/generate-pdf';
import { EmailService } from '../../../../../lib/services/emailService';
import { transporter } from '../../../../../lib/emailConfig'; // Importar el transporter centralizado

const fromEmail = process.env.EMAIL_FROM || 'no-reply@sofiamedical.com'; // Usar un valor por defecto si no está configurado

async function getDiagnosticoRepositoryInstance() {
  const dbClient = await getConnection();
  const imageStorageService = new LocalImageStorageService();
  return new DiagnosticoRepositoryImpl(dbClient, imageStorageService);
}

async function getEmailServiceInstance(): Promise<EmailService> {
  return new EmailService(fromEmail); // Ya no se pasa el transporter aquí
}

// Función auxiliar para cargar la imagen desde una URL
async function loadImageBufferFromUrl(url: string): Promise<Buffer | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error al cargar la imagen desde ${url}: ${response.statusText}`);
      return undefined;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Excepción al cargar la imagen desde ${url}:`, error);
    return undefined;
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id_diagnostico: string } }
) {
  const params = context.params;
  const id_diagnostico_str = params.id_diagnostico;
  console.log(`[API POST /api/diagnosticos/${id_diagnostico_str}/send-email] - Solicitud recibida.`);

  try {
    if (!id_diagnostico_str) {
      console.warn(`[API POST /api/diagnosticos/${id_diagnostico_str}/send-email] - Error: Falta el ID del diagnóstico.`);
      return NextResponse.json({ error: 'Falta el ID del diagnóstico en la ruta.' }, { status: 400 });
    }

    const id_diagnostico = parseInt(id_diagnostico_str, 10);
    if (isNaN(id_diagnostico)) {
      console.warn(`[API POST /api/diagnosticos/${id_diagnostico_str}/send-email] - Error: El ID no es un número.`);
      return NextResponse.json({ error: 'El ID del diagnóstico debe ser un número.' }, { status: 400 });
    }

    const { recipientEmail } = await request.json();

    if (!recipientEmail) {
      console.warn(`[API POST /api/diagnosticos/${id_diagnostico}/send-email] - Error: Falta el correo del destinatario.`);
      return NextResponse.json({ error: 'Falta el correo del destinatario.' }, { status: 400 });
    }

    console.log(`[API POST /api/diagnosticos/${id_diagnostico}/send-email] - Obteniendo diagnóstico detallado...`);
    const diagnosticoRepo = await getDiagnosticoRepositoryInstance();
    const diagnosticoDetallado = await diagnosticoRepo.getDiagnosticoDetalladoById(id_diagnostico);

    if (!diagnosticoDetallado) {
      console.warn(`[API POST /api/diagnosticos/${id_diagnostico}/send-email] - Diagnóstico no encontrado.`);
      return NextResponse.json({ error: 'Diagnóstico no encontrado.' }, { status: 404 });
    }

    // Cargar la imagen si existe una URL
    let imageBuffer: Buffer | undefined;
    if (diagnosticoDetallado.imagen_url) {
      console.log(`[API POST /api/diagnosticos/${id_diagnostico}/send-email] - Cargando imagen desde ${diagnosticoDetallado.imagen_url}...`);
      imageBuffer = await loadImageBufferFromUrl(diagnosticoDetallado.imagen_url);
      if (!imageBuffer) {
        console.warn(`[API POST /api/diagnosticos/${id_diagnostico}/send-email] - No se pudo cargar la imagen para el PDF.`);
      }
    }

    // Preparar los datos para el PDF, incluyendo el buffer de la imagen
    const reportData: DiagnosisReportData = {
      patientInfo: {
        id: diagnosticoDetallado.id_paciente?.toString() || 'N/A',
        name: diagnosticoDetallado.nombre_paciente || 'N/A',
        nui: diagnosticoDetallado.nui_paciente || 'N/A',
        examDate: diagnosticoDetallado.fecha_diagnostico ? new Date(diagnosticoDetallado.fecha_diagnostico).toLocaleDateString('es-CO') : 'N/A',
        clinicalHistory: diagnosticoDetallado.ai_descripcion_detallada || undefined, // Usar la descripción detallada de la IA como historia clínica relevante para el diagnóstico
      },
      diagnosis: {
        condition: diagnosticoDetallado.resultado || undefined,
        confidence: diagnosticoDetallado.nivel_confianza || undefined,
        description: diagnosticoDetallado.ai_descripcion_detallada || undefined,
        recomendaciones: diagnosticoDetallado.recomendaciones?.map(r => r.descripcion).filter(r => r.trim() !== '') || undefined,
        pronostico: diagnosticoDetallado.ai_pronostico_tiempo_recuperacion || diagnosticoDetallado.ai_pronostico_probabilidad_mejoria ? {
          tiempo_recuperacion: diagnosticoDetallado.ai_pronostico_tiempo_recuperacion || undefined,
          probabilidad_mejoria: diagnosticoDetallado.ai_pronostico_probabilidad_mejoria || undefined,
        } : undefined,
      },
      imageFileName: diagnosticoDetallado.imagen_url ? `imagen_diagnostico_${id_diagnostico}.jpg` : undefined,
      imageBuffer: imageBuffer, // Pasar el buffer de la imagen
      examType: diagnosticoDetallado.nombre_tipo_examen || undefined,
    };

    // Generar el PDF
    console.log(`[API POST /api/diagnosticos/${id_diagnostico}/send-email] - Generando PDF...`);
    const pdfDoc = await generateDiagnosisPDF(reportData); // Pasar reportData con imageBuffer
    const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));
    const fileName = `Informe_Diagnostico_${reportData.patientInfo.name.replace(/\s/g, '_')}_${id_diagnostico}.pdf`;

    // Enviar el correo
    console.log(`[API POST /api/diagnosticos/${id_diagnostico}/send-email] - Enviando correo a ${recipientEmail}...`);
    const emailService = await getEmailServiceInstance();
    await emailService.sendDiagnosisReportEmail(recipientEmail, reportData.patientInfo.name, pdfBuffer, fileName);

    console.log(`[API POST /api/diagnosticos/${id_diagnostico}/send-email] - Correo enviado exitosamente.`);
    return NextResponse.json({ message: 'Informe diagnóstico enviado exitosamente por correo electrónico.' }, { status: 200 });

  } catch (error: any) {
    console.error(`[API POST /api/diagnosticos/${id_diagnostico_str}/send-email] - Error catastrófico:`, error);
    return NextResponse.json(
      { error: 'Error interno al enviar el informe diagnóstico.', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
