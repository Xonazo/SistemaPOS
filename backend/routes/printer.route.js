// routes/printer.route.js
const express = require('express');
const router = express.Router();
const printText = require('../utils/printer');

const db = require('../db/db');
const OPEN_CASH_DRAWER = '\x1B\x70\x00\x19\xFA';

function buildKitchenTicketContent(venta) {

    console.log('Cocina:', venta);
    const dateObj = new Date(venta.timestamp);
    const fecha = dateObj.toLocaleDateString('es-CL');
    const hora = dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    let content = '';
    content += '\x1d\x21\x01';
    content += '    PEDIDO COCINA\n';
    content += '\x1b\x21\x00'; 

    content += '-----------------------\n';
    content += `Fecha: ${fecha}\n`;
    content += `Hora: ${hora}\n\n`;

    content += 'Preparar:\n';
    content += '\x1d\x21\x01'; 

    venta.items.forEach(item => {
        const name = item.product?.name || 'Producto';
        const quantity = item.quantity || 1;

        content += `- ${quantity} x ${name}\n`;

        if (item.notes && item.notes.length > 0) {
            item.notes.forEach(note => {
                content += `    > ${note.name}\n`;
            });
        }
    });

    content += '\n-----------------------\n';
    content += 'Gracias, ¡manos a la obra!\n';
    content += '\n\n\n'; // Espacio en blanco extra al final


    return content;
}


function buildSaleTicketContent(venta) {

    console.log('Venta:', venta);

    const dateObj = new Date(venta.timestamp);
    const fecha = dateObj.toLocaleDateString('es-CL'); // Formato día/mes/año
    const hora = dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    let content = '';
    content += '\x1b\x40'; // ESC @ — Reset general de la impresora
    content += '\x1b\x21\x00'; // Texto normal
    content += ' DONDE LA TINA\n';
    content += '-----------------------\n';
    content += `Fecha: ${fecha}\n`;
    content += `Hora: ${hora}\n\n`;

    content += 'Productos\n';
    
    venta.items.forEach(item => {
        const productData = db.prepare('SELECT name, price FROM products WHERE id = ?').get(item.product_id);
        const name = productData ? productData.name : 'Producto desconocido';
        const price = productData ? productData.price : 0;
        const quantity = item.quantity || 1;
        const lineTotal = price * quantity;

        content += `- ${quantity}x ${name}\n`;
        content += `     $${lineTotal}\n`;

        if (item.notes && item.notes.length > 0) {
            item.notes.forEach(note => {
                let noteText = note.name;
                if (note.price && note.price > 0) {
                    noteText += ` (+$${note.price})`;
                }
                content += `    >${noteText}\n`;
            });
        }
    });

    content += '\n---------------------\n';
    content += `SUBTOTAL:\t$${venta.subtotal}\n`;
    content += `DELIVERY:\t$${venta.delivery ? venta.delivery_cost : 0}\n`;
    content += `TOTAL:\t\t$${venta.total}\n`;
    content += '------------------\n';

    content += `Pago\n`;
    content += `Monto Recibido:\t$${venta.amount_received}\n`;
    content += `Vuelto:\t$${venta.change_amount}\n`;
    content += '--------------------\n';

    content += `Método de pago: ${venta.payment_method}\n`;
    content += `Entrega a domicilio: ${venta.delivery ? 'Sí' : 'No'}\n`;
    content += 'Gracias por su compra\n';
    content += 'Vuelva pronto\n';
    content += '\n\n\n'; // Espacio en blanco extra al final
    content += OPEN_CASH_DRAWER; // Abre el cajón de dinero


    return content;
}


function buildResumenTicketContent(summary, period) {
    const start = new Date(period.start_date).toLocaleString('es-CL');
    const end = new Date(period.end_date).toLocaleString('es-CL');

    let content = '';
    content += '\x1b\x40'; // Reset
    content += '\x1b\x21\x01'; // Fuente un poco más grande
    content += '   RESUMEN DEL DÍA\n';
    content += '\x1b\x21\x00';
    content += '--------------------------\n';
    content += `Desde: ${start}\n`;
    content += `Hasta: ${end}\n`;
    content += '--------------------------\n\n';

    content += `Total Órdenes: ${summary.total_orders}\n`;
    content += `Ingresos Totales: $${summary.total_revenue}\n`;

    content += `Órdenes Delivery: ${summary.delivery_orders}\n`;
    content += `Ingresos Delivery: $${summary.total_delivery_revenue}\n\n`;

    content += '--- Métodos de Pago ---\n';
    content += `Tarjeta: ${summary.card_orders} órdenes - $${summary.card_revenue}\n`;
    content += `Transferencia: ${summary.transfer_orders} órdenes - $${summary.transfer_revenue}\n`;
    content += `Efectivo: ${summary.cash_orders} órdenes - $${summary.cash_revenue}\n`;

    const totalOrders = summary.total_orders || 1;

    const deliveryPercentage = summary.delivery_orders > 0
        ? ((summary.delivery_orders / totalOrders) * 100).toFixed(1)
        : '0.0';

    content += '\n--- Métricas ---\n';
    content += `Delivery (%): ${deliveryPercentage}%\n`;

    const avgDelivery = summary.delivery_orders > 0
        ? (summary.total_delivery_revenue / summary.delivery_orders).toFixed(0)
        : 0;

    content += `Prom. Delivery: $${avgDelivery}\n`;

    const days = Math.ceil((new Date(period.end_date) - new Date(period.start_date)) / (1000 * 60 * 60 * 24)) + 1;
    const ordersPerDay = (summary.total_orders / days).toFixed(1);
    content += `Órdenes por Día: ${ordersPerDay}\n`;

    content += '\n--------------------------\n';
    content += '   Fin del Resumen\n';
    content += '\n\n\n';

    return content;
}



router.post('/print', async (req, res) => {
    const venta = req.body;

    if (!venta || !venta.items || !Array.isArray(venta.items)) {
        return res.status(400).json({ error: 'Faltan datos de venta o items' });
    }

    // const content = buildTicketContent(venta);
    const content = buildKitchenTicketContent(venta);

    try {
        const msg = await printText(content);
        res.json({ content, message: msg });
    } catch (err) {
        res.status(500).json({ error: err.toString() });
    }
});


router.post('/print-summary', async (req, res) => {
    const { summary, period } = req.body;

    console.log('Resumen recibido:', summary);
    console.log('Período recibido:', period);

    if (!summary || !period) {
        return res.status(400).json({ error: 'Faltan datos del resumen o período' });
    }

    const content = buildResumenTicketContent(summary, period);

    try {
        const msg = await printText(content);
        res.json({ content, message: msg, type: 'summary' });
    } catch (err) {
        res.status(500).json({ error: err.toString() });
    }
});

// Endpoint para imprimir ticket de cocina
router.post('/print-kitchen', async (req, res) => {
    const venta = req.body;

    if (!venta || !venta.items || !Array.isArray(venta.items)) {
        return res.status(400).json({ error: 'Faltan datos de venta o items' });
    }

    const content = buildKitchenTicketContent(venta);

    try {
        const msg = await printText(content);
        res.json({ content, message: msg, type: 'kitchen' });
    } catch (err) {
        res.status(500).json({ error: err.toString() });
    }
});

// Endpoint para imprimir ticket de venta
router.post('/print-sale', async (req, res) => {
    const venta = req.body;

    if (!venta || !venta.items || !Array.isArray(venta.items)) {
        return res.status(400).json({ error: 'Faltan datos de venta o items' });
    }

    const content = buildSaleTicketContent(venta);

    try {
        const msg = await printText(content);
        res.json({ content, message: msg, type: 'sale' });
    } catch (err) {
        res.status(500).json({ error: err.toString() });
    }
});

module.exports = router;
