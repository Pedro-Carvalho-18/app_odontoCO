const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

db.all("SELECT NOME FROM TAB_MAT_ITEM LIMIT 20", (err, rows) => {
    if (err) console.error(err);
    else console.log('Sample medications:', JSON.stringify(rows, null, 2));
    db.close();
});
