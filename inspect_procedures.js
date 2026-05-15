const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

db.serialize(() => {
    // Check TAB_GEN_ITEM
    db.all("SELECT COUNT(*) as count FROM TAB_GEN_ITEM", (err, rows) => {
        console.log("TAB_GEN_ITEM count:", rows[0].count);
    });

    db.all("SELECT DISTINCT INATIVO FROM TAB_GEN_ITEM", (err, rows) => {
        console.log("TAB_GEN_ITEM INATIVO values:", JSON.stringify(rows));
    });

    // See if there are procedures without specialties
    db.all("SELECT COUNT(*) as count FROM TAB_GEN_ITEM WHERE ID_ESPECIALIDADE IS NULL", (err, rows) => {
        console.log("Procedures with NULL specialty:", rows[0].count);
    });

    // Sample some procedures that might be missing
    db.all("SELECT NOME, INATIVO FROM TAB_GEN_ITEM LIMIT 10", (err, rows) => {
        console.log("Sample procedures:", JSON.stringify(rows));
    });
});
db.close();
