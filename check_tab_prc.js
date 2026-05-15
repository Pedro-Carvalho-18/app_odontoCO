const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

db.all("SELECT * FROM TAB_PRC LIMIT 10", (err, rows) => {
    if (err) console.error(err);
    else console.log('TAB_PRC sample:', rows);
    db.close();
});
