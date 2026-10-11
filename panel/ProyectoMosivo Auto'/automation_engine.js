const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const activeBrowsers = new Set();

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
];

const VIEWPORTS = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
];

const STEALTH_SCRIPTS = `
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    delete navigator.__proto__.webdriver;

    const fakePlugins = {
        0: { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1 },
        1: { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '', length: 1 },
        2: { name: 'Native Client', filename: 'internal-nacl-plugin', description: '', length: 2 },
        length: 3,
        item: function(i) { return this[i]; },
        namedItem: function(name) { return Object.values(this).find(p => p && p.name === name); },
        refresh: function() {}
    };
    Object.defineProperty(navigator, 'plugins', { get: () => fakePlugins });
    Object.defineProperty(navigator, 'languages', { get: () => ['es-ES', 'es', 'en-US', 'en'] });
    Object.defineProperty(navigator, 'language', { get: () => 'es-ES' });

    window.chrome = {
        runtime: {
            connect: function() { return { onMessage: { addListener: function() {} } }; },
            sendMessage: function() {}
        },
        loadTimes: function() { return {}; },
        csi: function() { return {}; }
    };

    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type) {
        if (type === 'image/webp') return origToDataURL.apply(this, arguments);
        const context = this.getContext('2d');
        if (context) {
            const shift = { r: Math.floor(Math.random() * 10) - 5, g: Math.floor(Math.random() * 10) - 5, b: Math.floor(Math.random() * 10) - 5 };
            const w = this.width, h = this.height;
            if (w && h) {
                const imageData = context.getImageData(0, 0, w, h);
                for (let i = 0; i < imageData.data.length; i += 4) {
                    imageData.data[i] += shift.r;
                    imageData.data[i + 1] += shift.g;
                    imageData.data[i + 2] += shift.b;
                }
                context.putImageData(imageData, 0, 0);
            }
        }
        return origToDataURL.apply(this, arguments);
    };

    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'Intel Inc.';
        if (parameter === 37446) return 'Intel Iris OpenGL Engine';
        return getParameter.call(this, parameter);
    };

    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 });
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 + Math.floor(Math.random() * 5) });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
    Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });

    if (typeof Notification !== 'undefined') {
        Object.defineProperty(Notification, 'permission', { get: () => 'default' });
    }
`;

class HumanBehavior {
    static normalDelay(mean = 100, stdDev = 30) {
        const u1 = Math.random();
        const u2 = Math.random();
        const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return Math.max(0, mean + stdDev * normal);
    }

    static async humanType(page, text) {
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === ' ') {
                await page.keyboard.type(char, { delay: HumanBehavior.normalDelay(100, 30) });
                await page.waitForTimeout(HumanBehavior.normalDelay(200, 70));
                continue;
            }
            const baseDelay = 80 + Math.random() * 120;
            const pauseChance = Math.random();
            if (pauseChance < 0.08) {
                await page.waitForTimeout(HumanBehavior.normalDelay(400, 150));
            } else if (pauseChance < 0.12) {
                await page.waitForTimeout(HumanBehavior.normalDelay(700, 200));
            }
            await page.keyboard.type(char, { delay: baseDelay });
            if (Math.random() < 0.04) {
                await page.waitForTimeout(HumanBehavior.normalDelay(250, 100));
            }
        }
    }

    static async moveMouseHuman(page, startX, startY, endX, endY) {
        const steps = 20 + Math.floor(Math.random() * 15);
        const cp1x = startX + (endX - startX) * 0.25 + (Math.random() - 0.5) * 150;
        const cp1y = startY + (endY - startY) * 0.25 + (Math.random() - 0.5) * 150;
        const cp2x = startX + (endX - startX) * 0.75 + (Math.random() - 0.5) * 150;
        const cp2y = startY + (endY - startY) * 0.75 + (Math.random() - 0.5) * 150;

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const ease = t * t * (3 - 2 * t);
            const x = Math.pow(1 - ease, 3) * startX + 3 * Math.pow(1 - ease, 2) * ease * cp1x +
                      3 * (1 - ease) * Math.pow(ease, 2) * cp2x + Math.pow(ease, 3) * endX;
            const y = Math.pow(1 - ease, 3) * startY + 3 * Math.pow(1 - ease, 2) * ease * cp1y +
                      3 * (1 - ease) * Math.pow(ease, 2) * cp2y + Math.pow(ease, 3) * endY;
            await page.mouse.move(x, y);
            await page.waitForTimeout(HumanBehavior.normalDelay(12, 4));
        }
    }

    static async humanClick(page, selector) {
        const element = await page.$(selector);
        if (!element) return false;
        const box = await element.boundingBox();
        if (!box) return false;
        const viewport = page.viewportSize();
        const startX = Math.random() * (viewport?.width || 800);
        const startY = Math.random() * (viewport?.height || 600);
        const targetX = box.x + box.width * (0.25 + Math.random() * 0.5);
        const targetY = box.y + box.height * (0.25 + Math.random() * 0.5);
        await HumanBehavior.moveMouseHuman(page, startX, startY, targetX, targetY);
        await page.waitForTimeout(HumanBehavior.normalDelay(100, 40));
        await page.mouse.click(targetX, targetY);
        await page.waitForTimeout(HumanBehavior.normalDelay(120, 40));
        return true;
    }

    static async humanScroll(page, direction = 'down', amount = 3) {
        const scrollAmount = direction === 'down' ? 120 : -120;
        const viewport = page.viewportSize();
        const centerX = viewport.width / 2;
        const centerY = viewport.height / 2;
        for (let i = 0; i < amount; i++) {
            const delta = scrollAmount * (0.6 + Math.random() * 0.8);
            await page.mouse.move(centerX + (Math.random() - 0.5) * 150, centerY + (Math.random() - 0.5) * 150);
            await page.mouse.wheel(0, delta);
            await page.waitForTimeout(HumanBehavior.normalDelay(350, 120));
        }
    }

    static async randomPause(page, minMs = 1500, maxMs = 4000) {
        const pauseType = Math.random();
        if (pauseType < 0.25) {
            await page.waitForTimeout(HumanBehavior.normalDelay((minMs + maxMs) / 2, 600));
        } else if (pauseType < 0.5) {
            const viewport = page.viewportSize();
            await HumanBehavior.moveMouseHuman(page,
                Math.random() * viewport.width, Math.random() * viewport.height,
                Math.random() * viewport.width, Math.random() * viewport.height
            );
            await page.waitForTimeout(HumanBehavior.normalDelay(600, 250));
        } else {
            await HumanBehavior.humanScroll(page, Math.random() > 0.5 ? 'down' : 'up', 1);
            await page.waitForTimeout(HumanBehavior.normalDelay(900, 350));
        }
    }

    static async interactWithRandomElements(page) {
        const actions = [
            async () => await HumanBehavior.humanScroll(page, 'down', 2),
            async () => {
                const viewport = page.viewportSize();
                for (let i = 0; i < 3; i++) {
                    await HumanBehavior.moveMouseHuman(page,
                        Math.random() * viewport.width, Math.random() * viewport.height,
                        Math.random() * viewport.width, Math.random() * viewport.height
                    );
                    await page.waitForTimeout(HumanBehavior.normalDelay(250, 120));
                }
            }
        ];
        await actions[Math.floor(Math.random() * actions.length)]();
    }
}

class AutomationEngine {
    static async runTask(perfil, mensaje, windowIndex = 0, windowCount = 1, shouldStop = () => false, tenantDataDir, tenantId = 'default') {
        console.log(`\n==================================================`);
        console.log(`[PERFIL ${perfil.id}] INICIANDO: ${perfil.user}`);
        console.log(`==================================================`);

        const isDocker = process.env.DISPLAY === ':99';
        const viewport = VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];
        const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        const dataDir = tenantDataDir || process.env.AUTOMATION_DATA_DIR || __dirname;

        const profileDir = path.join(dataDir, `profile_${perfil.id}`);
        fs.mkdirSync(profileDir, { recursive: true });

        await new Promise(r => setTimeout(r, windowIndex * (2000 + Math.random() * 3000)));

        const isChromium = !fs.existsSync('/usr/bin/google-chrome') && !fs.existsSync('/usr/bin/chromium');

        const browser = await chromium.launchPersistentContext(profileDir, {
            headless: false,
            viewport: { width: viewport.width - 20, height: viewport.height - 80 },
            userAgent: userAgent,
            locale: 'es-ES',
            timezoneId: 'Europe/Madrid',
            deviceScaleFactor: 1,
            hasTouch: false,
            javaScriptEnabled: true,
            bypassCSP: false,
            ignoreHTTPSErrors: false,
            colorScheme: 'light',
            extraHTTPHeaders: {
                'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
                'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
            },
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-infobars',
                '--disable-extensions',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-component-update',
                '--disable-background-networking',
                '--disable-sync',
                '--disable-translate',
                '--metrics-recording-only',
                '--password-store=basic',
                '--use-mock-keychain',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--lang=es-ES',
                ...(isDocker ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] : [])
            ]
        });

        const browserEntry = { browser, tenantId };
        activeBrowsers.add(browserEntry);

        try {
            if (shouldStop()) {
                return { status: 'STOPPED' };
            }

            const page = browser.pages()[0] || await browser.newPage();
            await page.addInitScript(STEALTH_SCRIPTS);

            await page.waitForTimeout(HumanBehavior.normalDelay(2000, 600));

            console.log(`[${perfil.id}] Navegando a Facebook...`);
            await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(HumanBehavior.normalDelay(3000, 800));

            const viewportSize = page.viewportSize();
            await HumanBehavior.moveMouseHuman(page,
                Math.random() * viewportSize.width, Math.random() * viewportSize.height,
                viewportSize.width / 2 + (Math.random() - 0.5) * 200,
                viewportSize.height / 2 + (Math.random() - 0.5) * 200
            );
            await page.waitForTimeout(HumanBehavior.normalDelay(1500, 400));

            console.log(`[${perfil.id}] Ingresando credenciales...`);

            const userSelectors = ['input[name="email"]', 'input[placeholder*="Correo"]', 'input[placeholder*="email"]', '#email'];
            const passSelectors = ['input[name="pass"]', 'input[placeholder*="Contraseña"]', 'input[placeholder*="password"]', '#pass'];

            let userSelector = null;
            for (const sel of userSelectors) {
                if (await page.$(sel)) { userSelector = sel; break; }
            }
            let passSelector = null;
            for (const sel of passSelectors) {
                if (await page.$(sel)) { passSelector = sel; break; }
            }

            if (!userSelector || !passSelector) {
                console.error(`\x1b[31m[${perfil.id}] No se encontraron campos de login.\x1b[0m`);
                await page.screenshot({ path: path.join(dataDir, `ERROR_LOGIN_${perfil.id}.png`) }).catch(() => {});
                return { status: 'FAILED', reason: 'Login fields not found' };
            }

            await HumanBehavior.humanClick(page, userSelector);
            await page.waitForTimeout(HumanBehavior.normalDelay(400, 120));
            await HumanBehavior.humanType(page, perfil.user);

            await page.waitForTimeout(HumanBehavior.normalDelay(500, 150));
            await page.keyboard.press('Tab');
            await page.waitForTimeout(HumanBehavior.normalDelay(300, 100));
            await HumanBehavior.humanType(page, perfil.pass);

            await page.waitForTimeout(HumanBehavior.normalDelay(2000, 500));

            console.log(`[${perfil.id}] Ejecutando inicio de sesión...`);

            const loginBtn = await page.$('button[name="login"], button[type="submit"], input[type="submit"]');
            if (loginBtn) {
                await HumanBehavior.humanClick(page, 'button[name="login"], button[type="submit"], input[type="submit"]');
            } else {
                await page.keyboard.press('Enter');
            }

            console.log(`[${perfil.id}] Verificando estado de la cuenta...`);
            await page.waitForTimeout(HumanBehavior.normalDelay(5000, 1500));

            const url = page.url();
            const currentUrl = url;

            if (currentUrl.includes('checkpoint') || currentUrl.includes('two_step_verification') || currentUrl.includes('captcha')) {
                console.log(`\x1b[33m[!] CAPTCHA/BLOQUEO detectado en ${perfil.user}.URL: ${currentUrl}\x1b[0m`);
                await page.screenshot({ path: path.join(dataDir, `CAPTCHA_${perfil.id}.png`) }).catch(() => {});

                try {
                    await page.waitForSelector(
                        'input[placeholder*="Buscar"], [role="search"], [aria-label*="Buscar"], [data-pagelet="Feed"]',
                        { timeout: 120000 }
                    );
                    console.log(`\x1b[32m[OK] CAPTCHA superado manualmente.\x1b[0m`);
                } catch (e) {
                    console.error(`\x1b[31m[ALERTA] Tiempo agotado en CAPTCHA. Saltando.\x1b[0m`);
                    return { status: 'FAILED', reason: 'CAPTCHA timeout' };
                }
            }

            const success = await page.waitForSelector(
                'input[placeholder*="Buscar"], [role="search"], [aria-label*="Buscar"], [data-pagelet="Feed"], [data-pagelet="LEFT_NAV"]',
                { timeout: 20000 }
            ).catch(() => null);

            if (!success && !currentUrl.includes('checkpoint')) {
                console.log(`\x1b[33m[!] ANOMALÍA en ${perfil.user}. URL: ${currentUrl}\x1b[0m`);
                await page.screenshot({ path: path.join(dataDir, `ERROR_${perfil.id}.png`) }).catch(() => {});
                return { status: 'FAILED', reason: 'Login failed' };
            }

            console.log(`\x1b[32m[OK] LOGIN CONFIRMADO: ${perfil.user}\x1b[0m`);
            await HumanBehavior.randomPause(page, 3000, 6000);
            await HumanBehavior.interactWithRandomElements(page);

            console.log(`[${perfil.id}] Tarea completada para: ${perfil.user}`);
            await page.waitForTimeout(HumanBehavior.normalDelay(5000, 2000));

            return { status: 'SUCCESS', user: perfil.user };

        } catch (error) {
            if (shouldStop()) {
                return { status: 'STOPPED' };
            }
            console.error(`\x1b[31m[CRÍTICO] Error en perfil ${perfil.id}: ${error.message}\x1b[0m`);
            return { status: 'FAILED', error: error.message };
        } finally {
            activeBrowsers.delete(browserEntry);
            await browser.close().catch(() => {});
            console.log(`[LIMPIEZA] Navegador cerrado.`);
        }
    }

    static async stopAll(tenantId) {
        const matchingBrowsers = [...activeBrowsers].filter(entry => !tenantId || entry.tenantId === tenantId);
        for (const entry of matchingBrowsers) {
            await entry.browser.close().catch(() => {});
            activeBrowsers.delete(entry);
        }
        return matchingBrowsers.length;
    }

    static getActiveBrowserCount(tenantId) {
        if (!tenantId) return activeBrowsers.size;
        return [...activeBrowsers].filter(entry => entry.tenantId === tenantId).length;
    }
}

module.exports = AutomationEngine;
