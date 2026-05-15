const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

// Let's look for tables with 'MED' and list all of them
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%MED%'", (err, tables) => {
    if (err) console.error(err);
    else console.log('Tables with MED:', tables.map(t => t.name));
    db.close();
});
