const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

db.all("SELECT * FROM TAB_PRT_ITEM LIMIT 10", (err, rows) => {
    if (err) console.error(err);
    else console.log('TAB_PRT_ITEM sample:', rows);
    db.close();
});
