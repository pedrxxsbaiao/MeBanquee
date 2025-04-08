import { sql } from 'drizzle-orm';
import { users, matches, messages } from '../schema';

export async function up(db: any) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      gender VARCHAR(50) NOT NULL,
      age INTEGER NOT NULL,
      bio TEXT,
      photo_url VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      user_id1 INTEGER NOT NULL REFERENCES users(id),
      user_id2 INTEGER NOT NULL REFERENCES users(id),
      status VARCHAR(50) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      match_id INTEGER NOT NULL REFERENCES matches(id),
      sender_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

export async function down(db: any) {
  await db.execute(sql`
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS matches;
    DROP TABLE IF EXISTS users;
  `);
} 