const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

const tablesToCheck = ['REST_TERAPEUTICA', 'TAB_MAT', 'TAB_MAT_ITEM'];

db.serialize(() => {
    tablesToCheck.forEach(t => {
        db.all(`PRAGMA table_info(${t})`, (err, cols) => {
             if (err) return;
             console.log(`Table ${t} columns:`, cols.map(c => c.name));
        });
        db.all(`SELECT * FROM ${t} LIMIT 1`, (err, rows) => {
             if (err) return;
             console.log(`Table ${t} sample:`, rows);
        });
    });
});
