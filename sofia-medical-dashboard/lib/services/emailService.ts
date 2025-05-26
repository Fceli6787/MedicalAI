import nodemailer from 'nodemailer';
import { IEmailService } from './interfaces/IEmailService';

// Configuración del transportador de correo
// Se recomienda usar un servicio de envío de correos como SendGrid, Mailgun, etc.
// Las credenciales deben estar en las variables de entorno.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // No rechazar certificados auto-firmados. Útil para desarrollo, pero no recomendado en producción.
    // rejectUnauthorized: false, 
  },
});

console.log('[Email Service] Nodemailer Transporter Configured:');
console.log(`- Host: ${process.env.EMAIL_HOST}`);
console.log(`- Port: ${process.env.EMAIL_PORT}`);
console.log(`- Secure: ${process.env.EMAIL_SECURE}`);
console.log(`- User: ${process.env.EMAIL_USER ? '*****' : 'NOT SET'}`); // Ocultar la contraseña
console.log(`- From: ${process.env.EMAIL_FROM}`);

export class EmailService implements IEmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor(transporterInstance: nodemailer.Transporter, fromEmail: string) {
    this.transporter = transporterInstance;
    this.fromEmail = fromEmail;
  }

  private getEmailTemplate(
    title: string,
    content: string,
    buttonText?: string,
    buttonUrl?: string,
    alertType: 'warning' | 'success' = 'warning'
  ): string {
    const alertColor = alertType === 'warning' ? '#f59e0b' : '#10b981';
    const alertBgColor = alertType === 'warning' ? '#fef3c7' : '#d1fae5';
    
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; padding: 20px 0;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Sofia Medical Dashboard</h1>
                  <p style="color: rgba(255, 255, 255, 0.9); margin: 12px 0 0 0; font-size: 16px;">Sistema de Gestión Médica</p>
                </td>
              </tr>
              
              <!-- Alert Banner -->
              <tr>
                <td style="background-color: ${alertBgColor}; padding: 20px 30px; border-left: 4px solid ${alertColor};">
                  <div style="display: flex; align-items: center;">
                    <span style="font-size: 20px; margin-right: 12px;">${alertType === 'warning' ? '⚠️' : '✅'}</span>
                    <h2 style="color: #1f2937; margin: 0; font-size: 20px; font-weight: 600;">${title}</h2>
                  </div>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${content}
                </td>
              </tr>
              
              ${buttonText && buttonUrl ? `
              <!-- Button -->
              <tr>
                <td style="padding: 0 30px 40px;">
                  <div style="text-align: center;">
                    <a href="${buttonUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.39); transition: all 0.3s ease;">${buttonText}</a>
                  </div>
                </td>
              </tr>
              ` : ''}
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">
                    Este correo fue enviado automáticamente por el sistema de seguridad de Sofia Medical Dashboard.
                  </p>
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <p style="color: white; margin: 0; font-size: 16px; font-weight: 600;">
                      🤖 ¿Conoces Sofia Medical AI?
                    </p>
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">
                      Descubre nuestra inteligencia artificial diseñada especialmente para profesionales médicos. 
                      Optimiza tu práctica con asistencia inteligente y análisis avanzados.
                    </p>
                  </div>
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                      © 2024 Sofia Medical Dashboard. Todos los derechos reservados.<br>
                      Si tienes preguntas, contacta a nuestro equipo de soporte.
                    </p>
                  </div>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  }

  async sendLoginAlertEmail(
    recipientEmail: string,
    userName: string,
    currentIp: string,
    lastLoginIp: string | null,
    loginTime: string
  ): Promise<void> {
    const subject = '🔐 Alerta de Seguridad: Inicio de Sesión desde Nueva Ubicación';
    const text = `
      Hola ${userName},

      Hemos detectado un inicio de sesión en tu cuenta de Sofia Medical Dashboard desde una nueva dirección IP.

      Detalles del inicio de sesión:
      - Hora: ${loginTime}
      - Dirección IP actual: ${currentIp}
      ${lastLoginIp ? `- Última IP conocida: ${lastLoginIp}` : ''}

      Si fuiste tú, puedes ignorar este mensaje.
      Si no fuiste tú, por favor, cambia tu contraseña inmediatamente y considera habilitar la autenticación de múltiples factores (MFA) para mayor seguridad.

      Puedes cambiar tu contraseña aquí: [Enlace a la página de cambio de contraseña]
      Puedes habilitar MFA aquí: [Enlace a la página de configuración de MFA]

      Gracias,
      El equipo de Sofia Medical Dashboard
    `;

    const content = `
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
        Hola <strong style="color: #1f2937;">${userName}</strong>,
      </p>
      
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
        Hemos detectado un inicio de sesión en tu cuenta desde una nueva dirección IP. Por tu seguridad, te notificamos de esta actividad.
      </p>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #f59e0b;">
        <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">📋 Detalles del Inicio de Sesión</h3>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 140px;">🕐 Fecha y Hora:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${loginTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">🌐 IP Actual:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-family: 'Courier New', monospace; background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; display: inline-block;">${currentIp}</td>
          </tr>
          ${lastLoginIp ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">📍 Última IP:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-family: 'Courier New', monospace; background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; display: inline-block;">${lastLoginIp}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #fbbf24;">
        <h4 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">🔒 ¿Qué hacer ahora?</h4>
        <p style="color: #92400e; margin: 0 0 16px 0; font-size: 14px;">
          <strong>Si fuiste tú:</strong> Puedes ignorar este mensaje de forma segura.
        </p>
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          <strong>Si NO fuiste tú:</strong> Te recomendamos tomar estas acciones inmediatamente:
        </p>
        <ul style="color: #92400e; margin: 12px 0 0 0; padding-left: 20px; font-size: 14px;">
          <li style="margin-bottom: 8px;">Cambiar tu contraseña inmediatamente</li>
          <li style="margin-bottom: 8px;">Habilitar la autenticación de múltiples factores (MFA)</li>
          <li>Revisar la actividad reciente en tu cuenta</li>
        </ul>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0;">
        Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar a nuestro equipo de soporte.
      </p>
    `;

    const html = this.getEmailTemplate(
      'Alerta de Seguridad Detectada',
      content,
      'Cambiar Contraseña',
      '[Enlace a la página de cambio de contraseña]',
      'warning'
    );

    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to: recipientEmail,
        subject: subject,
        text: text,
        html: html,
      });
      console.log(`[Email Service] Alerta de inicio de sesión enviada a ${recipientEmail}. Message ID: ${info.messageId}`);
      console.log(`[Email Service] Preview URL (if using Ethereal): ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      console.error(`[Email Service] Error al enviar correo de alerta a ${recipientEmail}:`, error);
      if (error instanceof Error) {
        console.error(`[Email Service] Error details: ${error.message}`);
      }
    }
  }

  async sendSuccessfulLoginNotification(
    recipientEmail: string,
    userName: string,
    loginIp: string,
    loginTime: string
  ): Promise<void> {
    const subject = '✅ Inicio de Sesión Exitoso - Sofia Medical Dashboard';
    const text = `
      Hola ${userName},

      Tu cuenta de Sofia Medical Dashboard ha iniciado sesión exitosamente.

      Detalles del inicio de sesión:
      - Hora: ${loginTime}
      - Dirección IP: ${loginIp}

      Si fuiste tú, puedes ignorar este mensaje.
      Si no fuiste tú, por favor, cambia tu contraseña inmediatamente y contacta a soporte si crees que tu cuenta ha sido comprometida.

      Gracias,
      El equipo de Sofia Medical Dashboard
    `;

    const content = `
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
        Hola <strong style="color: #1f2937;">${userName}</strong>,
      </p>
      
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
        ¡Perfecto! Tu cuenta de Sofia Medical Dashboard ha iniciado sesión exitosamente. Esta es una notificación de confirmación por tu seguridad.
      </p>

      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #10b981;">
        <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">📋 Detalles del Acceso</h3>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 140px;">🕐 Fecha y Hora:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${loginTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">🌐 Dirección IP:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-family: 'Courier New', monospace; background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; display: inline-block;">${loginIp}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">✅ Estado:</td>
            <td style="padding: 8px 0; color: #059669; font-weight: 600;">Acceso Autorizado</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #60a5fa;">
        <h4 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">🛡️ Mantén tu Cuenta Segura</h4>
        <p style="color: #1e40af; margin: 0 0 16px 0; font-size: 14px;">
          <strong>Si fuiste tú:</strong> Todo está en orden, puedes continuar usando la plataforma normalmente.
        </p>
        <p style="color: #1e40af; margin: 0; font-size: 14px;">
          <strong>Si NO fuiste tú:</strong> Cambia tu contraseña inmediatamente y contacta a nuestro equipo de soporte.
        </p>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0;">
        Gracias por confiar en Sofia Medical Dashboard para la gestión de tu práctica médica.
      </p>
    `;

    const html = this.getEmailTemplate(
      'Acceso Confirmado',
      content,
      undefined,
      undefined,
      'success'
    );

    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to: recipientEmail,
        subject: subject,
        text: text,
        html: html,
      });
      console.log(`[Email Service] Notificación de inicio de sesión exitoso enviada a ${recipientEmail}. Message ID: ${info.messageId}`);
      console.log(`[Email Service] Preview URL (if using Ethereal): ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      console.error(`[Email Service] Error al enviar notificación de inicio de sesión exitoso a ${recipientEmail}:`, error);
      if (error instanceof Error) {
        console.error(`[Email Service] Error details: ${error.message}`);
      }
    }
  }
}

// Exportar una instancia del servicio para uso directo si es necesario,
// o inyectarla donde se requiera la abstracción IEmailService.
// Eliminada la instancia global para favorecer la inyección de dependencias
