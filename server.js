const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

const db = require('./db/database');
const seed = require('./db/seed');
const { cartMiddleware } = require('./middleware/auth');
const { securityHeaders } = require('./middleware/security');

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(securityHeaders);
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
const sessionSecret =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

if (!process.env.SESSION_SECRET) {
  console.warn(
    '[security] SESSION_SECRET not set — generated a random secret for this run. Sessions reset on restart.'
  );
}

app.use(
  session({
    store: new SQLiteStore({
      db: 'sessions.db',
      dir: path.join(__dirname, 'db')
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  })
);

// Cart & User locals middleware
app.use(cartMiddleware);

// Routes
app.use('/', authRoutes);
app.use('/', productsRoutes);
app.use('/', cartRoutes);
app.use('/', ordersRoutes);

// Health check (for uptime monitors / containers)
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    name: 'ShopSphere',
    uptimeSeconds: Math.round(process.uptime())
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('index', {
    title: '404 - Page Not Found',
    products: [],
    categories: [],
    selectedCategory: 'all',
    searchQuery: '',
    selectedSort: 'default',
    featuredProducts: [],
    error: 'The page you requested could not be found.'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await seed();
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`🚀 ShopSphere is running!`);
      console.log(`🌐 Server active at: http://localhost:${PORT}`);
      console.log(`==================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
