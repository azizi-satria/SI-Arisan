import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db.js';
import periodRoutes from './server/routes/periodRoutes.js';
import memberRoutes from './server/routes/memberRoutes.js';
import { errorHandler, requestLogger } from './server/middleware/errorMiddleware.js';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Connect to MongoDB Atlas via Mongoose
  const dbConnected = await connectDB();

  // Standard express JSON parsing & Logging
  app.use(express.json());
  app.use(requestLogger);

  // Base API Endpoints
  app.use('/api/periods', periodRoutes);
  app.use('/api/periods', memberRoutes); // Handles members, payments, winners, and expenses under periods

  // Server health & status API
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'active',
      mongodb: dbConnected ? 'connected' : 'warning_local_fallback',
      message: dbConnected 
        ? 'Terhubung dengan MongoDB Atlas.' 
        : 'Berjalan tanpa MongoDB Atlas. Harap isi MONGO_URI di tab Settings.'
    });
  });

  // Vite development server middleware OR production static hosting
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('⚡ Vite dev server integrated as middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('📦 Serving compiled static client files in production.');
  }

  // Register Global Error Handler
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
