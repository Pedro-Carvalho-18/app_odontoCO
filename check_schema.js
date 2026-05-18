const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

db.serialize(() => {
    db.all("PRAGMA table_info(PESSOAL)", (err, rows) => {
        console.log("PESSOAL schema:", rows.map(r => r.name).join(", "));
    });
    db.all("PRAGMA table_info(PRESTADOR)", (err, rows) => {
        console.log("PRESTADOR schema:", rows.map(r => r.name).join(", "));
    });
    db.all("PRAGMA table_info(PACIENTE)", (err, rows) => {
        if (err) console.log("PACIENTE table might not exist:", err.message);
        else console.log("PACIENTE schema:", rows.map(r => r.name).join(", "));
    });
});
db.close();