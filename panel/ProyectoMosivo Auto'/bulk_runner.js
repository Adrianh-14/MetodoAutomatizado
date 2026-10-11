const AutomationEngine = require('./automation_engine');
const perfiles = require('./config.json');

/**
 * Función para generar delays humanos realistas
 */
function humanDelay(mean = 2000, stdDev = 500) {
    const u1 = Math.random();
    const u2 = Math.random();
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(500, mean + stdDev * normal);
}

/**
 * Función para delay adaptativo según hora del día
 */
function getAdaptiveDelay() {
    const hour = new Date().getHours();
    
    if (hour >= 0 && hour < 6) return humanDelay(8000, 2000); // Madrugada: más lento
    if (hour >= 6 && hour < 9) return humanDelay(4000, 1000); // Mañana temprano
    if (hour >= 9 && hour < 12) return humanDelay(2500, 700); // Mañana: normal
    if (hour >= 12 && hour < 14) return humanDelay(3500, 800); // Mediodía
    if (hour >= 14 && hour < 18) return humanDelay(2000, 500); // Tarde: rápido
    if (hour >= 18 && hour < 21) return humanDelay(3000, 700); // Noche
    return humanDelay(6000, 1500); // Noche tarde: más lento
}

/**
 * Ejecutor Masivo (Bulk Runner) con comportamiento humano
 * Recorre todos los perfiles de config.json uno por uno.
 * Si uno falla, lo reporta y continúa con el siguiente de forma automática.
 */
const startBulkProcess = async () => {
    console.log(`\n\x1b[36m>>> INICIANDO PROCESO MASIVO DE ESTUDIO (${perfiles.length} perfiles)\x1b[0m`);
    console.log(`\x1b[36m>>> Los fallos se notificarán y el sistema saltará al siguiente automáticamente.\x1b[0m`);
    console.log(`\x1b[36m>>> Modo humano activado: delays variables según hora del día.\x1b[0m\n`);

    let completedCount = 0;
    let failedCount = 0;

    for (const perfil of perfiles) {
        try {
            // Delay humano entre perfiles
            const delay = getAdaptiveDelay();
            console.log(`\x1b[90m[ESPERA] Siguiente perfil en ${(delay / 1000).toFixed(1)} segundos...\x1b[0m`);
            await new Promise(r => setTimeout(r, delay));

            const result = await AutomationEngine.runTask(perfil, "Mensaje de prueba");
            
            if (result.status === 'FAILED') {
                failedCount++;
                console.log(`\x1b[33m[SISTEMA] Perfil ${perfil.id} falló. Saltando al siguiente...\x1b[0m`);
                // Delay más corto en fallos (como si el usuario estuviera apurado)
                await new Promise(r => setTimeout(r, humanDelay(2000, 500)));
            } else if (result.status === 'SUCCESS') {
                completedCount++;
                console.log(`\x1b[32m[SISTEMA] Perfil ${perfil.id} completado con éxito. (${completedCount}/${perfiles.length})\x1b[0m`);
            }
        } catch (err) {
            failedCount++;
            console.error(`\x1b[31m[CRÍTICO] Error inesperado en perfil ${perfil.id}: ${err.message}\x1b[0m`);
        }
    }

    console.log(`\n\x1b[36m>>> PROCESO FINALIZADO.\x1b[0m`);
    console.log(`\x1b[36m>>> Completados: ${completedCount} | Fallidos: ${failedCount} | Total: ${perfiles.length}\x1b[0m`);
    process.exit(0);
};

startBulkProcess();
