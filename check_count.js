const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

db.get("SELECT count(*) as count FROM TAB_MAT_ITEM", (err, row) => {
    if (err) console.error(err);
    else console.log('Count:', row.count);
    db.close();
});
