const AutomationEngine = require('./automation_engine');
const perfiles = require('./config.json');

/**
 * Ejecutor Masivo (Bulk Runner)
 * Recorre todos los perfiles de config.json uno por uno.
 * Si uno falla, lo reporta y continúa con el siguiente de forma automática.
 */
const startBulkProcess = async () => {
    console.log(`\n\x1b[36m>>> INICIANDO PROCESO MASIVO DE ESTUDIO (${perfiles.length} perfiles)\x1b[0m`);
    console.log(`\x1b[36m>>> Los fallos se notificarán y el sistema saltará al siguiente automáticamente.\x1b[0m\n`);

    for (const perfil of perfiles) {
        try {
            const result = await AutomationEngine.runTask(perfil, "Mensaje de prueba");
            
            if (result.status === 'FAILED') {
                console.log(`\x1b[33m[SISTEMA] Perfil ${perfil.id} falló. Saltando al siguiente en 3 segundos...\x1b[0m`);
                await new Promise(r => setTimeout(r, 3000));
            } else {
                console.log(`\x1b[32m[SISTEMA] Perfil ${perfil.id} completado con éxito.\x1b[0m`);
            }
        } catch (err) {
            console.error(`\x1b[31m[CRÍTICO] Error inesperado en perfil ${perfil.id}: ${err.message}\x1b[0m`);
        }
    }

    console.log(`\n\x1b[36m>>> PROCESO FINALIZADO. Todos los perfiles han sido procesados.\x1b[0m`);
    process.exit(0);
};

startBulkProcess();
