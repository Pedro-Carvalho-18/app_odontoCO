import { getDb } from "./sqlite";

/**
 * Sistema de Migração Automática
 * Este script garante que o banco de dados do cliente sempre tenha a estrutura correta,
 * adicionando colunas ou tabelas novas sem apagar os dados existentes.
 */

async function initMigrationTable(db: any) {
  await db.run(`
    CREATE TABLE IF NOT EXISTS _SISTEMA_MIGRACOES (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      versao TEXT UNIQUE,
      data_aplicada DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function runMigrations() {
  const db = await getDb();
  await initMigrationTable(db);

  const migrations = [
    {
      version: "1.0.0",
      description: "Estrutura Inicial",
      run: async () => {
        // A estrutura inicial já vem do CSV, então apenas registramos
      }
    },
    {
      version: "1.0.1",
      description: "Adicionar logs de sistema",
      run: async () => {
        await db.run(`
          CREATE TABLE IF NOT EXISTS _SISTEMA_LOGS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nivel TEXT,
            mensagem TEXT,
            contexto TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }
    }
    // NOVAS MIGRAÇÕES SERÃO ADICIONADAS AQUI
    // Exemplo: { version: "1.0.2", run: async () => { await db.run("ALTER TABLE PRESTADOR ADD COLUMN CPF_NOVO TEXT"); } }
  ];

  for (const m of migrations) {
    const applied = await db.get("SELECT id FROM _SISTEMA_MIGRACOES WHERE versao = ?", [m.version]);
    if (!applied) {
      console.log(`Aplicando migração ${m.version}: ${m.description || ''}`);
      try {
        await m.run();
        await db.run("INSERT INTO _SISTEMA_MIGRACOES (versao) VALUES (?)", [m.version]);
      } catch (err) {
        console.error(`Erro na migração ${m.version}:`, err);
        throw err;
      }
    }
  }
}
