import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface DiagnosisReport {
  patientInfo?: {
    id: string;
    name: string;
    age: string;
    gender: string;
    examDate: string;
    clinicalHistory?: string;  // Añadido historia clínica
  };
  diagnosis: {
    condition: string;
    confidence: number;
    description: string;
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
    pdf.text(`ID Paciente: ${reportData.patientInfo.id}`, margin, infoY);
    pdf.text(`Nombre: ${reportData.patientInfo.name}`, margin, infoY + 10);
    pdf.text(`Edad: ${reportData.patientInfo.age}`, margin, infoY + 20);
    
    // Segunda columna
    pdf.text(`Género: ${reportData.patientInfo.gender}`, margin + colWidth, infoY);
    pdf.text(`Fecha: ${reportData.patientInfo.examDate}`, margin + colWidth, infoY + 10);
    
    // Historia clínica con borde
    if (reportData.patientInfo.clinicalHistory) {
      const historyY = infoY + 40;
      pdf.setFont("helvetica", "bold");
      pdf.text("Historia Clínica", margin, historyY);
      pdf.setFont("helvetica", "normal");
      
      // Rectángulo con borde para la historia clínica
      pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
      pdf.setLineWidth(0.1);
      const historyText = pdf.splitTextToSize(reportData.patientInfo.clinicalHistory, pageWidth - (margin * 2));
      const historyHeight = (historyText.length * 7) + 10; // 7 puntos por línea + padding
      pdf.rect(margin, historyY + 5, pageWidth - (margin * 2), historyHeight);
      pdf.text(historyText, margin + 5, historyY + 15);
    }
  }

  // Sección de diagnóstico
  const diagY = reportData.patientInfo?.clinicalHistory ? 160 : 130;
  pdf.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Diagnóstico", margin, diagY);
  
  // Recuadro para el diagnóstico principal
  pdf.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, diagY + 10, pageWidth - (margin * 2), 30);
  
  // Contenido del diagnóstico
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.setFontSize(14);
  pdf.text(reportData.diagnosis.condition, margin + 5, diagY + 25);
  pdf.setFontSize(12);
  pdf.text(`Nivel de confianza: ${reportData.diagnosis.confidence}%`, margin + 5, diagY + 35);
  
  // Descripción del diagnóstico
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("Descripción Detallada", margin, diagY + 55);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  const splitDescription = pdf.splitTextToSize(reportData.diagnosis.description, pageWidth - (margin * 2));
  pdf.text(splitDescription, margin, diagY + 70);

  // Imagen del diagnóstico
  if (elementToCapture) {
    try {
      const canvas = await html2canvas(elementToCapture);
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 160;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Añadir nueva página si la imagen no cabe
      if (diagY + 100 + imgHeight > pageHeight) {
        pdf.addPage();
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
        pdf.text("Imagen Diagnóstica", margin, 30);
        pdf.addImage(imgData, 'PNG', margin, 40, imgWidth, imgHeight);
      } else {
        pdf.addImage(imgData, 'PNG', margin, diagY + 100, imgWidth, imgHeight);
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
