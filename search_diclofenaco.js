const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

// Let's search for the drug name "Diclofenaco" in all tables. That's a good way to find the table.
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) return;
    tables.forEach(table => {
        db.all(`SELECT * FROM ${table.name} WHERE NOME LIKE '%Diclofenaco%' LIMIT 1`, (err, rows) => {
             if (rows && rows.length > 0) console.log('Found in table:', table.name, rows);
        });
    });
    db.close();
});
