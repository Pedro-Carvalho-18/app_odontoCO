import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

export async function getDb() {
  const dbPath = process.env.DATABASE_URL || path.resolve(process.cwd(), 'database/app_odonto.sqlite');
  
  const connection = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  return connection;
}
