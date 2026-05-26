"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const cookies_routes_1 = __importDefault(require("./routes/cookies.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const forms_routes_1 = __importDefault(require("./routes/forms.routes"));
const facebook_routes_1 = __importDefault(require("./routes/facebook.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
async function main() {
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://metodo-automatizado.vercel.app',
        'https://metodo-automatizado-t38r-kazv7j5bv-adrien1138gmailcoms-projects.vercel.app',
        ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ];
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: '50mb' }));
    app.get('/api/health', (_req, res) => {
        res.json({
            status: 'ok',
            service: 'millonesgang-api',
            timestamp: new Date().toISOString()
        });
    });
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/dashboard', dashboard_routes_1.default);
    app.use('/api/cookies', cookies_routes_1.default);
    app.use('/api/users', users_routes_1.default);
    app.use('/api/forms', forms_routes_1.default);
    app.use('/api/facebook', facebook_routes_1.default);
    // Proxy - ESM-only module, must be dynamically imported
    const { createProxyMiddleware } = await Promise.resolve().then(() => __importStar(require('http-proxy-middleware')));
    app.use('/automation', createProxyMiddleware({
        target: 'http://localhost:3002',
        changeOrigin: true,
        pathRewrite: { '^/automation': '' },
    }));
    app.use(errorHandler_1.errorHandler);
    app.listen(PORT, () => {
        console.log('');
        console.log('╔══════════════════════════════════════════════╗');
        console.log('║        🔥 MILLONESGANG API SERVER 🔥        ║');
        console.log('╠══════════════════════════════════════════════╣');
        console.log(`║  Port:     ${PORT}                              ║`);
        console.log(`║  Mode:     ${process.env.NODE_ENV || 'development'}                     ║`);
        console.log('║  Status:   ONLINE                            ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log('');
    });
}
main().catch(console.error);
exports.default = app;
//# sourceMappingURL=index.js.map