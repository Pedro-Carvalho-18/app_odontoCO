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
  WHERE I.STATUS != '3' AND I.VALOR_PACIENTE > 0
`;

db.all(query, (err, rows) => {
  if (err) { console.error(err); return; }
  
  const included = [];
  const excluded = [];
  
  rows.forEach(inter => {
    let total = 1;
    const notes = inter.notes || "";
    
    if (notes.includes('/')) {
      const match = notes.match(/\/(\d+)x\)/);
      if (match) total = parseInt(match[1]) || 1;
    } else if (notes.includes('(')) {
      const match = notes.match(/\((\d+)x\)/);
      if (match) total = parseInt(match[1]) || 1;
    }

    const paid = parseInt(inter.paidInst || '0') || 0;
    
    if (paid < total) {
      included.push(inter);
    } else {
      excluded.push(inter);
    }
  });

  console.log("TOTAL ROWS:", rows.length);
  console.log("INCLUDED (PENDING):", included.length);
  console.log("EXCLUDED (PAID):", excluded.length);
  
  console.log("\nSAMPLE EXCLUDED (First 10):");
  console.log(JSON.stringify(excluded.slice(0, 10), null, 2));

  db.close();
});
