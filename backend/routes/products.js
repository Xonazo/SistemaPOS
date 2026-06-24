// ===============================
// routes/products.js (MEJORADO)
// ===============================
const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Listar productos con filtros opcionales
// Listar productos con filtros opcionales y solo activos
router.get('/', (req, res) => {
  try {
    const { category_id, search } = req.query;
    let sql = `
      SELECT p.id, p.name, p.price, p.category_id, c.name AS category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.active = 1
    `;
    let params = [];

    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (search) {
      sql += ' AND p.name LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY p.name';

    const products = db.prepare(sql).all(...params);
    res.json(products);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Obtener un producto por ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = db.prepare(`
      SELECT p.id, p.name, p.price, p.category_id, c.name AS category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json(product);
  } catch (err) {
    console.error('Error al obtener producto:', err);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// Agregar producto nuevo
router.post('/', (req, res) => {
  const { name, price, category_id } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Nombre del producto es requerido' });
  }
  
  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'Precio debe ser un número válido mayor o igual a 0' });
  }
  
  if (!category_id) {
    return res.status(400).json({ error: 'ID de categoría es requerido' });
  }

  try {
    // Verificar que la categoría existe
    const categoryExists = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
    if (!categoryExists) {
      return res.status(400).json({ error: 'La categoría especificada no existe' });
    }

    const stmt = db.prepare(`
      INSERT INTO products (name, price, category_id)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(name.trim(), price, category_id);
    
    // Obtener el producto creado con información de categoría
    const newProduct = db.prepare(`
      SELECT p.id, p.name, p.price, p.category_id, c.name AS category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(info.lastInsertRowid);
    
    res.status(201).json(newProduct);
  } catch (err) {
    console.error('Error al crear producto:', err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// Actualizar producto
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, category_id } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Nombre del producto es requerido' });
  }
  
  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'Precio debe ser un número válido mayor o igual a 0' });
  }
  
  if (!category_id) {
    return res.status(400).json({ error: 'ID de categoría es requerido' });
  }

  try {
    // Verificar que la categoría existe
    const categoryExists = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
    if (!categoryExists) {
      return res.status(400).json({ error: 'La categoría especificada no existe' });
    }

    const stmt = db.prepare('UPDATE products SET name = ?, price = ?, category_id = ? WHERE id = ?');
    const info = stmt.run(name.trim(), price, category_id, id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Obtener el producto actualizado con información de categoría
    const updatedProduct = db.prepare(`
      SELECT p.id, p.name, p.price, p.category_id, c.name AS category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);
    
    res.json(updatedProduct);
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

 // Eliminar producto
// router.delete('/:id', (req, res) => {
//   const { id } = req.params;

//   try {
//     // Verificar si hay órdenes asociadas
//     const ordersCount = db.prepare('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?').get(id);
    
//     if (ordersCount.count > 0) {
//       return res.status(400).json({ 
//         error: 'No se puede eliminar el producto porque está asociado a órdenes existentes' 
//       });
//     }

//     const stmt = db.prepare('DELETE FROM products WHERE id = ?');
//     const info = stmt.run(id);
    
//     if (info.changes === 0) {
//       return res.status(404).json({ error: 'Producto no encontrado' });
//     }
    
//     res.json({ message: 'Producto eliminado correctamente' });
//   } catch (err) {
//     console.error('Error al eliminar producto:', err);
//     res.status(500).json({ error: 'Error al eliminar producto' });
//   }
// });


// Eliminar (soft delete) producto
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    // // Verificar si hay órdenes asociadas
    // const ordersCount = db.prepare('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?').get(id);

    // if (ordersCount.count > 0) {
    //   return res.status(400).json({ 
    //     error: 'No se puede eliminar el producto porque está asociado a órdenes existentes' 
    //   });
    // }

    // Cambiar active a 0 en vez de eliminar
    const stmt = db.prepare('UPDATE products SET active = 0 WHERE id = ? AND active = 1');
    const info = stmt.run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado o ya eliminado' });
    }

    res.json({ message: 'Producto eliminado correctamente (soft delete)' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});


module.exports = router;