const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

db.all("SELECT DISTINCT STATTRA FROM TRATAMENTO", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Distinct STATTRA values:", rows);
    db.close();
});
