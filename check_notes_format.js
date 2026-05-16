const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database/app_odonto.sqlite');

const query = `
  SELECT 
    I.NROINTPAC, 
    I.OBSERV as notes, 
    I.VALOR_PACIENTE,
    I.ORCAMENTO as paidInst
  FROM INTERVENCAO I
  WHERE I.STATUS != '3' 
  AND I.OBSERV LIKE '%x%'
  AND I.OBSERV NOT LIKE '%(%x)%'
  AND I.OBSERV NOT LIKE '%/%x)%'
  LIMIT 50
`;

db.all(query, (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
