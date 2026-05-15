const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

// Maybe they are in the CATALOGO table?
db.all("SELECT * FROM CATALOGO LIMIT 5", (err, rows) => {
    if (err) console.error(err);
    else console.log('CATALOGO sample:', rows);
    db.close();
});
