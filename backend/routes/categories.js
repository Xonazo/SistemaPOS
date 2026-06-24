const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Listar todas las categorías
router.get('/', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories WHERE active = 1 ORDER BY name').all();
    res.json(categories);
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// Obtener una categoría por ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    res.json(category);
  } catch (err) {
    console.error('Error al obtener categoría:', err);
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
});

// Agregar categoría nueva
router.post('/', (req, res) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Nombre de categoría es requerido' });
  }

  try {
    const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
    const info = stmt.run(name.trim());
    res.status(201).json({ id: info.lastInsertRowid, name: name.trim() });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'La categoría ya existe' });
    }
    console.error('Error al crear categoría:', err);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// Actualizar categoría
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Nombre de categoría es requerido' });
  }

  try {
    const stmt = db.prepare('UPDATE categories SET name = ? WHERE id = ?');
    const info = stmt.run(name.trim(), id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    res.json({ id: parseInt(id), name: name.trim() });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    console.error('Error al actualizar categoría:', err);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

// // Eliminar categoría
// router.delete('/:id', (req, res) => {
//   const { id } = req.params;

//   try {
//     // Verificar si hay productos asociados
//     const productsCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(id);
    
//     if (productsCount.count > 0) {
//       return res.status(400).json({ 
//         error: 'No se puede eliminar la categoría porque tiene productos asociados' 
//       });
//     }

//     const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
//     const info = stmt.run(id);
    
//     if (info.changes === 0) {
//       return res.status(404).json({ error: 'Categoría no encontrada' });
//     }
    
//     res.json({ message: 'Categoría eliminada correctamente' });
//   } catch (err) {
//     console.error('Error al eliminar categoría:', err);
//     res.status(500).json({ error: 'Error al eliminar categoría' });
//   }
// });

// Eliminar (soft delete) categoría
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    // // Verificar si hay productos activos asociados
    // const productsCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ? AND active = 1').get(id);

    // if (productsCount.count > 0) {
    //   return res.status(400).json({ 
    //     error: 'No se puede eliminar la categoría porque tiene productos activos asociados' 
    //   });
    // }

    // Actualizar active a 0 en vez de eliminar
    const stmt = db.prepare('UPDATE categories SET active = 0 WHERE id = ? AND active = 1');
    const info = stmt.run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada o ya eliminada' });
    }

    res.json({ message: 'Categoría eliminada correctamente (soft delete)' });
  } catch (err) {
    console.error('Error al eliminar categoría:', err);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

module.exports = router;