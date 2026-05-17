const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function check() {
    const dbPath = path.join(__dirname, 'database', 'app_odonto.sqlite');
    const db = new sqlite3.Database(dbPath);

    db.all("SELECT * FROM DEF_ITEM LIMIT 5", [], (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log(JSON.stringify(rows, null, 2));
        }
        db.close();
    });
}

check();
