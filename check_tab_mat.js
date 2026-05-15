const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

// Let's check TAB_MAT_ITEM again, but maybe I queried the wrong table or it's empty
// Let's check if there's any data in TAB_MAT at all
db.all("SELECT * FROM TAB_MAT", (err, rows) => {
    if (err) console.error(err);
    else console.log('TAB_MAT content:', rows);
    db.close();
});
