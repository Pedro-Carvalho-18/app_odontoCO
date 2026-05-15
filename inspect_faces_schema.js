const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/app_odonto.sqlite');

async function inspectSchema(tableName) {
    return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function main() {
    try {
        const tables = ['INTERVENCAO', 'FACE', 'ARCADA', 'DENTE'];
        for (const table of tables) {
            const schema = await inspectSchema(table);
            console.log(`\n--- Schema for ${table} ---`);
            console.table(schema.map(r => ({ name: r.name, type: r.type })));
        }

        // Also look at sample data from INTERVENCAO
        console.log('\n--- Sample data from INTERVENCAO (first 5 rows) ---');
        db.all("SELECT * FROM INTERVENCAO LIMIT 5", (err, rows) => {
            if (err) console.error(err);
            else console.table(rows);
            
            // Check FACE table data
            console.log('\n--- Sample data from FACE (first 10 rows) ---');
            db.all("SELECT * FROM FACE LIMIT 10", (err, rows) => {
                if (err) console.error(err);
                else console.table(rows);
                db.close();
            });
        });
    } catch (err) {
        console.error(err);
        db.close();
    }
}

main();
