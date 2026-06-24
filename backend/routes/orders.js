// ===============================
// routes/orders.js (MEJORADO)
// ===============================
const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Listar órdenes con paginación
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 10, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        o.*,
        COUNT(oi.id) as total_items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
    `;
    let countSql = 'SELECT COUNT(*) as total FROM orders o';
    let params = [];

    if (start_date && end_date) {
      const whereClause = ' WHERE o.timestamp BETWEEN ? AND ?';
      sql += whereClause;
      countSql += whereClause;
      params.push(start_date, end_date);
    }

    sql += ' GROUP BY o.id ORDER BY o.timestamp DESC LIMIT ? OFFSET ?';

    const orders = db.prepare(sql).all(...params, parseInt(limit), offset);
    const totalResult = db.prepare(countSql).get(...params);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (err) {
    console.error('Error al obtener órdenes:', err);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

// Obtener una orden por ID con detalles completos
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const items = db.prepare(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.price as product_price
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `).all(id);

    for (let item of items) {
      const agregados = db.prepare(`
        SELECT 
          id,
          name,
          price,
          type,
          CASE 
            WHEN type = 'extra' AND price > 0 THEN name || ' (+$' || price || ')'
            ELSE name
          END AS display
        FROM order_item_notes
        WHERE order_item_id = ?
      `).all(item.id);

      item.agregados = agregados;
    }

    res.json({
      ...order,
      items
    });
  } catch (err) {
    console.error('Error al obtener orden:', err);
    res.status(500).json({ error: 'Error al obtener orden' });
  }
});

// Crear pedido completo
// Crear pedido completo
router.post('/', (req, res) => {
  const {
    uid,
    amount_received,
    change_amount,
    delivery,
    delivery_cost,
    subtotal,
    total,
    payment_method,
    timestamp,
    items
  } = req.body;

  // Validación
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.product_id || typeof item.quantity !== 'number' || item.quantity <= 0) {
      return res.status(400).json({
        error: `Item ${i + 1} es inválido: debe tener product_id y quantity mayor a 0`
      });
    }
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders
    (uid, amount_received, change_amount, delivery, delivery_cost, subtotal, total, payment_method, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)
  `);

  const insertNote = db.prepare(`
    INSERT INTO order_item_notes (order_item_id, name, price, type) VALUES (?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const item of items) {
      const productExists = db.prepare('SELECT id FROM products WHERE id = ?').get(item.product_id);
      if (!productExists) {
        throw new Error(`El producto con ID ${item.product_id} no existe`);
      }
    }

    const orderInfo = insertOrder.run(
      uid,
      amount_received,
      change_amount,
      delivery ? 1 : 0,
      delivery_cost,
      subtotal,
      total,
      payment_method,
      timestamp
    );

    const orderId = orderInfo.lastInsertRowid;

    for (const item of items) {
      const { product_id, quantity, notes } = item;

      const orderItemInfo = insertOrderItem.run(orderId, product_id, quantity);
      const orderItemId = orderItemInfo.lastInsertRowid;

      if (notes && Array.isArray(notes)) {
        for (const note of notes) {
          if (note.name) {
            const price = note.price || 0;
            const type = price > 0 ? 'extra' : 'note';
            insertNote.run(orderItemId, note.name, price, type);
          }
        }
      }
    }

    return orderId;
  });

  try {
    const newOrderId = transaction();
    res.status(201).json({ orderId: newOrderId, message: 'Orden creada correctamente' });
  } catch (err) {
    console.error('Error al crear orden:', err);
    res.status(500).json({ error: err.message || 'Error al crear orden' });
  }
});


// // Informe de ventas entre dos fechas con hora
// router.get('/reports/sales', (req, res) => {
//   const { start_date, end_date } = req.query;

//   if (!start_date || !end_date) {
//     return res.status(400).json({ error: 'Fechas start_date y end_date son requeridas' });
//   }

//   // Validar formato de fecha (YYYY-MM-DD HH:MM:SS)
//   const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
//   if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
//     return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD HH:MM:SS' });
//   }

//   try {
//     // Convertir fechas locales a objetos Date, luego a ISO 8601 UTC
//     // Asume que start_date y end_date están en la zona horaria local del servidor
//     const toUTCISOString = (localDateTimeStr) => {
//       // Ejemplo: "2025-05-29 18:00:00" -> "2025-05-29T18:00:00"
//       const isoLocal = localDateTimeStr.replace(' ', 'T');
//       const dateObj = new Date(isoLocal);

//       // Validar que la fecha sea válida
//       if (isNaN(dateObj)) {
//         throw new Error('Fecha inválida');
//       }

//       // Convertir a ISO string UTC
//       return dateObj.toISOString();
//     };

//     const startUTC = toUTCISOString(start_date);
//     const endUTC = toUTCISOString(end_date);

//     // Query para obtener órdenes entre fechas UTC
//     const ordersSql = `
//       SELECT
//         o.id,
//         o.uid,
//         o.timestamp,
//         o.total,
//         o.subtotal,
//         o.amount_received,
//         o.change_amount,
//         o.payment_method,
//         o.delivery,
//         o.delivery_cost
//       FROM orders o
//       WHERE o.timestamp BETWEEN ? AND ?
//       ORDER BY o.timestamp DESC
//     `;
//     const orders = db.prepare(ordersSql).all(startUTC, endUTC);

//     if (orders.length === 0) {
//       return res.json({
//         summary: {
//           total_orders: 0,
//           total_revenue: 0,
//           average_order_value: 0,
//           delivery_orders: 0,
//           total_delivery_revenue: 0
//         },
//         details: [],
//         period: { start_date, end_date }
//       });
//     }

//     // Query para obtener los ítems de las órdenes
//     const itemsSql = `
//       SELECT
//         oi.id as order_item_id,
//         oi.order_id,
//         oi.quantity,
//         p.id as product_id,
//         p.name as product_name,
//         p.price as product_price,
//         c.name as category,
//         oin.name as note_name,
//         oin.price as note_price
//       FROM order_items oi
//       JOIN products p ON p.id = oi.product_id
//       LEFT JOIN categories c ON c.id = p.category_id
//       LEFT JOIN order_item_notes oin ON oin.order_item_id = oi.id
//       WHERE oi.order_id IN (${orders.map(() => '?').join(',')})
//     `;
//     const itemsRaw = db.prepare(itemsSql).all(...orders.map(o => o.id));

//     const orderItemsMap = {};
//     for (const row of itemsRaw) {
//       const orderId = row.order_id;
//       const orderItemId = row.order_item_id;

//       if (!orderItemsMap[orderId]) orderItemsMap[orderId] = [];

//       let item = orderItemsMap[orderId].find(i => i.id === orderItemId);

//       if (!item) {
//         item = {
//           id: orderItemId,
//           product: {
//             id: row.product_id,
//             name: row.product_name,
//             price: row.product_price,
//             category: row.category
//           },
//           quantity: row.quantity,
//           notes: []
//         };
//         orderItemsMap[orderId].push(item);
//       }

//       if (row.note_name) {
//         item.notes.push({
//           name: row.note_name,
//           price: row.note_price
//         });
//       }
//     }

//     const detailedSales = orders.map(order => ({
//       ...order,
//       items: orderItemsMap[order.id] || []
//     }));

//     // Resumen de ventas
//     const summarySql = `
//       SELECT
//         COUNT(DISTINCT o.id) as total_orders,
//         SUM(o.total) as total_revenue,
//         AVG(o.total) as average_order_value,
//         SUM(CASE WHEN o.delivery = 1 THEN 1 ELSE 0 END) as delivery_orders,
//         SUM(o.delivery_cost) as total_delivery_revenue
//       FROM orders o
//       WHERE o.timestamp BETWEEN ? AND ?
//     `;
//     const summary = db.prepare(summarySql).get(startUTC, endUTC);

//     res.json({
//       summary,
//       details: detailedSales,
//       period: { start_date, end_date }
//     });
//   } catch (err) {
//     console.error('Error al generar reporte:', err);
//     res.status(500).json({ error: 'Error al generar reporte de ventas' });
//   }
// });



// Informe de ventas entre dos fechas con hora (solo órdenes activas)
// router.get('/reports/sales', (req, res) => {
//   const { start_date, end_date } = req.query;

//   if (!start_date || !end_date) {
//     return res.status(400).json({ error: 'Fechas start_date y end_date son requeridas' });
//   }

//   const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
//   if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
//     return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD HH:MM:SS' });
//   }

//   try {
//     const toUTCISOString = (localDateTimeStr) => {
//       const isoLocal = localDateTimeStr.replace(' ', 'T');
//       const dateObj = new Date(isoLocal);
//       if (isNaN(dateObj)) throw new Error('Fecha inválida');
//       return dateObj.toISOString();
//     };

//     const startUTC = toUTCISOString(start_date);
//     const endUTC = toUTCISOString(end_date);

//     // Consulta de órdenes activas entre fechas
//     const ordersSql = `
//       SELECT
//         o.id,
//         o.uid,
//         o.timestamp,
//         o.total,
//         o.subtotal,
//         o.amount_received,
//         o.change_amount,
//         o.payment_method,
//         o.delivery,
//         o.delivery_cost
//       FROM orders o
//       WHERE o.timestamp BETWEEN ? AND ? AND o.active = 1
//       ORDER BY o.timestamp DESC
//     `;
//     const orders = db.prepare(ordersSql).all(startUTC, endUTC);

//     if (orders.length === 0) {
//       return res.json({
//         summary: {
//           total_orders: 0,
//           total_revenue: 0,
//           average_order_value: 0,
//           delivery_orders: 0,
//           total_delivery_revenue: 0
//         },
//         details: [],
//         period: { start_date, end_date }
//       });
//     }

//     // Obtener ítems
//     const itemsSql = `
//       SELECT
//         oi.id as order_item_id,
//         oi.order_id,
//         oi.quantity,
//         p.id as product_id,
//         p.name as product_name,
//         p.price as product_price,
//         c.name as category,
//         oin.name as note_name,
//         oin.price as note_price
//       FROM order_items oi
//       JOIN products p ON p.id = oi.product_id
//       LEFT JOIN categories c ON c.id = p.category_id
//       LEFT JOIN order_item_notes oin ON oin.order_item_id = oi.id
//       WHERE oi.order_id IN (${orders.map(() => '?').join(',')})
//     `;
//     const itemsRaw = db.prepare(itemsSql).all(...orders.map(o => o.id));

//     const orderItemsMap = {};
//     for (const row of itemsRaw) {
//       const orderId = row.order_id;
//       const orderItemId = row.order_item_id;

//       if (!orderItemsMap[orderId]) orderItemsMap[orderId] = [];

//       let item = orderItemsMap[orderId].find(i => i.id === orderItemId);

//       if (!item) {
//         item = {
//           id: orderItemId,
//           product: {
//             id: row.product_id,
//             name: row.product_name,
//             price: row.product_price,
//             category: row.category
//           },
//           quantity: row.quantity,
//           notes: []
//         };
//         orderItemsMap[orderId].push(item);
//       }

//       if (row.note_name) {
//         item.notes.push({
//           name: row.note_name,
//           price: row.note_price
//         });
//       }
//     }

//     const detailedSales = orders.map(order => ({
//       ...order,
//       items: orderItemsMap[order.id] || []
//     }));

//     // Resumen solo con órdenes activas
//     const summarySql = `
//       SELECT
//         COUNT(DISTINCT o.id) as total_orders,
//         SUM(o.total) as total_revenue,
//         AVG(o.total) as average_order_value,
//         SUM(CASE WHEN o.delivery = 1 THEN 1 ELSE 0 END) as delivery_orders,
//         SUM(o.delivery_cost) as total_delivery_revenue
//       FROM orders o
//       WHERE o.timestamp BETWEEN ? AND ? AND o.active = 1
//     `;
//     const summary = db.prepare(summarySql).get(startUTC, endUTC);

//     res.json({
//       summary,
//       details: detailedSales,
//       period: { start_date, end_date }
//     });
//   } catch (err) {
//     console.error('Error al generar reporte:', err);
//     res.status(500).json({ error: 'Error al generar reporte de ventas' });
//   }
// });


// Informe de ventas entre dos fechas con hora (solo órdenes activas)
router.get('/reports/sales', (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Fechas start_date y end_date son requeridas' });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
    return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD HH:MM:SS' });
  }

  try {
    const toUTCISOString = (localDateTimeStr) => {
      const isoLocal = localDateTimeStr.replace(' ', 'T');
      const dateObj = new Date(isoLocal);
      if (isNaN(dateObj)) throw new Error('Fecha inválida');
      return dateObj.toISOString();
    };

    const startUTC = toUTCISOString(start_date);
    const endUTC = toUTCISOString(end_date);

    // Consulta de órdenes activas entre fechas
    const ordersSql = `
      SELECT
        o.id,
        o.uid,
        o.timestamp,
        o.total,
        o.subtotal,
        o.amount_received,
        o.change_amount,
        o.payment_method,
        o.delivery,
        o.delivery_cost
      FROM orders o
      WHERE o.timestamp BETWEEN ? AND ? AND o.active = 1
      ORDER BY o.timestamp DESC
    `;
    const orders = db.prepare(ordersSql).all(startUTC, endUTC);

    if (orders.length === 0) {
      return res.json({
        summary: {
          total_orders: 0,
          total_revenue: 0,
          average_order_value: 0,
          delivery_orders: 0,
          total_delivery_revenue: 0,
          card_orders: 0,
          card_revenue: 0,
          transfer_orders: 0,
          transfer_revenue: 0,
          cash_orders: 0,
          cash_revenue: 0
        },
        details: [],
        period: { start_date, end_date }
      });
    }

    // Obtener ítems
    const itemsSql = `
      SELECT
        oi.id as order_item_id,
        oi.order_id,
        oi.quantity,
        p.id as product_id,
        p.name as product_name,
        p.price as product_price,
        c.name as category,
        oin.name as note_name,
        oin.price as note_price
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN order_item_notes oin ON oin.order_item_id = oi.id
      WHERE oi.order_id IN (${orders.map(() => '?').join(',')})
    `;
    const itemsRaw = db.prepare(itemsSql).all(...orders.map(o => o.id));

    const orderItemsMap = {};
    for (const row of itemsRaw) {
      const orderId = row.order_id;
      const orderItemId = row.order_item_id;

      if (!orderItemsMap[orderId]) orderItemsMap[orderId] = [];

      let item = orderItemsMap[orderId].find(i => i.id === orderItemId);

      if (!item) {
        item = {
          id: orderItemId,
          product: {
            id: row.product_id,
            name: row.product_name,
            price: row.product_price,
            category: row.category
          },
          quantity: row.quantity,
          notes: []
        };
        orderItemsMap[orderId].push(item);
      }

      if (row.note_name) {
        item.notes.push({
          name: row.note_name,
          price: row.note_price
        });
      }
    }

    const detailedSales = orders.map(order => ({
      ...order,
      items: orderItemsMap[order.id] || []
    }));

    // Resumen mejorado con métricas de métodos de pago
    const summarySql = `
      SELECT
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total) as total_revenue,
        AVG(o.total) as average_order_value,
        SUM(CASE WHEN o.delivery = 1 THEN 1 ELSE 0 END) as delivery_orders,
        SUM(o.delivery_cost) as total_delivery_revenue,
        
        -- Métricas por método de pago
        SUM(CASE WHEN o.payment_method = 'tarjeta' THEN 1 ELSE 0 END) as card_orders,
        SUM(CASE WHEN o.payment_method = 'tarjeta' THEN o.total ELSE 0 END) as card_revenue,
        
        SUM(CASE WHEN o.payment_method = 'transferencia' THEN 1 ELSE 0 END) as transfer_orders,
        SUM(CASE WHEN o.payment_method = 'transferencia' THEN o.total ELSE 0 END) as transfer_revenue,
        
        SUM(CASE WHEN o.payment_method = 'efectivo' THEN 1 ELSE 0 END) as cash_orders,
        SUM(CASE WHEN o.payment_method = 'efectivo' THEN o.total ELSE 0 END) as cash_revenue
        
      FROM orders o
      WHERE o.timestamp BETWEEN ? AND ? AND o.active = 1
    `;
    const summary = db.prepare(summarySql).get(startUTC, endUTC);

    // Asegurar que los valores null se conviertan a 0
    Object.keys(summary).forEach(key => {
      if (summary[key] === null) {
        summary[key] = 0;
      }
    });

    res.json({
      summary,
      details: detailedSales,
      period: { start_date, end_date }
    });
  } catch (err) {
    console.error('Error al generar reporte:', err);
    res.status(500).json({ error: 'Error al generar reporte de ventas' });
  }
});






// Actualizar una orden existente
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    uid,
    amount_received,
    change_amount,
    delivery,
    delivery_cost,
    subtotal,
    total,
    payment_method,
    items
  } = req.body;

    console.log('Datos recibidos para actualizar orden:', {
    id,
    items: items,
    itemsLength: items ? items.length : 'undefined',
    itemsType: typeof items
  });

  // Validar que la orden existe
  const existingOrder = db.prepare('SELECT id FROM orders WHERE id = ?').get(id);
  if (!existingOrder) {
    return res.status(404).json({ error: 'Orden no encontrada' });
  }



  // Determinar si tenemos items válidos para procesar
  const hasValidItems = items && Array.isArray(items) && items.length > 0;

  // Validación de items - solo si se proporcionan items válidos
  if (hasValidItems) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({
          error: `Item ${i + 1} es inválido: debe tener product_id y quantity mayor a 0`
        });
      }
    }
  }

  const updateOrder = db.prepare(`
    UPDATE orders 
    SET uid = ?, amount_received = ?, change_amount = ?, delivery = ?, 
        delivery_cost = ?, subtotal = ?, total = ?, payment_method = ?
    WHERE id = ?
  `);

  // Preparar statements para items
  const deleteOrderItems = db.prepare('DELETE FROM order_items WHERE order_id = ?');
  const deleteOrderItemNotes = db.prepare(`
    DELETE FROM order_item_notes 
    WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = ?)
  `);
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)
  `);
  const insertNote = db.prepare(`
    INSERT INTO order_item_notes (order_item_id, name, price, type) VALUES (?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    // Actualizar la información básica de la orden
    updateOrder.run(
      uid,
      amount_received,
      change_amount,
      delivery ? 1 : 0,
      delivery_cost,
      subtotal,
      total,
      payment_method,
      id
    );

    // Solo procesar items si tenemos items válidos
    if (hasValidItems) {
      // Verificar que todos los productos existen ANTES de hacer cambios
      for (const item of items) {
        const productExists = db.prepare('SELECT id FROM products WHERE id = ?').get(item.product_id);
        if (!productExists) {
          throw new Error(`El producto con ID ${item.product_id} no existe`);
        }
      }

      // Eliminar items y notas existentes
      deleteOrderItemNotes.run(id);
      deleteOrderItems.run(id);

      // Insertar nuevos items
      for (const item of items) {
        const { product_id, quantity, notes } = item;

        const orderItemInfo = insertOrderItem.run(id, product_id, quantity);
        const orderItemId = orderItemInfo.lastInsertRowid;

        if (notes && Array.isArray(notes)) {
          for (const note of notes) {
            if (note.name && note.name.trim() !== '') {
              const price = note.price || 0;
              const type = price > 0 ? 'extra' : 'note';
              insertNote.run(orderItemId, note.name, price, type);
            }
          }
        }
      }
    }
    // Si no hay items válidos, no tocamos los items existentes de la orden
  });



  // Soft delete: marcar orden como inactiva
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

  if (!order) {
    return res.status(404).json({ error: 'Orden no encontrada' });
  }

  db.prepare('UPDATE orders SET active = 0 WHERE id = ?').run(id);
  res.json({ message: 'Orden eliminada (soft delete)' });
});

  try {
    transaction();
    res.json({ message: 'Orden actualizada correctamente', orderId: id });
  } catch (err) {
    console.error('Error al actualizar orden:', err);
    res.status(500).json({ error: err.message || 'Error al actualizar orden' });
  }
});
module.exports = router;
