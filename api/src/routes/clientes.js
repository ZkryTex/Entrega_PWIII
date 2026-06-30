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
    
    // 1. Validación de campos obligatorios
    if (!nombre || !apellido || !dni) {
        return res.status(400).json({ message: 'Nombre, apellido y DNI son campos requeridos.' });
    }

    // 2. Controlar si el DNI ya está repetido en la tabla Cliente
    const sqlCheck = "SELECT * FROM Cliente WHERE dni = ?";
    
    db.get(sqlCheck, [dni], (err, row) => {
        if (err) {
            console.error('Error al verificar cliente existente:', err.message);
            return res.status(500).json({ error: err.message });
        }
        
        // Si 'row' contiene algo, significa que encontró un cliente con ese DNI
        if (row) {
            return res.status(400).json({ message: 'El cliente con este DNI ya se encuentra registrado.' });
        }

        // 3. Si no está repetido, se procede al INSERT común y corriente
        const sqlInsert = `INSERT INTO Cliente (nombre, apellido, dni) VALUES (?, ?, ?)`;
        db.run(sqlInsert, [nombre, apellido, dni], function(err) {
            if (err) {
                console.error('Error al insertar cliente:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, ...req.body });
        });
    });
});



// DELETE a cliente by id
router.delete('/:id', (req, res) => {
    const clienteId = req.params.id;

    db.get('SELECT id FROM Cliente WHERE id = ?', [clienteId], (err, row) => {
        if (err) {
            console.error('Error al buscar cliente para eliminar:', err.message);
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        db.run('DELETE FROM Cliente WHERE id = ?', [clienteId], function(err) {
            if (err) {
                console.error('Error al eliminar cliente:', err.message);
                return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ message: 'Cliente no encontrado.' });
            }

            res.json({ message: 'Cliente eliminado correctamente.' });
        });
    });
});

module.exports = router;
