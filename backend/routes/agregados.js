const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Crear tabla para agregados predefinidos
db.exec(`
CREATE TABLE IF NOT EXISTS predefined_agregados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'extra',
  category TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// Listar agregados predefinidos
router.get('/', (req, res) => {
  try {
    const { type, category, active = 1 } = req.query;
    let sql = 'SELECT * FROM predefined_agregados WHERE active = ?';
    let params = [active];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY type DESC, name ASC';

    const agregados = db.prepare(sql).all(...params);
    res.json(agregados);
  } catch (err) {
    console.error('Error al obtener agregados:', err);
    res.status(500).json({ error: 'Error al obtener agregados' });
  }
});

// Crear agregado predefinido
router.post('/', (req, res) => {
  const { name, price = 0, type = 'extra', category } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Nombre del agregado es requerido' });
  }

  if (!['extra', 'note'].includes(type)) {
    return res.status(400).json({ error: 'Tipo debe ser "extra" o "note"' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO predefined_agregados (name, price, type, category)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(name.trim(), price, type, category);
    
    res.status(201).json({
      id: info.lastInsertRowid,
      name: name.trim(),
      price,
      type,
      category
    });
  } catch (err) {
    console.error('Error al crear agregado:', err);
    res.status(500).json({ error: 'Error al crear agregado' });
  }
});

// Actualizar agregado predefinido
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, type, category, active } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Nombre del agregado es requerido' });
  }

  if (type && !['extra', 'note'].includes(type)) {
    return res.status(400).json({ error: 'Tipo debe ser "extra" o "note"' });
  }

  try {
    const stmt = db.prepare(`
      UPDATE predefined_agregados 
      SET name = ?, price = ?, type = ?, category = ?, active = ?
      WHERE id = ?
    `);
    const info = stmt.run(
      name.trim(), 
      price || 0, 
      type || 'extra', 
      category, 
      active !== undefined ? active : 1, 
      id
    );
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Agregado no encontrado' });
    }
    
    res.json({ message: 'Agregado actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar agregado:', err);
    res.status(500).json({ error: 'Error al actualizar agregado' });
  }
});

// Eliminar (desactivar) agregado predefinido
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare('UPDATE predefined_agregados SET active = 0 WHERE id = ?');
    const info = stmt.run(id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Agregado no encontrado' });
    }
    
    res.json({ message: 'Agregado desactivado correctamente' });
  } catch (err) {
    console.error('Error al desactivar agregado:', err);
    res.status(500).json({ error: 'Error al desactivar agregado' });
  }
});

module.exports = router;