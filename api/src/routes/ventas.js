const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all ventas (with client and product details)
router.get('/', (req, res) => {
    const sql = `
        SELECT
            Ventas.id AS venta_id,
            Ventas.fecha,
            Cliente.nombre AS cliente_nombre,
            Cliente.apellido AS cliente_apellido,
            Celulares.marca AS producto_marca,
            Celulares.modelo AS producto_modelo,
            Celulares.precio AS producto_precio -- Asegúrate de que este nombre coincide con la columna en Celulares
        FROM Ventas
        JOIN Cliente ON Ventas.cliente = Cliente.id
        JOIN Celulares ON Ventas.producto = Celulares.id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error al obtener todas las ventas:', err.message); // Añadido log
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// POST a new venta
router.post('/', (req, res) => {
    const { cliente_id, producto_id, fecha } = req.body;
    if (!cliente_id || !producto_id || !fecha) {
        return res.status(400).json({ message: 'Cliente ID, Producto ID y Fecha son campos requeridos.' });
    }

    // Optional: Validate if client_id and producto_id exist in their respective tables
    db.get('SELECT id FROM Cliente WHERE id = ?', [cliente_id], (err, clientRow) => {
        if (err || !clientRow) {
            return res.status(400).json({ message: 'Cliente no encontrado.' });
        }
        db.get('SELECT id FROM Celulares WHERE id = ?', [producto_id], (err, productRow) => {
            if (err || !productRow) {
                return res.status(400).json({ message: 'Producto (Celular) no encontrado.' });
            }

            const sql = `INSERT INTO Ventas (cliente, producto, fecha) VALUES (?, ?, ?)`;
            db.run(sql, [cliente_id, producto_id, fecha], function(err) {
                if (err) {
                    console.error('Error al insertar venta:', err.message); // Añadido log
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.status(201).json({ id: this.lastID, ...req.body });
            });
        });
    });
});

module.exports = router;
