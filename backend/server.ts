import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { pool } from './src/database/dbconfig';
import authRoutes from './src/database/routes/auth';
import garageRoutes from './src/database/routes/garage';
import adminRoutes from './src/database/routes/admin';
import exploreRoutes from './src/database/routes/explore';
import rankingsRoutes from './src/database/routes/rankings';

config();

const app = express();

app.use(cors());
app.use(express.json());

// Mount routes with debug logs
function mountAndLog(basePath: string, router: any) {
  if (!router) {
    console.error(`[SERVER] ❌ Router for ${basePath} is undefined!`);
    return;
  }
  app.use(basePath, router);
  console.log(`[SERVER] ✅ Mounted router at ${basePath}`);
}

mountAndLog('/api/users', authRoutes);
mountAndLog('/api/garage', garageRoutes);
mountAndLog('/api/admin', adminRoutes);
mountAndLog('/api/explore', exploreRoutes);
mountAndLog('/api/rankings', rankingsRoutes);

app.get('/health', (req, res) => {
  res.status(200).send('healthy');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[SERVER] 🚀 Server running on port ${PORT}`);
  console.log('[SERVER] 📋 Listing all registered routes:');
  listRoutes(app);
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully');
  pool.end();
  process.exit(0);
});

/**
 * Recursively list all routes and methods in the app.
 */
function listRoutes(appOrRouter: any, parentPath = '') {
  const stack = appOrRouter.stack || [];
  stack.forEach((layer: any) => {
    if (layer.route && layer.route.path) {
      // Route with methods
      const routePath = parentPath + layer.route.path;
      const methods = Object.keys(layer.route.methods)
        .map((m) => m.toUpperCase())
        .join(', ');
      console.log(`   ${methods.padEnd(10)} ${routePath}`);
    } else if (layer.name === 'router' && layer.handle.stack) {
      // Nested router, recurse into it
      const newParentPath = parentPath + (layer.regexp.source
        .replace('^\\', '')
        .replace('\\/?(?=\\/|$)', '')
        .replace(/\\\//g, '/')
        .replace(/\$$/, '') || '');
      listRoutes(layer.handle, newParentPath);
    }
  });
}
