import express from 'express';
import cors from 'cors';
import { config, SERVER_PUBLIC_DIR, CLIENT_PUBLIC_DIR } from './config/database.js';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Serve local static images directly
app.use('/images', express.static(`${SERVER_PUBLIC_DIR}/images`));
app.use('/images', express.static(`${CLIENT_PUBLIC_DIR}/images`));

// Mount Central API Router
app.use('/api', apiRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'DeepShop E-Commerce API',
    database: 'JSON File System',
    timestamp: new Date().toISOString()
  });
});

// 404 & Error Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🚀 DeepShop Backend Server is running on http://localhost:${config.port}`);
  console.log(`📂 JSON Database directory: ${config.dataDir}`);
});
