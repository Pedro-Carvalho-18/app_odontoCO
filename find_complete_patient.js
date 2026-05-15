const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function find() {
  const dbPath = path.resolve(process.cwd(), 'database/app_odonto.sqlite');
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  
  const topPatients = await db.all(`
    SELECT 
      PA.NROPAC as id,
      PA.PRINOM as name,
      COUNT(RI.ID_RSP_ITEM) as responseCount
    FROM PESSOAL PA
    JOIN ANAMNESE_RSP R ON PA.NROPAC = R.ID_PESSOA
    JOIN ANAMNESE_RSP_ITEM RI ON R.ID_RSP = RI.ID_RSP
    WHERE RI.ID_OPCAO_RSP = '2' OR (RI.TX_COMPLEMENTO IS NOT NULL AND RI.TX_COMPLEMENTO != '')
    GROUP BY PA.NROPAC, PA.PRINOM
    ORDER BY responseCount DESC
    LIMIT 5
  `);
  console.log(JSON.stringify(topPatients, null, 2));
  await db.close();
}
find();
