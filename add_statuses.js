const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database/app_odonto.sqlite');
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

async function addStatuses() {
  const db = await getDb();
  
  const newStatuses = [
    { REGISTRO: '5', NOME: 'Confirmado', CODIGO: '05', NROCOR: '32768' }, // Verde
    { REGISTRO: '6', NOME: 'Ainda não confirmado', CODIGO: '06', NROCOR: '32896' }, // Laranja/Amarelo
    { REGISTRO: '7', NOME: 'Agendado', CODIGO: '07', NROCOR: '16711680' } // Azul
  ];

  for (const s of newStatuses) {
    // Check if already exists
    const exists = await db.get("SELECT 1 FROM __STATUS_AGENDA WHERE CODIGO = ?", [s.CODIGO]);
    if (!exists) {
      await db.run(
        "INSERT INTO __STATUS_AGENDA (REGISTRO, NOME, CODIGO, NROCOR, BLOQUEAR, FL_OCUPADO) VALUES (?, ?, ?, ?, '0', '1')",
        [s.REGISTRO, s.NOME, s.CODIGO, s.NROCOR]
      );
      console.log(`Status added: ${s.NOME}`);
    } else {
      console.log(`Status already exists: ${s.NOME}`);
    }
  }

  await db.close();
}

addStatuses();
