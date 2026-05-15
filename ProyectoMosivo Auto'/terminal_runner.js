const AutomationEngine = require('./automation_engine');
const perfiles = require('./config.json');

/**
 * Script ejecutor para múltiples terminales.
 * Permite ejecutar un perfil específico desde la línea de comandos.
 * Uso: node terminal_runner.js [ID_DEL_PERFIL]
 */

const main = async () => {
    const perfilId = process.argv[2];

    if (!perfilId) {
        console.error("\x1b[31m[ERROR] Debes proporcionar el ID del perfil.\x1b[0m");
        console.log("Uso: node terminal_runner.js <ID>");
        console.log("IDs disponibles:", perfiles.map(p => p.id).join(', '));
        process.exit(1);
    }

    const perfil = perfiles.find(p => p.id == perfilId);

    if (!perfil) {
        console.error(`\x1b[31m[ERROR] No se encontró el perfil con ID: ${perfilId}\x1b[0m`);
        process.exit(1);
    }

    const mensajePredeterminado = "Hola, este es un mensaje automático desde mi entorno de estudio.";
    
    // Ejecutar
    await AutomationEngine.runTask(perfil, mensajePredeterminado);
    
    process.exit(0);
};

main();
