const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function checkJair() {
  const dbPath = path.resolve(process.cwd(), 'database/app_odonto.sqlite');
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  
  console.log('--- Buscando registros de Jair Ferraz Costa ---');
  
  const results = await db.all(`
    SELECT 'CCPACIENTE' as source, HISTORICO, VALOR, DATA, NROPAC 
    FROM CCPACIENTE 
    WHERE HISTORICO LIKE '%Jair Ferraz Costa%'
    UNION ALL
    SELECT 'CCCIRURGIAO' as source, HISTORICO, VALOR, DATA, ID_PRESTADOR 
    FROM CCCIRURGIAO 
    WHERE HISTORICO LIKE '%Jair Ferraz Costa%'
    ORDER BY DATA DESC
    LIMIT 20
  `);
  
  console.log(JSON.stringify(results, null, 2));
  await db.close();
}
checkJair();
