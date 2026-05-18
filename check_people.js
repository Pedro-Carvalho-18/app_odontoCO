const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

db.serialize(() => {
    db.all("SELECT CODIGO, NOME, TIPO FROM PESSOAL LIMIT 5", (err, rows) => {
        if (err) console.error("PESSOAL error:", err.message);
        else console.log("PESSOAL:", rows);
    });
    db.all("SELECT CODIGO, NOME FROM PRESTADOR LIMIT 5", (err, rows) => {
        if (err) console.error("PRESTADOR error:", err.message);
        else console.log("PRESTADOR:", rows);
    });
});
db.close();