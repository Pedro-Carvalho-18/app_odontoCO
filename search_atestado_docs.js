const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'app_odonto.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM LOG_DOCUMENTO WHERE TIPO LIKE '%atestado%' OR NOME LIKE '%atestado%' OR TEXTO LIKE '%atestado%' COLLATE NOCASE", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Found ${rows.length} records in LOG_DOCUMENTO`);
        rows.forEach(row => {
            console.log('---');
            console.log(`ID: ${row.ID_DOCUMENTO}`);
            console.log(`Paciente: ${row.NROPAC}`);
            console.log(`Tipo: ${row.TIPO}`);
            console.log(`Nome: ${row.NOME}`);
            console.log(`Texto: ${row.TEXTO ? row.TEXTO.substring(0, 100) + '...' : 'null'}`);
        });
    }
    db.close();
});
