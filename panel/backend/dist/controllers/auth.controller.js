"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const authService = new auth_service_1.AuthService();
class AuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required' });
                return;
            }
            const normalizedEmail = email.trim().toLowerCase();
            const result = await authService.login(normalizedEmail, password);
            res.json(result);
        }
        catch (error) {
            console.error('Login error detailed:', error);
            if (error.message === 'Invalid credentials') {
                res.status(401).json({ error: error.message });
            }
            else if (error.message === 'Tenant is inactive') {
                res.status(403).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Login failed' });
            }
        }
    }
    async refresh(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({ error: 'Refresh token is required' });
                return;
            }
            const result = await authService.refresh(refreshToken);
            res.json(result);
        }
        catch (error) {
            res.status(401).json({ error: 'Invalid refresh token' });
        }
    }
    async getMe(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const user = await authService.getMe(req.user.userId);
            res.json(user);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to get user info' });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map