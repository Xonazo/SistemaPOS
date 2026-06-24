const express = require('express');
const bodyParser = require('body-parser');
 const cors = require('cors');
 require('dotenv').config();
const cookieParser = require('cookie-parser');


 
const categoriesRoutes = require('./routes/categories');
const ordersRoutes = require('./routes/orders');
const productsRoutes = require('./routes/products');
const agregadosRoutes = require('./routes/agregados');
const printerRoutes = require('./routes/printer.route');
const authRoutes = require('./routes/auth');
const { authenticateToken } = require('./middleware/auth');

  


const corsOptions = {
    credentials: true, // CRÍTICO: Permitir cookies
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:54321',
      'http://192.168.18.150:54321',
      'http://192.168.18.46:54321', // Tu IP específica
      'http://127.0.0.1:54321',
      'http://192.168.18.46:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:54321',
      'http://192.168.18.54:54321',
      'http://192.168.18.80:54321',
      'http://169.254.189.57:54321',
      'http://192.168.18.80:54321',
      'http://192.168.18.55:54321',
      'http://192.168.18.198:54321',
      'http://192.168.1.15:54321',
      'http://192.168.1.6:54321',
      'http://192.168.1.14:54321',
      'http://192.168.1.19:54321',
      'http://192.168.1.10:54321',
      'http://192.168.1.50:54321'
      
    ];
    
    if (process.env.NODE_ENV === 'development' && !origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS bloqueado para origin:', origin);
      callback(new Error(`CORS: Origin ${origin} no permitido`));
    }
  },
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
allowedHeaders: [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin'
],
  exposedHeaders: ['Set-Cookie'],
};



const app = express();
app.use(cors(corsOptions)); // CORS primero
app.use(express.json());  
app.use(cookieParser());

app.use((req, res, next) => {
  console.log('Cookies recibidas en', req.path, ':', req.cookies);
  next();
});

app.use('/auth', authRoutes);

// app.use((req, res, next) => {
//   console.log('Cookies recibidas:', req.cookies);
//   next();
// });


// Rutas
app.use('/categories',authenticateToken, categoriesRoutes);
app.use('/orders',authenticateToken, ordersRoutes);
app.use('/products',authenticateToken, productsRoutes);
app.use('/agregados',authenticateToken, agregadosRoutes);
app.use('/printer',authenticateToken, printerRoutes);



// Manejo de errores básico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

// app.listen(3001, '0.0.0.0', () => {
//   console.log('Backend corriendo en todas las interfaces');
// });