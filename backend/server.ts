import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { pool } from './src/database/dbconfig';
import authRoutes from './src/database/routes/auth';

config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/users', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully');
  pool.end();
  process.exit(0);
});
