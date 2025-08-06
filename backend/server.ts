import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { pool } from './src/database/dbconfig';

config();

console.log('[SERVER] Starting server initialization...');
console.log('[SERVER] JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('[SERVER] Current working directory:', process.cwd());

console.log('[SERVER] Loading route files...');

let authRoutes, garageRoutes, adminRoutes, exploreRoutes, rankingsRoutes;

try {
  console.log('[SERVER] Loading auth routes...');
  authRoutes = require('./src/database/routes/auth').default;
  console.log('[SERVER] Auth routes loaded successfully');
} catch (error: any) {
  console.error('[SERVER] Failed to load auth routes:', error.message);
  console.error(error.stack);
}

try {
  console.log('[SERVER] Loading garage routes...');
  garageRoutes = require('./src/database/routes/garage').default;
  console.log('[SERVER] Garage routes loaded successfully');
} catch (error: any) {
  console.error('[SERVER] Failed to load garage routes:', error.message);
}

try {
  console.log('[SERVER] Loading admin routes...');
  adminRoutes = require('./src/database/routes/admin').default;
  console.log('[SERVER] Admin routes loaded successfully');
} catch (error: any) {
  console.error('[SERVER] Failed to load admin routes:', error.message);
}

try {
  console.log('[SERVER] Loading explore routes...');
  exploreRoutes = require('./src/database/routes/explore').default;
  console.log('[SERVER] Explore routes loaded successfully');
} catch (error: any) {
  console.error('[SERVER] Failed to load explore routes:', error.message);
}

try {
  console.log('[SERVER] Loading rankings routes...');
  rankingsRoutes = require('./src/database/routes/rankings').default;
  console.log('[SERVER] Rankings routes loaded successfully');
} catch (error: any) {
  console.error('[SERVER] Failed to load rankings routes:', error.message);
  console.error(error.stack);
}

const app = express();

app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  next();
});

console.log('[SERVER] Registering routes...');

if (authRoutes) {
  app.use('/api/users', authRoutes);
  console.log('[SERVER] Registered /api/users routes');
} else {
  console.error('[SERVER] Auth routes not loaded, skipping registration');
}

if (garageRoutes) {
  app.use('/api/garage', garageRoutes);
  console.log('[SERVER] Registered /api/garage routes');
} else {
  console.error('[SERVER] Garage routes not loaded, skipping registration');
}

if (adminRoutes) {
  app.use('/api/admin', adminRoutes);
  console.log('[SERVER] Registered /api/admin routes');
} else {
  console.error('[SERVER] Admin routes not loaded, skipping registration');
}

if (exploreRoutes) {
  app.use('/api/explore', exploreRoutes);
  console.log('[SERVER] Registered /api/explore routes');
} else {
  console.error('[SERVER] Explore routes not loaded, skipping registration');
}

if (rankingsRoutes) {
  app.use('/api/rankings', rankingsRoutes);
  console.log('[SERVER] Registered /api/rankings routes');
} else {
  console.error('[SERVER] Rankings routes not loaded, skipping registration');
}

const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.status(200).send('healthy');
});

// Catch-all route for 404s
app.use((req, res) => {
  console.log(`[SERVER] Unhandled route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Route not found', 
    path: req.originalUrl,
    method: req.method 
  });
});

app.listen(PORT, () => {
  console.log(`[SERVER] Server running on port ${PORT}`);
  console.log('[SERVER] All routes registered successfully');
  // Removed the problematic _router.stack code
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully');
  pool.end();
  process.exit(0);
});