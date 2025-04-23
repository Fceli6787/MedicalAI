import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface DiagnosisReport {
  patientInfo?: {
    id: string;
    name: string;
    age: string;
    gender: string;
    examDate: string;
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
  
  // Configuración de estilos
  pdf.setFont("helvetica");
  
  // Encabezado
  pdf.setFontSize(20);
  pdf.text("SOFIA AI Medical", pageWidth / 2, 20, { align: "center" });
  pdf.setFontSize(16);
  pdf.text("Informe de Diagnóstico Médico", pageWidth / 2, 30, { align: "center" });
  
  // Información del paciente
  if (reportData.patientInfo) {
    pdf.setFontSize(12);
  pdf.text(`ID Paciente: ${reportData.patientInfo.id}`, 20, 50);
  pdf.text(`Nombre: ${reportData.patientInfo.name}`, 20, 60);
  pdf.text(`Edad: ${reportData.patientInfo.age}`, 20, 70);
  pdf.text(`Género: ${reportData.patientInfo.gender}`, 20, 80);
  pdf.text(`Fecha del examen: ${reportData.patientInfo.examDate}`, 20, 90);
  }

  // Diagnóstico
  pdf.setFontSize(14);
  pdf.text("Diagnóstico", 20, 110);
  pdf.setFontSize(12);
  pdf.text(`Condición: ${reportData.diagnosis.condition}`, 20, 120);
  pdf.text(`Nivel de confianza: ${reportData.diagnosis.confidence}%`, 20, 130);
  
  // Descripción del diagnóstico
  pdf.text("Descripción:", 20, 140);
  const splitDescription = pdf.splitTextToSize(reportData.diagnosis.description, pageWidth - 40);
  pdf.text(splitDescription, 20, 150);

  // Si hay un elemento para capturar (imagen)
  if (elementToCapture) {
    try {
      const canvas = await html2canvas(elementToCapture);
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 160;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 200, imgWidth, imgHeight);
    } catch (error) {
      console.error('Error al capturar la imagen:', error);
    }
  }

  // Pie de página
  const date = new Date().toLocaleString();
  pdf.setFontSize(10);
  pdf.text(`Generado por SOFIA AI Medical el ${date}`, pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, {
    align: "center"
  });

  return pdf;
};
