import { createServer as createViteServer } from 'vite';
import express from 'express';
import path from 'path';

export const log = (message: string) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

export const setupVite = async (app: express.Express) => {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  app.use(vite.middlewares);
};

export const serveStatic = () => {
  return express.static(path.join(__dirname, '../dist/client'), {
    index: false,
  });
}; 