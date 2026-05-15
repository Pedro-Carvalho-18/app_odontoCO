const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

db.serialize(() => {
    // 1. Check for duplicate procedure names
    db.all(`
        SELECT TRIM(NOME) as name, COUNT(*) as count 
        FROM TAB_GEN_ITEM 
        GROUP BY TRIM(NOME) 
        HAVING count > 1
    `, (err, rows) => {
        console.log("Duplicate procedure names:", rows ? rows.length : 0);
        if (rows && rows.length > 0) {
            console.log("Sample duplicates:", JSON.stringify(rows.slice(0, 5)));
        }
    });

    // 2. Look for other potentially useful tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        const interesting = tables.filter(t => 
            t.name.includes('CONVENIO') || 
            t.name.includes('UNIDADE') || 
            t.name.includes('PLANO') ||
            t.name.includes('STATUS')
        ).map(t => t.name);
        console.log("Interesting tables for more options:", JSON.stringify(interesting));
    });

    // 3. Check columns of TAB_GEN_ITEM for more info
    db.all("PRAGMA table_info(TAB_GEN_ITEM)", (err, columns) => {
        console.log("TAB_GEN_ITEM columns:", JSON.stringify(columns.map(c => c.name)));
    });
});
db.close();
