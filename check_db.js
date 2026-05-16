const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database/app_odonto.sqlite');
db.all("SELECT NROINTPAC, OBSERV, STATUS, ORCAMENTO FROM INTERVENCAO WHERE NROPAC = '1037' ORDER BY DATCAD DESC LIMIT 5", (err, rows) => { 
  if (err) console.error(err);
  else console.log(JSON.stringify(rows, null, 2)); 
  db.close(); 
});
