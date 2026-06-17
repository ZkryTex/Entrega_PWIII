const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all clientes
router.get('/', (req, res) => {
    db.all('SELECT * FROM Cliente', [], (err, rows) => {
        if (err) {
            console.error('Error al obtener todos los clientes:', err.message); // Añadido log
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// POST a new cliente
router.post('/', (req, res) => {
    const { nombre, apellido, dni } = req.body;
    if (!nombre || !apellido || !dni) {
        return res.status(400).json({ message: 'Nombre, apellido y DNI son campos requeridos.' });
    }
    const sql = `INSERT INTO Cliente (nombre, apellido, dni) VALUES (?, ?, ?)`;
    db.run(sql, [nombre, apellido, dni], function(err) {
        if (err) {
            console.error('Error al insertar cliente:', err.message); // Añadido log
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({ id: this.lastID, ...req.body });
    });
});

// Puedes agregar rutas para PUT y DELETE si lo necesitas
module.exports = router;
