const express = require('express');
const path = require('path');
const fs = require('fs');
const AutomationEngine = require('./automation_engine');

const DATA_DIR = process.env.AUTOMATION_DATA_DIR || path.join(__dirname, 'data');
const LEGACY_CONFIG_PATH = process.env.PROFILE_DATA_FILE || path.join(DATA_DIR, 'config.json');
const DEFAULT_MESSAGE = 'Hola, este es un mensaje automático de estudio.';
const tenantStates = new Map();

function getTenantDataDir(tenantId) {
    return path.join(DATA_DIR, 'tenants', tenantId);
}

function getTenantConfigPath(tenantId) {
    return path.join(getTenantDataDir(tenantId), 'config.json');
}

function ensureTenantStorage(tenantId) {
    const tenantDataDir = getTenantDataDir(tenantId);
    const configPath = getTenantConfigPath(tenantId);
    fs.mkdirSync(tenantDataDir, { recursive: true });

    if (!fs.existsSync(configPath)) {
        const legacyTenantId = process.env.AUTOMATION_LEGACY_TENANT_ID;
        if (legacyTenantId === tenantId && fs.existsSync(LEGACY_CONFIG_PATH)) {
            fs.copyFileSync(LEGACY_CONFIG_PATH, configPath);
        } else {
            fs.writeFileSync(configPath, '[]', 'utf8');
        }
    }
    return tenantDataDir;
}

function readProfiles(tenantId) {
    ensureTenantStorage(tenantId);
    const profiles = JSON.parse(fs.readFileSync(getTenantConfigPath(tenantId), 'utf8'));
    return Array.isArray(profiles) ? profiles : [];
}

function writeProfiles(tenantId, profiles) {
    ensureTenantStorage(tenantId);
    fs.writeFileSync(getTenantConfigPath(tenantId), JSON.stringify(profiles, null, 2), 'utf8');
}

function getTenantState(tenantId) {
    if (!tenantStates.has(tenantId)) {
        tenantStates.set(tenantId, {
            message: DEFAULT_MESSAGE,
            running: false,
            stopping: false,
            runSequence: 0,
            activeRunId: 0,
            activeThreads: 0,
        });
    }
    return tenantStates.get(tenantId);
}

function parseProfileLine(line, id) {
    const trimmedLine = String(line).trim();
    if (!trimmedLine) return null;

    const separator = trimmedLine.match(/[:;,|\t]/);
    let user = '';
    let pass = '';
    if (separator && separator.index > 0) {
        user = trimmedLine.substring(0, separator.index).trim();
        pass = trimmedLine.substring(separator.index + 1).trim();
    } else {
        const parts = trimmedLine.split(/\s{2,}|\s+/);
        if (parts.length >= 2) {
            user = parts[0].trim();
            pass = parts.slice(1).join(' ').trim();
        }
    }

    return user && pass ? { id, user, pass } : null;
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' }));
app.use(express.static('public'));

app.use('/api/v1', (req, res, next) => {
    const expectedKey = process.env.AUTOMATION_API_KEY;
    const isHealthProbe = req.method === 'GET' && req.path === '/status' && !req.get('x-api-key');
    if (isHealthProbe) return next();

    if (!expectedKey) {
        return res.status(503).json({ success: false, error: 'Automation API is not configured' });
    }
    if (req.get('x-api-key') !== expectedKey) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const tenantId = req.get('x-tenant-id');
    if (!tenantId || !/^[a-zA-Z0-9_-]{1,128}$/.test(tenantId)) {
        return res.status(400).json({ success: false, error: 'Valid tenant context is required' });
    }
    req.tenantId = tenantId;
    next();
});

app.post('/api/v1/upload-profiles', (req, res) => {
    const rawData = typeof req.body === 'string' ? req.body : req.body?.rawData;
    if (!rawData) return res.status(400).json({ success: false, error: 'No hay datos recibidos' });

    const profiles = String(rawData)
        .replace(/^\uFEFF/, '')
        .replace(/\u0000/g, '')
        .split(/\r\n|\r|\n/)
        .map((line, index) => parseProfileLine(line, index + 1))
        .filter(Boolean);

    writeProfiles(req.tenantId, profiles);
    res.json({ success: true, count: profiles.length });
});

app.post('/api/v1/agregar-usuario', (req, res) => {
    const user = typeof req.body?.user === 'string' ? req.body.user.trim() : '';
    const pass = typeof req.body?.pass === 'string' ? req.body.pass.trim() : '';
    if (!user || !pass) {
        return res.status(400).json({ success: false, error: 'Faltan usuario o contraseña' });
    }

    const currentProfiles = readProfiles(req.tenantId);
    if (currentProfiles.some(profile => profile.user === user)) {
        return res.status(409).json({ success: false, error: 'El usuario ya existe' });
    }

    const profile = { id: currentProfiles.length + 1, user, pass };
    writeProfiles(req.tenantId, [...currentProfiles, profile]);
    res.json({ success: true, profile: { id: profile.id, user: profile.user } });
});

app.post('/api/v1/agregar-lista', (req, res) => {
    const text = typeof req.body?.text === 'string' ? req.body.text : '';
    if (!text) return res.status(400).json({ success: false, error: 'Faltan datos de texto' });

    const currentProfiles = readProfiles(req.tenantId);
    const existingUsers = new Set(currentProfiles.map(profile => profile.user));
    const newProfiles = [];
    const invalidSamples = [];
    let duplicateCount = 0;
    let invalidCount = 0;

    String(text).replace(/^\uFEFF/, '').replace(/\u0000/g, '').split(/\r\n|\r|\n/).forEach((line) => {
        if (!String(line).trim()) return;
        const profile = parseProfileLine(line, currentProfiles.length + newProfiles.length + 1);
        if (!profile) {
            invalidCount += 1;
            if (invalidSamples.length < 8) invalidSamples.push(String(line).trim().substring(0, 80));
            return;
        }
        if (existingUsers.has(profile.user)) {
            duplicateCount += 1;
            return;
        }
        existingUsers.add(profile.user);
        newProfiles.push(profile);
    });

    if (newProfiles.length) writeProfiles(req.tenantId, [...currentProfiles, ...newProfiles]);
    const totalNow = currentProfiles.length + newProfiles.length;
    res.json({
        success: newProfiles.length > 0 || (duplicateCount > 0 && invalidCount === 0),
        imported: newProfiles.length,
        duplicates: duplicateCount,
        invalid: invalidCount,
        invalidSamples,
        totalNow,
    });
});

app.post('/api/v1/limpiar-lista', (req, res) => {
    const tenantDataDir = ensureTenantStorage(req.tenantId);
    writeProfiles(req.tenantId, []);
    fs.writeFileSync(path.join(tenantDataDir, '.last_id.txt'), '0', 'utf8');
    res.json({ success: true, message: 'Lista limpiada correctamente', cleared: true });
});

app.post('/api/v1/login-guilla', async (req, res) => {
    const user = typeof req.body?.user === 'string' ? req.body.user.trim() : '';
    const pass = typeof req.body?.pass === 'string' ? req.body.pass.trim() : '';
    if (!user || !pass) {
        return res.status(400).json({ success: false, error: 'Faltan usuario o contraseña' });
    }

    try {
        const profile = readProfiles(req.tenantId).find(candidate => candidate.user === user);
        if (!profile) return res.status(404).json({ success: false, error: 'Perfil no encontrado' });

        const tenantDataDir = ensureTenantStorage(req.tenantId);
        const result = await AutomationEngine.runTask(
            { ...profile, pass },
            'Mensaje de prueba',
            0,
            1,
            () => false,
            tenantDataDir,
            req.tenantId,
        );
        if (result.status !== 'SUCCESS') {
            return res.status(500).json({ success: false, error: 'Error en el login' });
        }

        res.json({ success: true, message: 'Login exitoso y sesión guardada', profileUser: user });
    } catch (error) {
        console.error(`[SISTEMA] Error en login individual: ${error.message}`);
        res.status(500).json({ success: false, error: 'Error interno' });
    }
});

app.post('/api/v1/update-message', (req, res) => {
    const message = typeof req.body?.mensaje === 'string' ? req.body.mensaje.trim() : '';
    if (!message) return res.status(400).json({ success: false, error: 'Mensaje requerido' });
    const state = getTenantState(req.tenantId);
    state.message = message;
    res.json({ success: true, message: state.message });
});

app.post('/api/v1/iniciar-automatizacion', (req, res) => {
    const state = getTenantState(req.tenantId);
    if (state.running || state.stopping) {
        return res.status(409).json({
            success: false,
            error: state.stopping ? 'La automatización se está deteniendo' : 'Ya existe una automatización en ejecución',
        });
    }

    const threads = Math.max(1, Math.min(2, Number.parseInt(req.body?.threads, 10) || 1));
    const profiles = readProfiles(req.tenantId);
    if (!profiles.length) return res.status(400).json({ success: false, error: 'No hay perfiles cargados' });

    const chunkSize = Math.ceil(profiles.length / threads);
    const chunks = [];
    for (let index = 0; index < profiles.length; index += chunkSize) {
        chunks.push(profiles.slice(index, index + chunkSize));
    }

    const runId = ++state.runSequence;
    state.activeRunId = runId;
    state.running = true;
    state.activeThreads = chunks.length;
    const tenantDataDir = ensureTenantStorage(req.tenantId);
    const tenantId = req.tenantId;

    res.json({ success: true, message: `Automatización iniciada con ${threads} hilos.`, total: profiles.length });

    Promise.all(chunks.map(async (group, workerId) => {
        for (const profile of group) {
            if (state.activeRunId !== runId) break;
            await AutomationEngine.runTask(
                profile,
                state.message,
                workerId,
                chunks.length,
                () => state.activeRunId !== runId,
                tenantDataDir,
                tenantId,
            );
        }
    })).catch((error) => {
        console.error(`[SISTEMA] Falló la ejecución del tenant ${tenantId}: ${error.message}`);
    }).finally(() => {
        if (state.activeRunId === runId) {
            state.activeRunId = 0;
            state.running = false;
            state.activeThreads = 0;
        }
    });
});

app.post('/api/v1/detener-automatizacion', async (req, res) => {
    const state = getTenantState(req.tenantId);
    if (!state.running && !state.stopping) {
        return res.json({ success: true, stopped: 0, message: 'La automatización ya estaba detenida' });
    }

    state.stopping = true;
    state.activeRunId = 0;
    try {
        const stopped = await AutomationEngine.stopAll(req.tenantId);
        state.running = false;
        state.activeThreads = 0;
        res.json({ success: true, stopped, message: 'Automatización detenida' });
    } catch (error) {
        console.error(`[SISTEMA] Error al detener automatización: ${error.message}`);
        res.status(500).json({ success: false, error: 'No se pudo detener la automatización' });
    } finally {
        state.stopping = false;
    }
});

app.get('/api/v1/status', (req, res) => {
    if (!req.tenantId) {
        return res.json({ online: true, version: '1.2.0' });
    }
    const state = getTenantState(req.tenantId);
    res.json({
        online: true,
        version: '1.2.0',
        profiles_loaded: readProfiles(req.tenantId).length,
        running: state.running,
        stopping: state.stopping,
        threads: state.activeThreads,
        browsers: AutomationEngine.getActiveBrowserCount(req.tenantId),
    });
});

const PORT = Number.parseInt(process.env.PORT, 10) || 3002;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SISTEMA] Servidor de automatización activo en el puerto ${PORT}`);
});

server.on('error', (error) => {
    console.error(`[SISTEMA] Error del servidor: ${error.message}`);
});

process.on('uncaughtException', (error) => {
    console.error(`[SISTEMA] Error no controlado: ${error.message}`);
});
