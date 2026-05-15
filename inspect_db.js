const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("Tables:", JSON.stringify(tables.map(t => t.name)));

        // Specifically look for procedure-related tables
        const procedureTables = tables.filter(t => 
            t.name.toLowerCase().includes('proc') || 
            t.name.toLowerCase().includes('item') ||
            t.name.toLowerCase().includes('tab') ||
            t.name.toLowerCase().includes('serv')
        ).map(t => t.name);
        
        console.log("Procedure related tables:", JSON.stringify(procedureTables));
    });
});
db.close();
