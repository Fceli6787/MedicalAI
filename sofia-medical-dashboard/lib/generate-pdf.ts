import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface DiagnosisReport {
  patientInfo?: {
    id: string;
    name: string;
    age: string;
    gender: string;
    examDate: string;
    clinicalHistory?: string;
  };
  diagnosis: { // Estructura actualizada según el JSON del modelo
    diagnostico?: {
      condicion?: string;
      gravedad?: string;
      hallazgos?: string[];
    };
    recomendaciones?: string[];
    pronostico?: {
      tiempo_recuperacion?: string;
      probabilidad_mejoria?: string;
    };
    // Mantener confidence y description si aún son relevantes o eliminar si no
    confidence?: number; 
    description?: string; // Opcional: mantener si aún se usa
  };
  imageUrl?: string;
}

export const generateDiagnosisPDF = async (reportData: DiagnosisReport, elementToCapture?: HTMLElement) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  
  // Colores corporativos - Pasar valores RGB individualmente en lugar de usar spread
  const tealColor = [14, 159, 110];
  const grayColor = [107, 114, 128];
  
  // Fondo decorativo del encabezado
  pdf.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  // Encabezado
  pdf.setTextColor(255, 255, 255); // Texto blanco
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.text("SOFIA AI Medical", pageWidth / 2, 20, { align: "center" });
  pdf.setFontSize(16);
  pdf.text("Informe de Diagnóstico Médico", pageWidth / 2, 32, { align: "center" });
  
  // Línea decorativa
  pdf.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
  pdf.setLineWidth(0.5);
  pdf.line(margin, 45, pageWidth - margin, 45);
  
  // Información del paciente
  if (reportData.patientInfo) {
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Información del Paciente", margin, 60);
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    const infoY = 75;
    const colWidth = (pageWidth - (margin * 2)) / 2;
    
    // Primera columna
    pdf.text(`ID Paciente: ${reportData.patientInfo.id ?? 'N/A'}`, margin, infoY);
    pdf.text(`Nombre: ${reportData.patientInfo.name ?? 'N/A'}`, margin, infoY + 10);
    pdf.text(`Edad: ${reportData.patientInfo.age ?? 'N/A'}`, margin, infoY + 20);
    
    // Segunda columna
    pdf.text(`Género: ${reportData.patientInfo.gender ?? 'N/A'}`, margin + colWidth, infoY);
    pdf.text(`Fecha: ${reportData.patientInfo.examDate ?? 'N/A'}`, margin + colWidth, infoY + 10);
    
    // Historia clínica con borde
    if (reportData.patientInfo.clinicalHistory) {
      const historyY = infoY + 40;
      pdf.setFont("helvetica", "bold");
      pdf.text("Historia Clínica", margin, historyY);
      pdf.setFont("helvetica", "normal");
      
      // Rectángulo con borde para la historia clínica
      pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
      pdf.setLineWidth(0.1);
      const historyContent = reportData.patientInfo.clinicalHistory ?? 'N/A';
      const historyText = pdf.splitTextToSize(historyContent, pageWidth - (margin * 2));
      const historyHeight = (historyText.length * 7) + 10; // 7 puntos por línea + padding
      pdf.rect(margin, historyY + 5, pageWidth - (margin * 2), historyHeight);
      pdf.text(historyText, margin + 5, historyY + 15);
    }
  }

  // --- Sección de Diagnóstico Detallado ---
  let currentY = reportData.patientInfo?.clinicalHistory ? 160 : 130; // Posición Y inicial

  pdf.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Diagnóstico", margin, currentY);
  currentY += 15; // Espacio

  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);

  // Condición y Gravedad
  pdf.text(`Condición: ${reportData.diagnosis?.diagnostico?.condicion ?? 'N/A'}`, margin, currentY);
  pdf.text(`Gravedad: ${reportData.diagnosis?.diagnostico?.gravedad ?? 'N/A'}`, margin + (pageWidth / 2) - margin, currentY);
  currentY += 15;

  // Hallazgos
  pdf.setFont("helvetica", "bold");
  pdf.text("Hallazgos:", margin, currentY);
  currentY += 10;
  pdf.setFont("helvetica", "normal");
  if (reportData.diagnosis?.diagnostico?.hallazgos && reportData.diagnosis.diagnostico.hallazgos.length > 0) {
    reportData.diagnosis.diagnostico.hallazgos.forEach(hallazgo => {
      const splitText = pdf.splitTextToSize(`- ${hallazgo ?? 'N/A'}`, pageWidth - (margin * 2));
      pdf.text(splitText, margin, currentY);
      currentY += (splitText.length * 5) + 2; // Ajustar espacio basado en líneas
    });
  } else {
    pdf.text("- N/A", margin, currentY);
    currentY += 10;
  }
  currentY += 5; // Espacio extra

  // Recomendaciones
  pdf.setFont("helvetica", "bold");
  pdf.text("Recomendaciones:", margin, currentY);
  currentY += 10;
  pdf.setFont("helvetica", "normal");
  if (reportData.diagnosis?.recomendaciones && reportData.diagnosis.recomendaciones.length > 0) {
    reportData.diagnosis.recomendaciones.forEach(recomendacion => {
      const splitText = pdf.splitTextToSize(`- ${recomendacion ?? 'N/A'}`, pageWidth - (margin * 2));
      pdf.text(splitText, margin, currentY);
      currentY += (splitText.length * 5) + 2;
    });
  } else {
    pdf.text("- N/A", margin, currentY);
    currentY += 10;
  }
  currentY += 5; // Espacio extra

  // Pronóstico
  pdf.setFont("helvetica", "bold");
  pdf.text("Pronóstico:", margin, currentY);
  currentY += 10;
  pdf.setFont("helvetica", "normal");
  pdf.text(`Tiempo de Recuperación Estimado: ${reportData.diagnosis?.pronostico?.tiempo_recuperacion ?? 'N/A'}`, margin, currentY);
  currentY += 10;
  pdf.text(`Probabilidad de Mejoría: ${reportData.diagnosis?.pronostico?.probabilidad_mejoria ?? 'N/A'}`, margin, currentY);
  currentY += 20; // Espacio antes de la imagen

  // --- Imagen del diagnóstico ---
  const imageY = currentY; // Posición Y para la imagen
  if (elementToCapture) {
    try {
      const canvas = await html2canvas(elementToCapture);
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 160;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Añadir nueva página si la imagen no cabe
      if (imageY + imgHeight > pageHeight - 20) { // Verificar si cabe en la página actual (con margen inferior)
        pdf.addPage();
        currentY = 30; // Reiniciar Y en la nueva página
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
        pdf.text("Imagen Diagnóstica", margin, currentY);
        currentY += 10;
        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
      } else {
        pdf.addImage(imgData, 'PNG', margin, imageY, imgWidth, imgHeight);
      }
    } catch (error) {
      console.error('Error al capturar la imagen:', error);
    }
  }

  // Pie de página
  const pageCount = pdf.getNumberOfPages(); // Corregido el método
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    const date = new Date().toLocaleString();
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Generado por SOFIA AI Medical el ${date}`, pageWidth / 2, pageHeight - 10, {
      align: "center"
    });
    pdf.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 10, {
      align: "right"
    });
  }

  return pdf;
};
