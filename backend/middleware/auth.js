const JWTService = require('../utils/jwt');
const db = require('../db/db');

// Middleware para verificar autenticación (actualizado para cookies)
const authenticateToken = async (req, res, next) => {
    // Intentar obtener token desde cookies primero
    let token = req.cookies?.accessToken;
    
    // Si no hay cookie, intentar desde Authorization header (para compatibilidad)
    if (!token) {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            error: 'Token de acceso requerido',
            code: 'NO_TOKEN'
        });
    }

    try {
        const decoded = JWTService.verifyAccessToken(token);
        const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
        const user = stmt.get(decoded.userId);
        
        if (!user) {
            return res.status(401).json({
                error: 'Usuario no encontrado',
                code: 'USER_NOT_FOUND'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({
            error: 'Token inválido o expirado',
            code: 'INVALID_TOKEN'
        });
    }
};

// Middleware para verificar roles
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        const hasRole = roles.some(role => userRoles.includes(role));

        if (!hasRole) {
            return res.status(403).json({
                error: 'No tienes permisos para acceder a este recurso',
                requiredRoles: roles,
                userRole: req.user.role
            });
        }

        next();
    };
};

// Middleware opcional (no requiere autenticación pero la verifica si existe)
const optionalAuth = async (req, res, next) => {
    try {
        let token = req.cookies?.accessToken;
        
        if (!token) {
            const authHeader = req.headers['authorization'];
            token = authHeader && authHeader.split(' ')[1];
        }
        
        if (token) {
            const decoded = JWTService.verifyAccessToken(token);
            const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
            const user = stmt.get(decoded.userId);
            
            if (user) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // Si hay error, continuar sin autenticación
        next();
    }
};

module.exports = { authenticateToken, requireRole, optionalAuth };