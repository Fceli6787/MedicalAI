export interface IEmailService {
  sendLoginAlertEmail(
    recipientEmail: string,
    userName: string,
    currentIp: string,
    lastLoginIp: string | null,
    loginTime: string
  ): Promise<void>;

  sendSuccessfulLoginNotification(
    recipientEmail: string,
    userName: string,
    loginIp: string,
    loginTime: string
  ): Promise<void>;
  
  sendDiagnosisReportEmail(
    recipientEmail: string,
    patientName: string,
    pdfBuffer: Buffer,
    fileName: string
  ): Promise<void>;
}
