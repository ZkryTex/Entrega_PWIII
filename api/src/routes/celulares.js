// api/src/routes/celulares.js

const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all celulares
router.get('/', (req, res) => {
    db.all('SELECT * FROM Celulares', [], (err, rows) => {
        if (err) {
            console.error('Error al obtener todos los celulares:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// GET a single celular by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM Celulares WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error(`Error al obtener celular con ID ${id}:`, err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ message: 'Celular no encontrado.' });
        }
    });
});

// POST a new celular (CREATE)
router.post('/', (req, res) => {
    // Desestructuración del cuerpo de la solicitud (usa los nombres que vienen del frontend)
    const {
        marca, modelo, peso, ram, camara_frontal, camara_trasera, // Frontend envía estos nombres
        procesador, capacidad_bateria, tamanio_pantalla, precio, lanzamiento
    } = req.body;

    // Validación de campos requeridos
    if (!marca || !modelo) {
        return res.status(400).json({ message: 'Marca y modelo son campos requeridos.' });
    }

    // Validación y parsing del precio
    let parsedPrecio = parseFloat(precio);
    if (isNaN(parsedPrecio) || parsedPrecio <= 0) {
        return res.status(400).json({ message: 'El precio debe ser un número válido mayor que cero.' });
    }
    const precioParaGuardar = parsedPrecio.toFixed(2);

    // Mapeo de nombres de frontend a nombres de columna de BD para la inserción
    // Los valores de req.body son los que usamos para los parámetros SQL.
    const dataToInsert = [
        marca,
        modelo,
        peso || null,
        ram || null, // Valor del frontend
        camara_frontal || null, // Valor del frontend
        camara_trasera || null, // Valor del frontend
        procesador || null,
        capacidad_bateria || null, // Valor del frontend
        tamanio_pantalla || null, // Valor del frontend
        precioParaGuardar,
        lanzamiento || null
    ];

    // !!! CORRECCIÓN: Nombres de columna exactos en la consulta SQL, entre comillas dobles si tienen espacios o acentos !!!
    const sql = `INSERT INTO Celulares (
        marca, modelo, peso, "RAM", "cámara frontal", "cámara trasera",
        procesador, "capacidad de la batería", "tamanio de la pantalla", precio, lanzamiento
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, dataToInsert, function(err) {
        if (err) {
            console.error('Error al insertar celular:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({ id: this.lastID, ...req.body, precio: precioParaGuardar });
    });
});

// PUT/PATCH update an existing celular (UPDATE)
router.put('/:id', (req, res) => {
    const { id } = req.params;
    // Desestructuración del cuerpo de la solicitud (usa los nombres que vienen del frontend)
    const {
        marca, modelo, peso, ram, camara_frontal, camara_trasera, // Frontend envía estos nombres
        procesador, capacidad_bateria, tamanio_pantalla, precio, lanzamiento
    } = req.body;

    let precioParaGuardar = precio;

    if (precio !== undefined && precio !== null && precio !== '') {
        let parsedPrecio = parseFloat(precio);
        if (isNaN(parsedPrecio) || parsedPrecio <= 0) {
            return res.status(400).json({ message: 'El precio debe ser un número válido mayor que cero si se proporciona.' });
        }
        precioParaGuardar = parsedPrecio.toFixed(2);
    } else if (precio === '') {
        precioParaGuardar = null;
    }

    // Mapeo de valores de frontend a parámetros SQL
    // Se mantiene el orden de los parámetros para el SQL, asegurando que coincidan con COALESCE.
    const dataToUpdate = [
        marca || null,
        modelo || null,
        peso || null, // El orden de 'peso' se ajustó en la consulta SQL para coincidir con este array
        ram || null, // Valor del frontend
        camara_frontal || null, // Valor del frontend
        camara_trasera || null, // Valor del frontend
        procesador || null,
        capacidad_bateria || null, // Valor del frontend
        tamanio_pantalla || null, // Valor del frontend
        precioParaGuardar,
        lanzamiento || null,
        id // El ID siempre va al final para el WHERE
    ];

    // !!! CORRECCIÓN: Nombres de columna exactos en la consulta SQL, entre comillas dobles si tienen espacios o acentos !!!
    // Los campos en COALESCE(?, columna) deben coincidir con el orden de `dataToUpdate`.
    const sql = `UPDATE Celulares SET
        marca = COALESCE(?, marca),
        modelo = COALESCE(?, modelo),
        peso = COALESCE(?, peso),
        "RAM" = COALESCE(?, "RAM"),               -- ¡CORRECCIÓN DE NOMBRE!
        "cámara frontal" = COALESCE(?, "cámara frontal"), -- ¡CORRECCIÓN DE NOMBRE!
        "cámara trasera" = COALESCE(?, "cámara trasera"), -- ¡CORRECCIÓN DE NOMBRE!
        procesador = COALESCE(?, procesador),
        "capacidad de la batería" = COALESCE(?, "capacidad de la batería"), -- ¡CORRECCIÓN DE NOMBRE!
        "tamanio de la pantalla" = COALESCE(?, "tamanio de la pantalla"),  -- ¡CORRECCIÓN DE NOMBRE!
        precio = COALESCE(?, precio),
        lanzamiento = COALESCE(?, lanzamiento)
    WHERE id = ?`;

    db.run(sql, dataToUpdate, function(err) {
        if (err) {
            console.error(`Error al actualizar celular con ID ${id}:`, err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: 'Celular no encontrado para actualizar.' });
        } else {
            res.json({ message: 'Celular actualizado exitosamente', changes: this.changes });
        }
    });
});

// DELETE a celular (DELETE)
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM Celulares WHERE id = ?', id, function(err) {
        if (err) {
            console.error(`Error al eliminar celular con ID ${id}:`, err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: 'Celular no encontrado para eliminar.' });
        } else {
            res.json({ message: 'Celular eliminado exitosamente', changes: this.changes });
        }
    });
});

module.exports = router;
