const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

db.serialize(() => {
    db.all("PRAGMA table_info(CONVENIO)", (err, columns) => {
        console.log("CONVENIO columns:", JSON.stringify(columns.map(c => c.name)));
    });
    db.all("PRAGMA table_info(UNIDADE)", (err, columns) => {
        console.log("UNIDADE columns:", JSON.stringify(columns.map(c => c.name)));
    });
});
db.close();
