const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

db.all("PRAGMA table_info(INTERVENCAO)", (err, cols) => {
    console.log("INTERVENCAO columns:", cols);
    db.all("SELECT * FROM INTERVENCAO LIMIT 1", (err, row) => {
        console.log("INTERVENCAO row sample:", row);
        db.close();
    });
});
