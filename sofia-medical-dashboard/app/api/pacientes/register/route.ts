import { registerPacienteBasico, getConnection } from '../../../../lib/db'; // Ajusta la ruta si es necesario
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let dbClient; 
  try {
    const requestBody = await request.json();
    console.log('API /api/pacientes POST - Received request body:', JSON.stringify(requestBody, null, 2));

    const pacienteDataForDb = {
      tipoDocumentoCodigo: requestBody.tipoDocumentoCodigo,
      paisCodigo: requestBody.paisCodigo,
      primer_nombre: requestBody.primer_nombre,
      segundo_nombre: requestBody.segundo_nombre, 
      primer_apellido: requestBody.primer_apellido,
      segundo_apellido: requestBody.segundo_apellido, 
      correo: requestBody.email, // Mapeo de email a correo
      nui: requestBody.nui, 
    };

    if (!pacienteDataForDb.tipoDocumentoCodigo || 
        !pacienteDataForDb.paisCodigo || 
        !pacienteDataForDb.primer_nombre || 
        !pacienteDataForDb.primer_apellido || 
        !pacienteDataForDb.correo ||
        !pacienteDataForDb.nui ) { 
      return NextResponse.json(
        { error: 'Faltan campos requeridos para usuario. Asegúrate de enviar: tipoDocumentoCodigo, paisCodigo, nui, primer_nombre, primer_apellido, email (correo).' },
        { status: 400 }
      );
    }
    
    console.log('API /api/pacientes POST - Data being sent to registerPacienteBasico:', JSON.stringify(pacienteDataForDb, null, 2));
    
    const newPacienteUserId = await registerPacienteBasico(pacienteDataForDb);
    console.log(`API /api/pacientes POST - Usuario con id ${newPacienteUserId} registrado exitosamente.`);

    try {
        console.log(`API /api/pacientes POST - Attempting FULL insert into 'pacientes' table for userId: ${newPacienteUserId}`);
        dbClient = await getConnection(); 

        const pacienteDetails = {
            id_usuario: newPacienteUserId,
            fecha_nacimiento: requestBody.fecha_nacimiento || null, 
            genero: requestBody.genero || null,
            telefono_contacto: requestBody.telefono_contacto || null,
            direccion_residencial: requestBody.direccion_residencial || null,
            grupo_sanguineo: requestBody.grupo_sanguineo || null,
            ocupacion: requestBody.ocupacion || null,
            info_seguro_medico: requestBody.info_seguro_medico || null,
            contacto_emergencia: requestBody.contacto_emergencia || null,
            alergias: requestBody.alergias || null,
            antecedentes_medicos: requestBody.antecedentes_medicos || null,
            historial_visitas: requestBody.historial_visitas || null, 
        };

        const pacienteColumns = [
            'id_usuario', 'fecha_nacimiento', 'genero', 'telefono_contacto', 
            'direccion_residencial', 'grupo_sanguineo', 'ocupacion', 
            'info_seguro_medico', 'contacto_emergencia', 'alergias', 
            'antecedentes_medicos', 'historial_visitas'
        ];
        const pacienteParams = [
            pacienteDetails.id_usuario, pacienteDetails.fecha_nacimiento, pacienteDetails.genero,
            pacienteDetails.telefono_contacto, pacienteDetails.direccion_residencial, pacienteDetails.grupo_sanguineo,
            pacienteDetails.ocupacion, pacienteDetails.info_seguro_medico, pacienteDetails.contacto_emergencia,
            pacienteDetails.alergias, pacienteDetails.antecedentes_medicos, pacienteDetails.historial_visitas
        ];

        const pacientePlaceholders = pacienteColumns.map(() => '?').join(', ');
        const insertPacienteQuery = `INSERT INTO pacientes (${pacienteColumns.join(', ')}) VALUES (${pacientePlaceholders})`;

        console.log('API /api/pacientes POST - Query for FULL INSERT pacientes:', insertPacienteQuery);
        console.log('API /api/pacientes POST - Params for FULL INSERT pacientes:', JSON.stringify(pacienteParams, null, 2));

        await dbClient.sql(insertPacienteQuery, ...pacienteParams);
        console.log(`API /api/pacientes POST - FULL insert into 'pacientes' successful for userId: ${newPacienteUserId}`);

    } catch (pacienteInsertError: any) {
        console.error(`API /api/pacientes POST - Error during FULL insert into 'pacientes' table for userId ${newPacienteUserId}:`, pacienteInsertError.message, pacienteInsertError.stack);
        return NextResponse.json({ 
            error: 'Usuario creado, pero falló la inserción de detalles completos del paciente.', 
            details: pacienteInsertError.message,
            userId: newPacienteUserId 
        }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Paciente registrado exitosamente (usuario y detalles)', userId: newPacienteUserId }, { status: 201 });

  } catch (error: any) {
    console.error('Error in API /api/pacientes POST (main try-catch):', error.message, error.stack); 
    
    if (error.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json(
            { error: 'El correo electrónico o NUI ya están registrados.' },
            { status: 409 } 
        );
    }
    if (error.message.includes('FOREIGN KEY constraint failed')) {
        return NextResponse.json(
            { error: 'Error de referencia en la base de datos (ej. tipo de documento o país no válido).' },
            { status: 400 }
        );
    }
    if (error.message.includes('no encontrado') || error.message.includes('Failed to retrieve new user ID')) {
        return NextResponse.json(
            { error: error.message }, 
            { status: 400 }
        );
    }
    if (error.message.includes('NOT NULL constraint failed')) {
        return NextResponse.json(
            { error: `Un campo requerido no fue proporcionado o fue nulo. Detalle: ${error.message}` },
            { status: 400 }
        );
    }
    if (error.message.includes('Wrong number of parameters')) {
        return NextResponse.json(
            { error: 'Error interno del driver de base de datos al procesar parámetros.', details: error.message }, 
            { status: 500 }
        );
    }
    // Captura específica para errores de conexión que pueden venir de getConnection o dbClient.sql
    if (error.errorCode === 'ERR_CONNECTION_ERROR' || error.message.toLowerCase().includes('connection error') || error.message.toLowerCase().includes('econreset')) {
        console.error('API /api/pacientes POST - Database Connection Error:', error.message, error.stack, error.cause);
        return NextResponse.json({ error: 'Error de conexión con la base de datos.', details: error.message }, { status: 503 }); // 503 Service Unavailable
    }

    return NextResponse.json({ error: 'Error interno del servidor al registrar paciente.', details: error.message }, { status: 500 });
  } 
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const searchQuery = searchParams.get('search');
  let dbClient;

  if (searchQuery) {
    // Lógica para buscar pacientes
    console.log(`API /api/pacientes GET - Buscando pacientes con término: "${searchQuery}"`);
    try {
      dbClient = await getConnection();
      
      // Consulta para buscar en múltiples campos de la tabla 'usuarios'
      // Asegúrate de que las columnas primer_nombre, primer_apellido, nui, correo existen en tu tabla 'usuarios'
      // y que tienes índices en ellas para un buen rendimiento.
      const searchTerm = `%${searchQuery}%`; // Para búsquedas parciales con LIKE
      
      // La consulta une usuarios con pacientes para obtener todos los datos necesarios.
      // Se asume que quieres devolver id_paciente (que es u.id_usuario), nombre, apellido y documento.
      // Ajusta los campos seleccionados según lo que necesite tu frontend.
      const query = `
        SELECT 
          u.id_usuario as id_paciente, 
          u.primer_nombre as nombre, 
          u.primer_apellido as apellido, 
          u.nui as documento 
        FROM usuarios u
        LEFT JOIN pacientes p ON u.id_usuario = p.id_usuario -- LEFT JOIN por si aún no existe entrada en 'pacientes'
        WHERE u.primer_nombre LIKE ? 
           OR u.primer_apellido LIKE ? 
           OR u.nui LIKE ? 
           OR u.correo LIKE ?
        LIMIT 10; -- Limitar el número de resultados
      `;
      // Los parámetros deben coincidir con el número de '?' en la consulta
      const pacientes = await dbClient.sql(query, [searchTerm, searchTerm, searchTerm, searchTerm]);
      
      console.log(`API /api/pacientes GET - Encontrados ${pacientes?.length || 0} pacientes.`);
      return NextResponse.json(pacientes || [], { status: 200 });

    } catch (error: any) {
      console.error(`API /api/pacientes GET - Error buscando pacientes con término "${searchQuery}":`, error.message, error.stack);
      // Captura específica para errores de conexión
      if (error.errorCode === 'ERR_CONNECTION_ERROR' || error.message.toLowerCase().includes('connection error') || error.message.toLowerCase().includes('econreset')) {
        console.error('API /api/pacientes GET - Database Connection Error during search:', error.message, error.stack, error.cause);
        return NextResponse.json({ error: 'Error de conexión con la base de datos al buscar pacientes.', details: error.message }, { status: 503 });
      }
      return NextResponse.json({ error: 'Error al buscar pacientes.', details: error.message }, { status: 500 });
    }
  } else {
    // Lógica existente para obtener tipos de documento y países
    console.log('API /api/pacientes GET - Obteniendo datos para selectores de formulario (tiposDocumento, paises).');
    try {
      dbClient = await getConnection();
      const tiposDocumentoResult = await dbClient.sql(`SELECT id_tipo_documento, codigo, descripcion FROM tiposdocumento WHERE estado = 1`);
      const paisesResult = await dbClient.sql(`SELECT id_pais, codigo, nombre FROM paises WHERE estado = 1`);
      
      // Asegurarse de que los resultados sean arrays, incluso si están vacíos.
      const tiposDocumento = Array.isArray(tiposDocumentoResult) ? tiposDocumentoResult : [];
      const paises = Array.isArray(paisesResult) ? paisesResult : [];

      console.log(`API /api/pacientes GET - Devolviendo ${tiposDocumento.length} tipos de documento y ${paises.length} países.`);
      return NextResponse.json({ tiposDocumento, paises }, { status: 200 });

    } catch (error: any) {
      console.error('API /api/pacientes GET - Error obteniendo tiposDocumento o paises:', error.message, error.stack);
       // Captura específica para errores de conexión
      if (error.errorCode === 'ERR_CONNECTION_ERROR' || error.message.toLowerCase().includes('connection error') || error.message.toLowerCase().includes('econreset')) {
        console.error('API /api/pacientes GET - Database Connection Error fetching form data:', error.message, error.stack, error.cause);
        return NextResponse.json({ error: 'Error de conexión con la base de datos al obtener datos de formulario.', details: error.message }, { status: 503 });
      }
      return NextResponse.json({ error: 'Error al obtener datos para los selectores del formulario.', details: error.message }, { status: 500 });
    }
  }
}
