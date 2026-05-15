const express = require('express');
const AutomationEngine = require('./automation_engine');
const perfiles = require('./config.json');

const path = require('path');
const fs = require('fs');

const app = express();
// Soporte para JSON y Texto Plano (para archivos TXT directos)
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' })); 
app.use(express.static('public')); 

// Variables globales para el estado
let globalMessage = "Hola, este es un mensaje automático de estudio.";

// Clave de acceso para tu API
const API_KEY = "clave_estudio_mosivo_2024";

/**
 * Endpoint para subir TXT de perfiles
 * Formato esperado: usuario:contraseña o usuario,contraseña
 */
app.post('/api/v1/upload-profiles', (req, res) => {
    // Si viene como texto plano o JSON
    const rawData = typeof req.body === 'string' ? req.body : req.body.rawData;
    
    if (!rawData) return res.status(400).send('No hay datos recibidos');

    const lines = rawData.split(/\r?\n/);
    const newProfiles = lines.map((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return null;

        let parts = [];
        if (trimmedLine.includes(':')) {
            const firstColon = trimmedLine.indexOf(':');
            parts = [trimmedLine.substring(0, firstColon), trimmedLine.substring(firstColon + 1)];
        } else if (trimmedLine.includes(',')) {
            const firstComma = trimmedLine.indexOf(',');
            parts = [trimmedLine.substring(0, firstComma), trimmedLine.substring(firstComma + 1)];
        }

        if (parts.length >= 2) {
            return {
                id: index + 1,
                user: parts[0].trim(),
                pass: parts[1].trim()
            };
        }
        return null;
    }).filter(p => p !== null);

    // ESCRIBIR EL ARCHIVO DE INMEDIATO
    fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(newProfiles, null, 2), 'utf8');
    
    console.log(`\x1b[32m[SISTEMA] ¡EXITO! Se han guardado ${newProfiles.length} perfiles nuevos.\x1b[0m`);
    res.json({ success: true, count: newProfiles.length });
});

/**
 * Endpoint para actualizar el mensaje
 */
app.post('/api/v1/update-message', (req, res) => {
    const { mensaje } = req.body;
    globalMessage = mensaje;
    res.json({ success: true, message: globalMessage });
});

/**
 * Ruta para disparar la automatización masiva en PARALELO
 */
app.post('/api/v1/iniciar-automatizacion', async (req, res) => {
    const { threads = 3 } = req.body; // Por defecto 3 hilos (ventanas)
    const currentProfiles = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

    console.log(`\n\x1b[35m>>> INICIANDO TRABAJO EN PARALELO: ${threads} VENTANAS\x1b[0m`);
    console.log(`>>> Total perfiles: ${currentProfiles.length}`);

    res.json({ 
        success: true, 
        message: `Automatización iniciada con ${threads} hilos.`,
        total: currentProfiles.length 
    });

    // Dividir los perfiles en grupos (chunks) según el número de hilos
    const chunkSize = Math.ceil(currentProfiles.length / threads);
    const chunks = [];
    for (let i = 0; i < currentProfiles.length; i += chunkSize) {
        chunks.push(currentProfiles.slice(i, i + chunkSize));
    }

    // Ejecutar cada grupo en su propia "línea" (paralelo)
    Promise.all(chunks.map(async (group, workerId) => {
        console.log(`[HILO ${workerId + 1}] Iniciado con ${group.length} perfiles.`);
        for (const perfil of group) {
            await AutomationEngine.runTask(perfil, globalMessage);
        }
    })).then(() => {
        console.log('\n\x1b[32m>>> ¡TODOS LOS HILOS HAN FINALIZADO SU TRABAJO!\x1b[0m');
    });
});

/**
 * Ruta de estado
 */
app.get('/api/v1/status', (req, res) => {
    res.json({ online: true, version: "1.0.0", profiles_loaded: perfiles.length });
});

const PORT = 3001; // Cambiamos a 3001 para evitar conflictos

const server = app.listen(PORT, () => {
    console.log(`\n\x1b[36m**************************************************`);
    console.log(`*  SERVIDOR DE AUTOMATIZACIÓN ACTIVADO           *`);
    console.log(`*  Puerto: ${PORT}                                  *`);
    console.log(`*  API Key: ${API_KEY}                 *`);
    console.log(`*  URL: http://localhost:${PORT}               *`);
    console.log(`**************************************************\x1b[0m\n`);
});

// Manejo de errores de puerto ocupado
server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`\x1b[31m[ERROR] El puerto ${PORT} está ocupado. Intenta cerrar otros programas.\x1b[0m`);
    } else {
        console.error(`\x1b[31m[ERROR DEL SERVIDOR] ${e.message}\x1b[0m`);
    }
});

// Captura de errores inesperados para que no se cierre en silencio
process.on('uncaughtException', (err) => {
    console.error(`\x1b[31m[ERROR CRÍTICO] Ocurrió un error inesperado:\x1b[0m`, err.message);
    console.error(err.stack);
});
