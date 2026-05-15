const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/app_odonto.sqlite');

const tables = ['INTERVENCAO', 'ARCADA', 'DENTE', 'FACE', 'HISTORICO'];

db.serialize(() => {
  tables.forEach(table => {
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err) {
        console.error(`Error inspecting table ${table}:`, err);
        return;
      }
      console.log(`--- Table: ${table} ---`);
      rows.forEach(row => {
        console.log(`${row.name} (${row.type})`);
      });
    });
  });
});

db.close();
