"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.adminOnly = adminOnly;
const jwt_1 = require("../utils/jwt");
function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Access token required' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = {
            userId: payload.userId,
            tenantId: payload.tenantId,
            email: payload.email,
            role: payload.role,
        };
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
function adminOnly(req, res, next) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map