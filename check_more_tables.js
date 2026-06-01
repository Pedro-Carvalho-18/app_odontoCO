const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'app_odonto.sqlite');
const db = new sqlite3.Database(dbPath);

const tables = ['HISTORICO', 'CUSTOMDATA', 'CUSTOMMEMO', 'ARQUIVO_PACIENTE'];

db.serialize(() => {
    tables.forEach(t => {
        db.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${t}'`, (err, row) => {
            if (row) {
                console.log(`Table: ${t}`);
                console.log(`Schema: ${row.sql}`);
                console.log('---');
            }
        });
    });
});
db.close();
