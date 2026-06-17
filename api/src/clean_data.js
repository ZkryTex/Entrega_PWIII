// api/src/clean_data.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Asegúrate de que esta ruta apunte a la base de datos en la raíz del proyecto
const DB_PATH = path.resolve(__dirname, '../../celulares.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos para limpieza:', err.message);
    } else {
        console.log(`Conectado a la base de datos SQLite para limpieza en: ${DB_PATH}`); // Log para verificar la ruta
    }
});

async function cleanCelularesData() {
    console.log('Iniciando proceso de limpieza de datos...');

    let updatedCount = 0;

    try {
        const allCelulares = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM Celulares', [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        console.log(`Se encontraron ${allCelulares.length} celulares.`);

        for (const celular of allCelulares) {
            let needsUpdate = false;
            const updatedCelular = { ...celular };

            // --- Lógica de limpieza mejorada para 'precio' ---
            let originalPriceString = String(celular.precio || '').trim(); // Convertir a string y limpiar espacios
            let extractedPrice = 0.00; // Valor por defecto si no se encuentra un número

            // *** NUEVO CAMBIO: Eliminar comas antes de extraer el número ***
            const cleanedPriceString = originalPriceString.replace(/,/g, ''); // Elimina todas las comas

            // Expresión regular para encontrar uno o más dígitos, opcionalmente con un punto decimal
            // y más dígitos después. Busca el primer patrón numérico.
            const priceRegex = /(\d+(\.\d+)?)/;
            const match = cleanedPriceString.match(priceRegex); // Usa la cadena sin comas para la regex

            if (match && match[1]) {
                // Si se encontró un patrón numérico, intenta parsearlo
                let tempParsedPrice = parseFloat(match[1]);
                if (!isNaN(tempParsedPrice) && tempParsedPrice > 0) {
                    extractedPrice = tempParsedPrice;
                }
            }

            // Compara el precio extraído con el valor original (después de limpiarlo y formatearlo)
            // Esto asegura que solo se actualice si hay un cambio real o si el original era NaN
            const currentFormattedPrice = parseFloat(originalPriceString.replace(/,/g, '')).toFixed(2); // Formatea el original sin comas
            if (extractedPrice.toFixed(2) !== currentFormattedPrice || isNaN(parseFloat(originalPriceString.replace(/,/g, '')))) {
                updatedCelular.precio = extractedPrice.toFixed(2);
                if (originalPriceString !== updatedCelular.precio) { // Solo loguear si hubo un cambio real
                    needsUpdate = true;
                    console.log(`Celular ID ${celular.id}: Precio original '${originalPriceString}' limpiado a ${updatedCelular.precio}`);
                }
            } else {
                updatedCelular.precio = extractedPrice.toFixed(2); // Asegura el formato incluso si no cambió
            }


            // Limpiar campos TEXT que estén vacíos o null (¡Nombres de columna corregidos!)
            const textFields = ['peso', 'RAM', 'cámara frontal', 'cámara trasera', 'procesador', 'capacidad de la batería', 'tamanio de la pantalla'];
            textFields.forEach(field => {
                if (!celular[field] || String(celular[field]).trim() === '') {
                    updatedCelular[field] = 'N/A';
                    if (celular[field] !== 'N/A') needsUpdate = true; // Solo marca para actualización si no era ya N/A
                } else {
                    const cleanedValue = String(celular[field]).trim();
                    if (cleanedValue !== celular[field]) needsUpdate = true;
                    updatedCelular[field] = cleanedValue;
                }
            });

            // Limpiar 'lanzamiento'
            if (!celular.lanzamiento || String(celular.lanzamiento).trim() === '' || isNaN(new Date(celular.lanzamiento))) {
                updatedCelular.lanzamiento = '2000-01-01'; // O una fecha por defecto más genérica
                if (celular.lanzamiento !== '2000-01-01') needsUpdate = true;
            } else {
                 const dateObj = new Date(celular.lanzamiento);
                 const year = dateObj.getFullYear();
                 const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                 const day = String(dateObj.getDate()).padStart(2, '0');
                 const formattedDate = `${year}-${month}-${day}`;
                 if (formattedDate !== celular.lanzamiento) needsUpdate = true;
                 updatedCelular.lanzamiento = formattedDate;
            }


            // 3. Actualizar el celular si se detectó algún cambio
            if (needsUpdate) {
                await new Promise((resolve, reject) => {
                    const {
                        id, marca, modelo, precio, peso,
                        'RAM': RAM,
                        'cámara frontal': camara_frontal,
                        'cámara trasera': camara_trasera,
                        procesador,
                        'capacidad de la batería': capacidad_bateria,
                        'tamanio de la pantalla': tamanio_pantalla,
                        lanzamiento
                    } = updatedCelular;

                    const sql = `UPDATE Celulares SET
                                marca = ?,
                                modelo = ?,
                                peso = ?,
                                "RAM" = ?,
                                "cámara frontal" = ?,
                                "cámara trasera" = ?,
                                procesador = ?,
                                "capacidad de la batería" = ?,
                                "tamanio de la pantalla" = ?,
                                precio = ?,
                                lanzamiento = ?
                                WHERE id = ?`;
                    const params = [
                        marca,
                        modelo,
                        peso,
                        RAM,
                        camara_frontal,
                        camara_trasera,
                        procesador,
                        capacidad_bateria,
                        tamanio_pantalla,
                        precio, // Precio ya formateado como string
                        lanzamiento,
                        id
                    ];
                    db.run(sql, params, function(err) {
                        if (err) {
                            console.error(`Error al actualizar celular ID ${id}:`, err.message);
                            reject(err);
                        } else {
                            updatedCount++;
                            resolve();
                        }
                    });
                });
            }
        }

        console.log(`Proceso de limpieza completado. Se actualizaron ${updatedCount} celulares.`);

    } catch (error) {
        console.error('Error durante la limpieza de datos:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Error al cerrar la base de datos para limpieza:', err.message);
            } else {
                console.log('Conexión a la base de datos de limpieza cerrada.');
            }
        });
    }
}

cleanCelularesData();
