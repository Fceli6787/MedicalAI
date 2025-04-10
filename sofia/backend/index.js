require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar multer para almacenamiento de archivos
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 1024 * 1024 * 10 // 10MB max
  }
});

// Crear directorio uploads si no existe
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://openrouter.ai'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'MedicalAI',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de conexiones MySQL
const pool = mysql.createPool(dbConfig);

// Verificar conexión a la base de datos
pool.getConnection()
  .then(conn => {
    console.log('Conexión a MySQL establecida');
    conn.release();
  })
  .catch(err => {
    console.error('Error conectando a MySQL:', err);
    process.exit(1);
  });

// Rutas básicas de autenticación
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre_usuario, nombre_completo, email, password } = req.body;
    
    // Validar campos requeridos
    if (!email || !password || !nombre_completo) {
      return res.status(400).json({ error: 'Nombre completo, email y contraseña son requeridos' });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear usuario en MySQL
    const [result] = await pool.execute(
      'INSERT INTO Usuarios (nombre_usuario, nombre_completo, correo) VALUES (?, ?, ?)',
      [nombre_usuario || '', nombre_completo, email]
    );

    // Crear credenciales
    await pool.execute(
      'INSERT INTO Credenciales (id_usuario, password) VALUES (?, ?)',
      [result.insertId, hashedPassword]
    );

    // Registrar autenticación local
    await pool.execute(
      'INSERT INTO Autenticacion (id_usuario, proveedor_autenticacion) VALUES (?, ?)',
      [result.insertId, 'local']
    );

    res.status(201).json({ 
      success: true,
      user: {
        id: result.insertId,
        email,
        name: nombre_completo
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario por email
    const [users] = await pool.execute(
      `SELECT U.id_usuario as id, U.nombre_completo as name, U.correo as email, 
       C.password as password_hash 
       FROM Usuarios U
       JOIN Credenciales C ON U.id_usuario = C.id_usuario
       WHERE U.correo = ?`, 
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = users[0];

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Crear token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET || 'secret_key', 
      { expiresIn: '24h' }
    );

    // Configurar cookie HTTP-only
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      sameSite: 'lax'
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

app.get('/api/auth/check', async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.json({ authenticated: false });
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');

    // Buscar usuario en la base de datos
    const [users] = await pool.execute(
      `SELECT U.id_usuario as id, U.nombre_completo as name, U.correo as email
       FROM Usuarios U 
       WHERE U.id_usuario = ?`,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Error verificando sesión:', error);
    res.json({ authenticated: false });
  }
});

// Ruta para subida de archivos
app.post('/api/upload', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos' });
    }

    const processedFiles = await Promise.all(
      req.files.map(async (file) => {
        const fileExt = path.extname(file.originalname).toLowerCase();
        const fileName = `${file.filename}${fileExt}`;
        const filePath = path.join('uploads', fileName);
        
        // Mover archivo del temp al directorio uploads
        fs.renameSync(file.path, filePath);

        // Extraer texto e imágenes de PDFs
        if (fileExt === '.pdf') {
          const dataBuffer = fs.readFileSync(filePath);
          
          // Extraer texto
          const pdfData = await pdf(dataBuffer);
          
          // Extraer imágenes
          const pdfDoc = await PDFDocument.load(dataBuffer);
          const images = [];
          const pages = pdfDoc.getPages();
          
          for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const embeddedImages = await page.getEmbeddedImages();
            
            for (const [name, image] of embeddedImages) {
              const imageBytes = await image.embed();
              const imageName = `img_${Date.now()}_${i}_${name}.png`;
              const imagePath = path.join('uploads', imageName);
              
              try {
                // Convertir a buffer y optimizar tamaño con sharp
                const imageBuffer = Buffer.from(imageBytes);
                const processedImage = await sharp(imageBuffer)
                  .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                  .toFormat('png')
                  .toBuffer();
                
                fs.writeFileSync(imagePath, processedImage);
                
                images.push({
                  url: `/uploads/${imageName}`,
                  originalName: name
                });
              } catch (err) {
                console.error('Error procesando imagen del PDF:', err);
                // Guardar imagen original si falla el procesamiento
                fs.writeFileSync(imagePath, Buffer.from(imageBytes));
                images.push({
                  url: `/uploads/${imageName}`,
                  originalName: name
                });
              }
            }
          }
          
          return {
            type: 'pdf',
            url: `/uploads/${fileName}`,
            text: pdfData.text,
            images: images,
            originalName: file.originalname
          };
        }
        
        // Para imágenes normales, devolver la URL directamente
        return {
          type: 'image',
          url: `/uploads/${fileName}`,
          originalName: file.originalname
        };
      })
    );

    res.json(processedFiles);
  } catch (error) {
    console.error('Error al procesar archivos:', error);
    res.status(500).json({ error: 'Error al procesar archivos' });
  }
});

// Servir archivos estáticos
app.use('/uploads', express.static('uploads'));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
