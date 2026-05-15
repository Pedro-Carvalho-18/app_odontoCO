const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/app_odonto.sqlite');

db.all(`
  SELECT 
    I.NROPAC, 
    I.NROINTPAC, 
    I.NROINT, 
    D.NRODEN,
    D.BITMAP,
    F.FACE1, F.FACE2, F.FACE3, F.FACE4, F.FACE5
  FROM INTERVENCAO I
  LEFT JOIN DENTE D ON I.NROPAC = D.NROPAC AND I.NROINTPAC = D.NROINTPAC
  LEFT JOIN FACE F ON I.NROPAC = F.NROPAC AND I.NROINTPAC = F.NROINTPAC
  WHERE I.NROPAC = '1'
  LIMIT 50
`, (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('--- Combined Data for Patient 1 (Corrected) ---');
  console.log(JSON.stringify(rows, null, 2));
});

db.close();
