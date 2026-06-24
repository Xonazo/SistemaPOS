const express = require('express');
const bcrypt = require('bcrypt');
const JWTService = require('../utils/jwt');
const db = require('../db/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

// Configuración de cookies
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // Solo HTTPS en producción
  sameSite: 'Lax',
  path: '/'
};

const ACCESS_TOKEN_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000 // 15 minutos
};

const REFRESH_TOKEN_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
};


// Login con cookies httpOnly
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    // Buscar usuario por email
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar tokens
    const payload = { userId: user.id, email: user.email };
    const accessToken = JWTService.generateAccessToken(payload);
    const refreshToken = JWTService.generateRefreshToken(payload);

    // Guardar refresh token en BD
    const stmtUpdate = db.prepare('UPDATE users SET refresh_token = ? WHERE id = ?');
    stmtUpdate.run(refreshToken, user.id);

    // Establecer cookies httpOnly
    res.cookie('accessToken', accessToken, ACCESS_TOKEN_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_OPTIONS);

    

    // Solo enviar datos no sensibles al frontend
    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar autenticación (nuevo endpoint)
router.get('/me', (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const decoded = JWTService.verifyAccessToken(accessToken);
    
    // Obtener datos actuales del usuario
    const stmt = db.prepare('SELECT id, email FROM users WHERE id = ?');
    const user = stmt.get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Error en verificación:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Refresh token usando cookies
router.post('/refresh', (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token requerido' });
    }

    const decoded = JWTService.verifyRefreshToken(refreshToken);

    // Buscar usuario por refresh token
    const stmt = db.prepare('SELECT * FROM users WHERE refresh_token = ?');
    const user = stmt.get(refreshToken);

    if (!user || user.id !== decoded.userId) {
      return res.status(403).json({ error: 'Refresh token inválido' });
    }

    const payload = { userId: user.id, email: user.email };
    const newAccessToken = JWTService.generateAccessToken(payload);

    // Actualizar cookie del access token
    res.cookie('accessToken', newAccessToken, ACCESS_TOKEN_OPTIONS);

    res.json({ message: 'Token renovado exitosamente' });
  } catch (error) {
    console.error('Error en refresh:', error);
    res.status(403).json({ error: 'Refresh token inválido o expirado' });
  }
});

// Logout con limpieza de cookies
router.post('/logout', (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Limpiar refresh token de la BD
      const stmt = db.prepare('UPDATE users SET refresh_token = NULL WHERE refresh_token = ?');
      stmt.run(refreshToken);
    }

    // Limpiar cookies
    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;