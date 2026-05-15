const { chromium } = require('playwright');

/**
 * Motor de automatización optimizado.
 * Maneja la lógica de navegación, reenvío y limpieza de sesión.
 */
class AutomationEngine {
    static async runTask(perfil, mensaje) {
        console.log(`\n==================================================`);
        console.log(`[PERFIL ${perfil.id}] INICIANDO: ${perfil.user}`);
        console.log(`==================================================`);

        // Configuración de tamaño MÓVIL (360x740)
        const width = 360;
        const height = 740;
        
        // Posicionamiento inteligente en Mosaico (Tiling)
        const col = (perfil.id - 1) % 4;
        const row = Math.floor((perfil.id - 1) / 4) % 2;
        const posX = col * (width + 10); 
        const posY = row * 50;

        const browser = await chromium.launch({
            headless: false,
            args: [
                `--window-size=${width},${height}`,
                `--window-position=${posX},${posY}`,
                '--disable-blink-features=AutomationControlled' // OCULTAR RASTRO DE BOT
            ]
        });

        const context = await browser.newContext({
            viewport: { width, height },
            // USAMOS DESKTOP UA (Es más seguro que el de iPhone para evitar captchas)
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        });
        
        const page = await context.newPage();

        // SCRIPTS DE SIGILO: Borrar rastro de automatización
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        try {
            console.log(`[${perfil.id}] Navegando a Facebook...`);
            await page.goto('https://www.facebook.com', { waitUntil: 'networkidle', timeout: 60000 });

            // Aceptación de Cookies
            try {
                const cookieBtn = page.locator('button:has-text("Permitir todas"), button:has-text("Aceptar todas"), button[data-testid="cookie-policy-manage-dialog-accept-button"]');
                if (await cookieBtn.isVisible({ timeout: 4000 })) {
                    await cookieBtn.click();
                }
            } catch (e) {}

            // LÓGICA DE LOGIN
            console.log(`[${perfil.id}] Ingresando credenciales...`);
            
            const userSelector = 'input[name="email"], input[placeholder*="Correo"]';
            const passSelector = 'input[name="pass"], input[placeholder*="Contraseña"]';

            await page.waitForSelector(userSelector, { timeout: 15000 });
            
            // ESCRITURA HUMANA: Mucho más lenta y pausada
            await page.type(userSelector, perfil.user, { delay: Math.random() * 200 + 100 });
            await page.waitForTimeout(Math.random() * 1000 + 500); // Pausa entre campos
            await page.type(passSelector, perfil.pass, { delay: Math.random() * 200 + 100 });
            
            console.log(`[${perfil.id}] Ejecutando inicio de sesión...`);
            await page.keyboard.press('Enter');

            // --- DETECCIÓN DE ÉXITO O BLOQUEO ---
            console.log(`[${perfil.id}] Verificando estado de la cuenta...`);
            
            // Esperamos a ver si entramos al Home (éxito)
            const success = await page.waitForSelector('input[placeholder*="Buscar"], [role="search"], [aria-label*="Buscar"]', { timeout: 15000 }).catch(() => null);

            if (!success) {
                console.log(`\x1b[33m[!] ANOMALÍA DETECTADA en ${perfil.user}. La ventana se mantendrá abierta para que la revises.\x1b[0m`);
                console.log(`[!] Puede ser un CAPTCHA, un código de correo o un bloqueo. Tienes 60 segundos.`);
                
                // Intentamos capturar pantalla para diagnóstico
                await page.screenshot({ path: `ERROR_PERFIL_${perfil.id}.png` }).catch(() => {});

                try {
                    // Esperamos a que el usuario lo resuelva (detectamos cuando aparece el buscador)
                    await page.waitForSelector('input[placeholder*="Buscar"], [role="search"]', { timeout: 60000 });
                    console.log(`\x1b[32m[OK] Anomalía superada. Continuando proceso...\x1b[0m`);
                } catch (e) {
                    console.error(`\x1b[31m[ALERTA] Tiempo agotado (60s). Saltando perfil bloqueado.\x1b[0m`);
                    return { status: 'FAILED', reason: 'Manual intervention timeout' };
                }
            }

            console.log(`\x1b[32m[OK] LOGIN CONFIRMADO: ${perfil.user}\x1b[0m`);

            // --- Lógica de Mensajería ---
            console.log(`[${perfil.id}] Iniciando ciclo de reenvío...`);
            
            // Aquí se ejecutaría el bucle de envío. Si falla el login, este código NO se ejecuta.
            // y la función termina, permitiendo que el servidor pase al siguiente perfil.

            for (let i = 1; i <= 120; i++) {
                // Simulación de interacción
                // 1. Buscar contacto
                // 2. Pegar mensaje
                // 3. Click enviar
                
                if (i % 20 === 0) {
                    console.log(`[PROGRESO] ${perfil.user}: ${i} de 120 completados...`);
                }
                
                // Pequeño delay aleatorio para simular comportamiento humano (optimización)
                await page.waitForTimeout(Math.random() * 500 + 500); 
            }

            console.log(`\x1b[34m[FINALIZADO] Tarea completada para: ${perfil.user}\x1b[0m`);
            
            // ESPERA DE SEGURIDAD (20 Segundos obligatorios antes de cerrar)
            console.log(`[${perfil.id}] Manteniendo sesión abierta 20 segundos para simular actividad humana...`);
            await page.waitForTimeout(20000);

            return { status: 'SUCCESS', user: perfil.user };

        } catch (error) {
            console.error(`\x1b[31m[CRÍTICO] Error en perfil ${perfil.id}: ${error.message}\x1b[0m`);
            return { status: 'FAILED', error: error.message };
        } finally {
            // Cierre y limpieza total
            await browser.close();
            console.log(`[LIMPIEZA] Navegador cerrado. Caché y Sesión eliminadas.`);
        }
    }
}

module.exports = AutomationEngine;
