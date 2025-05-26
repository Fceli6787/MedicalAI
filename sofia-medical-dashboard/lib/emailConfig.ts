import nodemailer from 'nodemailer';

// Configuración del transporter de Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('[Email Config] Nodemailer Transporter Configured:');
console.log(`- Host: ${process.env.EMAIL_HOST}`);
console.log(`- Port: ${process.env.EMAIL_PORT}`);
console.log(`- Secure: ${process.env.EMAIL_SECURE}`);
console.log(`- User: ${process.env.EMAIL_USER ? '*****' : 'NOT SET'}`);
console.log(`- From: ${process.env.EMAIL_FROM}`);

export { transporter };