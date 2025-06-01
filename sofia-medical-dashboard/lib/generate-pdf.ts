import jsPDF from 'jspdf';

export interface DiagnosisReportData {
  patientInfo: {
    id: string; // ID del paciente
    name: string; // Nombre completo
    nui: string; // NUI/Documento
    examDate: string; // Fecha del examen
    clinicalHistory?: string; // Historia clínica (opcional)
  };
  diagnosis: { // Usa la estructura plana de DiagnosticoResult
    condition?: string;
    confidence?: number; 
    description?: string; // Hallazgos adicionales
    recomendaciones?: string[];
    pronostico?: {
      tiempo_recuperacion?: string;
      probabilidad_mejoria?: string;
    };
  };
  imageFileName?: string; // Nombre del archivo de imagen (opcional)
  imageBuffer?: Buffer; // Buffer de la imagen para incluir directamente
  examType?: string; // Tipo de examen (opcional)
}

export const generateDiagnosisPDF = async (reportData: DiagnosisReportData) => {
  const pdf = new jsPDF({
      orientation: 'p', // portrait
      unit: 'pt', // points
      format: 'a4' // A4 size page
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 50; // Margen en puntos (más espacio que antes)
  const contentWidth = pageWidth - margin * 2;
  let currentY = 0; // Track Y position

  // Colores (usar valores RGB directamente)
  const tealColorRgb = [14, 159, 110];
  const grayColorRgb = [107, 114, 128];
  const lightGrayColorRgb = [229, 231, 235]; // Para bordes suaves
  const whiteColorRgb = [255, 255, 255];
  const blackColorRgb = [0, 0, 0];

  // --- Encabezado ---
  pdf.setFillColor(tealColorRgb[0], tealColorRgb[1], tealColorRgb[2]);
  pdf.rect(0, 0, pageWidth, 70, 'F'); // Fondo del encabezado más alto
  pdf.setTextColor(whiteColorRgb[0], whiteColorRgb[1], whiteColorRgb[2]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22); // Tamaño ajustado
  pdf.text("SOFIA AI Medical", pageWidth / 2, 35, { align: "center" });
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "normal");
  pdf.text("Informe de Diagnóstico Médico Asistido", pageWidth / 2, 55, { align: "center" });
  currentY = 90; // Posición inicial después del encabezado

  // --- Información del Paciente ---
  pdf.setTextColor(blackColorRgb[0], blackColorRgb[1], blackColorRgb[2]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("Información del Paciente", margin, currentY);
  currentY += 20; // Espacio

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10); // Tamaño de fuente más pequeño para detalles
  
  // Usar dos columnas para la información básica
  const col1X = margin;
  const col2X = margin + contentWidth / 2 + 10; // Ajustar espacio entre columnas
  const startYPatientInfo = currentY;

  pdf.setFont("helvetica", "bold");
  pdf.text("ID Paciente:", col1X, currentY);
  pdf.setFont("helvetica", "normal");
  pdf.text(reportData.patientInfo.id ?? 'N/A', col1X + 70, currentY); // Ajustar posición del valor

  pdf.setFont("helvetica", "bold");
  pdf.text("Nombre:", col1X, currentY + 15);
  pdf.setFont("helvetica", "normal");
  pdf.text(reportData.patientInfo.name ?? 'N/A', col1X + 70, currentY + 15);

  pdf.setFont("helvetica", "bold");
  pdf.text("Documento (NUI):", col2X, currentY);
  pdf.setFont("helvetica", "normal");
  pdf.text(reportData.patientInfo.nui ?? 'N/A', col2X + 95, currentY); // Ajustar posición

  pdf.setFont("helvetica", "bold");
  pdf.text("Fecha Examen:", col2X, currentY + 15);
  pdf.setFont("helvetica", "normal");
  pdf.text(reportData.patientInfo.examDate ?? 'N/A', col2X + 95, currentY + 15);

  currentY += 35; // Espacio después de la info básica

  // Historia Clínica (Opcional)
  if (reportData.patientInfo.clinicalHistory) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Historia Clínica Relevante:", margin, currentY);
    currentY += 15;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    
    // Caja para la historia clínica
    pdf.setDrawColor(lightGrayColorRgb[0], lightGrayColorRgb[1], lightGrayColorRgb[2]);
    pdf.setLineWidth(0.5);
    const historyText = pdf.splitTextToSize(reportData.patientInfo.clinicalHistory, contentWidth - 10); // Ancho menos padding
    const historyBoxHeight = (historyText.length * (10 * 1.15)) + 10; // Alto basado en líneas + padding
    pdf.rect(margin, currentY, contentWidth, historyBoxHeight, 'S'); // 'S' para solo borde
    pdf.text(historyText, margin + 5, currentY + 12); // Texto con padding
    currentY += historyBoxHeight + 15; // Espacio después de la historia
  }

  // --- Línea Separadora ---
  pdf.setDrawColor(lightGrayColorRgb[0], lightGrayColorRgb[1], lightGrayColorRgb[2]);
  pdf.setLineWidth(1);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 20;

  // --- Resultados del Diagnóstico ---
  pdf.setTextColor(tealColorRgb[0], tealColorRgb[1], tealColorRgb[2]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("Resultados del Análisis por IA", margin, currentY);
  currentY += 20;

  pdf.setTextColor(blackColorRgb[0], blackColorRgb[1], blackColorRgb[2]);
  pdf.setFontSize(10);

  // *** CORRECCIÓN: Acceder a los datos del diagnóstico directamente ***
  pdf.setFont("helvetica", "bold");
  pdf.text("Condición Principal:", margin, currentY);
  pdf.setFont("helvetica", "normal");
  pdf.text(reportData.diagnosis.condition ?? 'No especificada', margin + 100, currentY); // Ajustar posición valor
  currentY += 15;

  if (reportData.diagnosis.confidence !== undefined) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Confianza IA:", margin, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${(reportData.diagnosis.confidence * 100).toFixed(1)}%`, margin + 100, currentY);
    currentY += 15;
  }

  // Descripción / Hallazgos Adicionales
  if (reportData.diagnosis.description) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Descripción/Hallazgos:", margin, currentY);
    currentY += 12;
    pdf.setFont("helvetica", "normal");
    const descText = pdf.splitTextToSize(reportData.diagnosis.description, contentWidth);
    pdf.text(descText, margin, currentY);
    currentY += (descText.length * (10 * 1.15)) + 5; // Ajustar espacio
  }

  // Recomendaciones
  if (reportData.diagnosis.recomendaciones && reportData.diagnosis.recomendaciones.length > 0) {
    currentY += 10; // Espacio antes de recomendaciones
    pdf.setFont("helvetica", "bold");
    pdf.text("Recomendaciones Sugeridas:", margin, currentY);
    currentY += 12;
    pdf.setFont("helvetica", "normal");
    reportData.diagnosis.recomendaciones.forEach(rec => {
      const recText = pdf.splitTextToSize(`• ${rec ?? 'N/A'}`, contentWidth - 10); // Añadir viñeta
      pdf.text(recText, margin + 5, currentY); // Indentar texto
      currentY += (recText.length * (10 * 1.15)); 
    });
    currentY += 5; // Espacio después
  }

  // Pronóstico
  if (reportData.diagnosis.pronostico) {
    currentY += 10; // Espacio antes de pronóstico
    pdf.setFont("helvetica", "bold");
    pdf.text("Pronóstico Estimado:", margin, currentY);
    currentY += 12;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Tiempo Recuperación: ${reportData.diagnosis.pronostico.tiempo_recuperacion ?? 'N/A'}`, margin + 5, currentY);
    currentY += 12;
    pdf.text(`Probabilidad Mejoría: ${reportData.diagnosis.pronostico.probabilidad_mejoria ?? 'N/A'}`, margin + 5, currentY);
    currentY += 15; // Espacio después
  }
  
  currentY += 10; // Espacio antes de la imagen

  // --- Imagen del diagnóstico ---
  if (reportData.imageBuffer) {
    try {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(blackColorRgb[0], blackColorRgb[1], blackColorRgb[2]);
      pdf.text("Imagen Diagnóstica:", margin, currentY);
      currentY += 15;

      const imgData = reportData.imageBuffer;
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = contentWidth * 0.6; // Ancho de imagen (60% del contenido)
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      const imgX = margin + (contentWidth - imgWidth) / 2; // Centrar imagen

      // Verificar si la imagen cabe en la página actual
      if (currentY + imgHeight > pageHeight - margin - 20) { // Margen inferior + espacio para pie
        pdf.addPage();
        currentY = margin; // Reiniciar Y en la nueva página
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(blackColorRgb[0], blackColorRgb[1], blackColorRgb[2]);
        pdf.text("Imagen Diagnóstica:", margin, currentY);
        currentY += 15;
      }
      
      // Determinar el formato de la imagen. Asumimos JPEG o PNG.
      // jsPDF puede inferir el tipo si el buffer es correcto.
      pdf.addImage(imgData, 'JPEG', imgX, currentY, imgWidth, imgHeight); // Asumimos JPEG, se puede mejorar la detección
      currentY += imgHeight + 15; // Actualizar Y después de la imagen

    } catch (error) {
      console.error('Error al añadir la imagen al PDF:', error);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(255, 0, 0); // Rojo para error
      pdf.text("Error al cargar la imagen.", margin, currentY);
      currentY += 15;
    }
  }


  // --- Pie de página ---
  const pageCount = pdf.getNumberOfPages(); 
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    const date = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }); // Formato local
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(grayColorRgb[0], grayColorRgb[1], grayColorRgb[2]);
    
    // Línea superior del pie de página
    pdf.setDrawColor(lightGrayColorRgb[0], lightGrayColorRgb[1], lightGrayColorRgb[2]);
    pdf.setLineWidth(0.5);
    pdf.line(margin, pageHeight - margin + 10, pageWidth - margin, pageHeight - margin + 10);

    pdf.text(`Generado por SOFIA AI Medical el ${date}`, margin, pageHeight - margin + 25);
    pdf.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - margin + 25, {
      align: "right"
    });
  }

  return pdf;
};
