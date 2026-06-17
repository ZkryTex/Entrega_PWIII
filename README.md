# APP de venta de celulares

## Descripción
Esta API proporciona acceso a un catálogo de celulares cargado desde una base de datos, permite realizar operaciones de compra-venta y administrar una base de datos de celulares y clientes.

Incluye:
- Gestión de celulares (CRUD)
- Gestión de clientes
- Registro de ventas
- Interfaz web
- Base de datos relacional (SQLite)
- Pruebas end-to-end

## Origen de los datos
Los datos se cargan al iniciar el servidor desde la base de datos celulares.db, que contiene información técnica de diversos modelos de teléfonos móviles.

La fuente de la base de datos proviene de: https://www.kaggle.com/datasets/abdulmalik1518/mobiles-dataset-2025

## Tecnologías utilizadas

### Frontend
- **HTML5**
- **CSS3**
- **JavaScript** (Vanilla)

### Backend
+ **Node.js**
+ **Express**
+ **csv-parser**
+ **Morgan**
+ **SQLite**

### Pruebas automatizadas
- **Cypress** (automatización E2E)


## Interfaz Web
Desde la interfaz desarrollada con HTML, CSS y JS se pueden:
- Visualizar celulares disponibles
- Agregar nuevos productos
- Filtrar celulares por marca o precio
- Ver, agregar y gestionar clientes
- Registrar ventas seleccionando cliente y celular

## Pruebas Automatizadas

Las pruebas se implementaron con Cypress y cubren:
- Navegación en la interfaz
- Filtrado de productos
- Creación de clientes y ventas

## Endpoints implementados

### CRUD Básico
- `GET /celulares` - Lista todos los celulares
- `GET /celulares/:id` - Obtiene un celular por ID
- `POST /celulares` - Agrega un nuevo celular
- `PUT /celulares/:id` - Actualiza un celular existente
- `DELETE /celulares/:id` - Elimina un celular

### Endpoints Avanzados

**Filtrar por empresa**
   - `GET /celulares/empresa/:empresa`
   - Filtra celulares por nombre de empresa (búsqueda parcial case-insensitive)
   - Ejemplo: `/celulares/empresa/samsung`


## Códigos de Respuesta
La API utiliza los siguientes códigos HTTP:
- 200: OK - Solicitud exitosa
- 201: Created - Recurso creado (POST)
- 204: No Content - Recurso eliminado (DELETE)
- 400: Bad Request - Parámetros inválidos
- 404: Not Found - Recurso no encontrado

## Pruebas
Se recomienda usar Postman, Bruno o cualquier cliente HTTP para probar los endpoints.
