const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'app_odonto.sqlite');
const db = new sqlite3.Database(dbPath);

async function check() {
    console.log('--- Checking ARQUIVO_PACIENTE ---');
    await new Promise(resolve => {
        db.all("SELECT * FROM ARQUIVO_PACIENTE WHERE NOME LIKE '%atestado%' COLLATE NOCASE", (err, rows) => {
            if (rows) console.log(`Found ${rows.length} records`);
            resolve();
        });
    });

    console.log('--- Checking CUSTOMMEMO ---');
    await new Promise(resolve => {
        db.all("SELECT * FROM CUSTOMMEMO WHERE VALOR LIKE '%atestado%' COLLATE NOCASE", (err, rows) => {
            if (rows) console.log(`Found ${rows.length} records`);
            resolve();
        });
    });

    console.log('--- Checking CUSTOMDATA ---');
    await new Promise(resolve => {
        db.all("SELECT * FROM CUSTOMDATA WHERE VALOR LIKE '%atestado%' COLLATE NOCASE", (err, rows) => {
            if (rows) console.log(`Found ${rows.length} records`);
            resolve();
        });
    });
    
    db.close();
}

check();
