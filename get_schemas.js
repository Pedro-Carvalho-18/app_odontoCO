const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'app_odonto.sqlite');
const db = new sqlite3.Database(dbPath);

const tables = ['CUSTOMCONTROL', 'CUSTOMMEMO', 'AVISO', 'LOG_TISS', 'USRLOG', 'LOGON', 'TRATAMENTO_COMISSAO', 'TMP_MALADIRETA', 'COMISSAO_LOTE', 'COMISSAO_LOTE_ITEM', 'COB_CONVENIO_LOTE', 'COB_CONVENIO_LOTE_ITEM', 'CUSTO_FIXO_ITEM'];

db.serialize(() => {
    tables.forEach(t => {
        db.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${t}'`, (err, row) => {
            if (row) console.log(`${t} schema:`, row.sql);
        });
    });
});
