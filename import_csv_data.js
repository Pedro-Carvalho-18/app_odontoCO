const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();

const dbPath = 'database/app_odonto.sqlite';
const dataBaseDir = 'database';

async function importCsv(tableName, fileName) {
    const db = new sqlite3.Database(dbPath);
    const filePath = path.join(dataBaseDir, fileName);

    if (!fs.existsSync(filePath)) {
        console.error(`File ${fileName} not found.`);
        return;
    }

    return new Promise((resolve, reject) => {
        let count = 0;
        let batch = [];
        const batchSize = 500;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                batch.push(row);
                if (batch.length >= batchSize) {
                    insertBatch(db, tableName, [...batch]);
                    count += batch.length;
                    batch = [];
                }
            })
            .on('end', () => {
                if (batch.length > 0) {
                    insertBatch(db, tableName, batch);
                    count += batch.length;
                }
                console.log(`Imported ${count} rows into ${tableName}`);
                db.close();
                resolve();
            })
            .on('error', (err) => {
                db.close();
                reject(err);
            });
    });
}

function insertBatch(db, tableName, rows) {
    if (rows.length === 0) return;
    
    const columns = Object.keys(rows[0]).map(c => `"${c}"`).join(', ');
    const placeholders = Object.keys(rows[0]).map(() => '?').join(', ');
    const sql = `INSERT OR REPLACE INTO "${tableName}" (${columns}) VALUES (${placeholders})`;

    db.serialize(() => {
        const stmt = db.prepare(sql);
        rows.forEach(row => {
            const values = Object.values(row).map(v => v === '' ? null : v);
            stmt.run(values, (err) => {
                if (err) {
                    // console.error(`Error inserting into ${tableName}:`, err.message);
                }
            });
        });
        stmt.finalize();
    });
}

async function run() {
    const files = fs.readdirSync(dataBaseDir);
    
    // Core tables to import first
    const coreTables = [
        { table: 'PESSOAL', pattern: /^PESSOAL_/ },
        { table: 'TRATAMENTO', pattern: /^TRATAMENTO_/ },
        { table: 'HISTORICO', pattern: /^HISTORICO_/ },
        { table: 'INTERVENCAO', pattern: /^INTERVENCAO_/ },
        { table: 'PRESTADOR', pattern: /^PRESTADOR_/ },
        { table: 'CONVENIO', pattern: /^CONVENIO_/ },
        { table: 'AGENDA', pattern: /^AGENDA_/ }
    ];

    for (const core of coreTables) {
        const file = files.find(f => core.pattern.test(f));
        if (file) {
            console.log(`Importing ${core.table} from ${file}...`);
            await importCsv(core.table, file);
        }
    }

    console.log('Core data import complete.');
}

run().catch(console.error);
