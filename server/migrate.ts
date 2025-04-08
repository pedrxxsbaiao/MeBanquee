import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { up } from './migrations/0000_initial';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não está definida nas variáveis de ambiente');
}

async function migrate() {
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('Executando migrações...');
    await up(db);
    console.log('Migrações concluídas com sucesso!');
  } catch (error) {
    console.error('Erro ao executar migrações:', error);
  } finally {
    await client.end();
  }
}

migrate(); 