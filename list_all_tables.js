const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

// Just print all table names to be sure
db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
    if (err) console.error(err);
    else {
        console.log('ALL TABLES:');
        tables.forEach(t => console.log(t.name));
    }
    db.close();
});
