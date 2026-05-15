const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/app_odonto.sqlite');

db.all(`SELECT * FROM INTERVENCAO WHERE S_DENTES IS NOT NULL AND S_DENTES != '' LIMIT 20`, (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('--- Sample INTERVENCAO ---');
  console.log(JSON.stringify(rows, null, 2));
});

db.all(`SELECT * FROM FACE LIMIT 20`, (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('--- Sample FACE ---');
  console.log(JSON.stringify(rows, null, 2));
});

db.all(`SELECT * FROM DENTE LIMIT 20`, (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('--- Sample DENTE ---');
  console.log(JSON.stringify(rows, null, 2));
});

db.close();
