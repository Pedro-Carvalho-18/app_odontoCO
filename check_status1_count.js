const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database/app_odonto.sqlite');

const query = `
  SELECT 
    I.NROINTPAC, 
    I.VALOR_PACIENTE as value,
    I.ORCAMENTO as paidInst, 
    I.OBSERV as notes, 
    I.STATUS,
    I.DATCAD as date,
    TRIM(P.PRINOM || ' ' || COALESCE(P.SEGNOM, '')) as patientName
  FROM INTERVENCAO I
  LEFT JOIN PESSOAL P ON I.NROPAC = P.NROPAC
  WHERE I.STATUS = '1' AND I.VALOR_PACIENTE > 0
`;

db.all(query, (err, rows) => {
  if (err) { console.error(err); return; }
  console.log("STATUS 1 (EM ABERTO) WITH VALUE > 0 COUNT:", rows.length);
  console.log("SAMPLE:");
  console.log(JSON.stringify(rows.slice(0, 5), null, 2));
  db.close();
});
