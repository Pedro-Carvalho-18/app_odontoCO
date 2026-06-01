const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'app_odonto.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM HISTORICO WHERE DESCRICAO LIKE '%atestado%' COLLATE NOCASE", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Found ${rows.length} records in HISTORICO`);
        rows.forEach(row => {
            console.log('---');
            console.log(`Paciente: ${row.NROPAC}`);
            console.log(`Data: ${row.DATA}`);
            console.log(`Descrição: ${row.DESCRICAO}`);
        });
    }
    db.close();
});
