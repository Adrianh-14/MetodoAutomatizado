"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const cookies_routes_1 = __importDefault(require("./routes/cookies.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const forms_routes_1 = __importDefault(require("./routes/forms.routes"));
const facebook_routes_1 = __importDefault(require("./routes/facebook.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: true, // Allow any origin dynamically (handles localhost vs 127.0.0.1)
    credentials: true,
}));
app.use(express_1.default.json({ limit: '50mb' }));
// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'millonesgang-api',
        timestamp: new Date().toISOString()
    });
});
const users_routes_1 = __importDefault(require("./routes/users.routes"));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/cookies', cookies_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api/forms', forms_routes_1.default);
app.use('/api/facebook', facebook_routes_1.default);
// Proxy para proyecto de automatización (Mosivo Auto)
app.use('/automation', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: { '^/automation': '' },
}));
// Error handler
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
exports.default = app;
//# sourceMappingURL=index.js.map