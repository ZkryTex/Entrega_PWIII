// api/src/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ajusta la ruta a tu archivo de base de datos para que apunte a la raíz del proyecto.
// __dirname es 'api/src'. '../' va a 'api'. '../' de nuevo va a la carpeta raíz del proyecto.
const DB_PATH = path.resolve(__dirname, '../../celulares.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    } else {
        console.log(`Conectado a la base de datos SQLite en: ${DB_PATH}`); // Log para verificar la ruta
        // Puedes inicializar las tablas aquí si no existen, aunque ya las tienes
        db.run(`CREATE TABLE IF NOT EXISTS Cliente (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            dni TEXT UNIQUE NOT NULL
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS Celulares (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            marca TEXT NOT NULL,
            modelo TEXT NOT NULL,
            peso TEXT,
            "RAM" TEXT,                 -- Nombre exacto de la columna
            "cámara frontal" TEXT,      -- Nombre exacto de la columna
            "cámara trasera" TEXT,      -- Nombre exacto de la columna
            procesador TEXT,
            "capacidad de la batería" TEXT, -- Nombre exacto de la columna
            "tamanio de la pantalla" TEXT,  -- Nombre exacto de la columna
            precio TEXT NOT NULL,       -- Mantenemos como TEXT
            lanzamiento TEXT,
            PRIMARY KEY("id")
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS Ventas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente INTEGER NOT NULL,
            producto INTEGER NOT NULL,
            fecha TEXT NOT NULL,
            FOREIGN KEY(cliente) REFERENCES Cliente(id),
            FOREIGN KEY(producto) REFERENCES Celulares(id)
        )`);
    }
});

module.exports = db;
