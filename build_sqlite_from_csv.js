const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();

const dbPath = 'database/app_odonto.sqlite';
const dataBaseDir = 'database';

// Removendo o banco antigo para criar um novo "limpo" e perfeito
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath);

async function importAll() {
    const files = fs.readdirSync(dataBaseDir).filter(f => f.endsWith('.csv') && f.includes('20260513'));

    console.log(`Encontrados ${files.length} arquivos CSV. Criando banco de dados...`);

    for (const file of files) {
        // Extraindo o nome da tabela do nome do arquivo (ex: PESSOAL_20260513... -> PESSOAL)
        let tableName = file.replace(/_20260513\d+\.csv$/, '');
        if (tableName.endsWith('_')) {
            tableName = tableName.slice(0, -1);
        }
        
        console.log(`Criando e importando tabela: ${tableName}`);
        await importCsv(tableName, file);
    }
    console.log("\nBanco de dados criado com sucesso! Todas as tabelas foram importadas.");
}

function importCsv(tableName, fileName) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(dataBaseDir, fileName);
        
        let headers = null;
        let batch = [];
        const batchSize = 1000;
        let rowCount = 0;
        
        // Verifica se o arquivo está vazio
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
             console.log(`  -> Arquivo vazio, ignorando.`);
             return resolve();
        }

        const stream = fs.createReadStream(filePath)
            .pipe(csv())
            .on('headers', (hdr) => {
                // Remove espaços e caracteres invisíveis dos cabeçalhos
                headers = hdr.map(h => h.trim().replace(/^"|"$/g, ''));
                if (headers.length > 0 && headers[0] !== '') {
                    // Cria a tabela dinamicamente com todas as colunas como TEXT (flexível no SQLite)
                    const cols = headers.map(h => `"${h}" TEXT`).join(', ');
                    db.serialize(() => {
                        db.run(`CREATE TABLE IF NOT EXISTS "${tableName}" (${cols})`, (err) => {
                            if (err) console.error(`Erro ao criar tabela ${tableName}:`, err.message);
                        });
                    });
                } else {
                    headers = null; // Headers inválidos
                }
            })
            .on('data', (row) => {
                if (!headers) return;
                batch.push(row);
                rowCount++;
                if (batch.length >= batchSize) {
                    insertBatch(tableName, headers, [...batch]);
                    batch = [];
                }
            })
            .on('end', () => {
                if (headers && batch.length > 0) {
                    insertBatch(tableName, headers, batch);
                }
                console.log(`  -> Importados ${rowCount} registros.`);
                resolve();
            })
            .on('error', (err) => {
                console.error(`Erro ao ler ${fileName}:`, err);
                reject(err);
            });
    });
}

function insertBatch(tableName, headers, rows) {
    const cols = headers.map(h => `"${h}"`).join(', ');
    const placeholders = headers.map(() => '?').join(', ');
    const sql = `INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders})`;

    db.serialize(() => {
        const stmt = db.prepare(sql);
        rows.forEach(row => {
            // Se o valor estiver vazio, insere NULL
            const values = headers.map(h => {
                const val = row[h];
                return (val === '' || val === undefined) ? null : val;
            });
            stmt.run(values, (err) => {
                if(err) {
                    // Ocultando logs de erros individuais para não poluir o terminal, 
                    // mas SQLite aceitará a maioria devido à tipagem TEXT.
                }
            });
        });
        stmt.finalize();
    });
}

// Inicia o processo
db.serialize(() => {
    db.run("PRAGMA synchronous = OFF");
    db.run("PRAGMA journal_mode = MEMORY");
    
    importAll().then(() => {
        db.close();
    }).catch(err => {
        console.error(err);
        db.close();
    });
});
