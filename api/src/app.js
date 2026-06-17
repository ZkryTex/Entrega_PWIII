const express = require('express');
const app = express();
const PORT = 7050;
const db = require('./database');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); // Buenas prácticas
const jwt = require('jsonwebtoken'); // Buenas prácticas
const bcrypt = require('bcryptjs'); // Buenas prácticas
const morgan = require('morgan'); // Buenas prácticas
const celularesRoutes = require('./routes/celulares');
const clientesRoutes = require('./routes/clientes');
const ventasRoutes = require('./routes/ventas');

const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

app.get('/gestion', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/gestion.html'));
});


//------------- Buenas prácticas de seguridad -------------------------------------------------------------------

//Morgan!
app.use(morgan('combined')); // Log de peticiones

//Utilizamos CORS

const corsOptions = {
    origin: 'http://localhost:7050',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

/*
//Utilizamos HTTPS 
app.use ((req, res, next) => {
    if (!req.secure) {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
})
*/

// Limitamos la cantidad de peticiones para evitar ataques de fuerza bruta
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    message: 'Demasiadas peticiones desde la misma IP, intentá de nuevo en 15 minutos'
});

app.use('/limitado', limiter);

const users = [
    { id: 1, username: 'admin', password: '123', role: 'rol_admin' },
    { id: 2, username: 'user', password: '123', role: 'rol_user' }
];

// Generamos un token
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            "123456",
            { expiresIn: "1h" }
        );
        res.json({ token });
    } else {
        res.status(401).json({ message: "Crredenciales Incorrectas" })
    }
})

//Verificamos el token
const verifyToken =(req,res,next) => {
    const token= req.headers["authorization"]

    if(!token) return res.status(403).json({message:"Token Requerido"})

    jwt.verify(token.split(" ")[1], "123456",(err,decoded) =>{
        if (err) return res.status(401).json({message:"Token Invalido"})
        req.user = decoded //guardamos la informacion del usuario en el request
        next()    
    })
}

//Verificamos el rol del usuario
const authorizationRole = (roles)=>{
    return (req, res, next)=>{
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({error:"Aceeso no autorizado"})
        }    
        next()
    }
}

// Cualquier usuario con token puede VER (GET)
/*
app.get("/api/celulares", verifyToken, (req, res) => {
    res.json(celulares);
});

*/

// Solo el Admin puede borrar (DELETE)
app.delete("/api/celulares/:id", verifyToken, authorizationRole(["rol_admin"]), (req, res) => {
});

async function fetchData(url) {
    const token = localStorage.getItem('accessToken'); // Busca el token guardado
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}` // Lo envía al servidor
            }
        });
        if (!response.ok) throw new Error('Error en la petición');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// Middleware para autorizar solo a administradores
const isAdmin = (req, res, next) => {
    // req.user viene de lo que guardaste en el verifyToken
    if (req.user && req.user.role === 'rol_admin') {
        next(); // Es admin, lo dejamos pasar
    } else {
        // No es admin, le tiramos un error 403 (Prohibido)
        res.status(403).json({ 
            message: "Acceso denegado: No tienes permisos de administrador para realizar esta acción." 
        });
    }
};

app.post("/api/celulares", verifyToken, isAdmin, (req, res) => { /* agregar */ });
app.put("/api/celulares/:id", verifyToken, isAdmin, (req, res) => { /* editar */ });
app.delete("/api/celulares/:id", verifyToken, isAdmin, (req, res) => { /* borrar */ });


//Validación y sanitización de datos
const { body, validationResult } = require('express-validator');

app.post("/api/celulares", [
    verifyToken,
    isAdmin,
    // Reglas de validación y sanitización
    body('marca').trim().escape().isLength({ min: 2 }),
    body('modelo').trim().escape().notEmpty(),
    body('precio').isNumeric().withMessage('El precio debe ser un número')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errores: errors.array() });
    }
});


//---------------------------------------------------------------------------------------------------------------


// Middleware para parsear JSON en las solicitudes de la API
app.use(express.json());

// Montar rutas de la API
app.use('/api/celulares', celularesRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ventas', ventasRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor de API y Frontend corriendo en http://localhost:7050`);
});

const client = require('prom-client');

// métricas por defecto (CPU, memoria, etc)
client.collectDefaultMetrics();

// endpoint /metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
