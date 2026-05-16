const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database/app_odonto.sqlite');

const query = `
  SELECT 
    I.NROINTPAC, 
    I.VALOR_PACIENTE, 
    I.ORCAMENTO as paidInst, 
    I.OBSERV as notes, 
    I.STATUS,
    I.DATCAD,
    TRIM(P.PRINOM || ' ' || COALESCE(P.SEGNOM, '')) as patientName
  FROM INTERVENCAO I
  LEFT JOIN PESSOAL P ON I.NROPAC = P.NROPAC
  WHERE I.STATUS != '3' AND I.VALOR_PACIENTE > 0
  ORDER BY I.DATCAD DESC
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
