import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { pool } from './src/database/dbconfig';
import authRoutes from './src/database/routes/auth';
import garageRoutes from './src/database/routes/garage'; 
import adminRoutes from './src/database/routes/admin'; 

config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', authRoutes);
app.use('/api/garage', garageRoutes);
app.use('/api/admin', adminRoutes); 

const PORT = process.env.PORT || 3000;
app.get('/health', (req, res) => {
  res.status(200).send('healthy');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully');
  pool.end();
  process.exit(0);
});