const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const srcPath = 'database/app_odonto.sqlite';
const destPath = 'database/app_odonto_clean.sqlite';

if (fs.existsSync(destPath)) {
    fs.unlinkSync(destPath);
}
fs.copyFileSync(srcPath, destPath);

const db = new sqlite3.Database(destPath);

db.serialize(() => {
    const tablesToClear = [
        'PESSOAL', 
        'INTERVENCAO', 
        'HISTORICO', 
        'TRATAMENTO', 
        'RECIBO', 
        'PARCELA', 
        'DENTE', 
        'FACE', 
        'ANAMNESE_RSP', 
        'ANAMNESE_RSP_ITEM', 
        'ARQUIVO_PACIENTE', 
        'TMP_CONTAS', 
        'NFE_HEADER', 
        'LOG_DOCUMENTO', 
        'RETORNO',
        'AGENDA',
        'COMPROMISSO',
        'ARCADA',
        'CCPACIENTE',
        'CCCIRURGIAO',
        'CUSTOMDATA',
        'CUSTOMMEMO',
        'CONTATO',
        'DEL_AGENDA',
        'EXAMEPERIO',
        'ITEMPERIO',
        'AVISO',
        'LOG_TISS',
        'USRLOG',
        'LOGON',
        'TRATAMENTO_COMISSAO',
        'TMP_MALADIRETA',
        'COMISSAO_LOTE',
        'COMISSAO_LOTE_ITEM',
        'COB_CONVENIO_LOTE',
        'COB_CONVENIO_LOTE_ITEM'
    ];

    db.run("BEGIN TRANSACTION");
    for (const table of tablesToClear) {
        db.run(`DELETE FROM ${table}`, (err) => {
            if(err) console.error(`Error clearing ${table}:`, err.message);
        });
    }

    // Reset PRESTADOR and insert a default one
    db.run(`DELETE FROM PRESTADOR`, (err) => {
        if(err) console.error(`Error clearing PRESTADOR:`, err.message);
    });
    db.run(`INSERT INTO PRESTADOR (ID_PRESTADOR, COD_PRESTADOR, NOME, INATIVO) VALUES (1, '001', 'Cirurgião Dentista', '0')`, (err) => {
        if(err) console.error(`Error inserting default PRESTADOR:`, err.message);
    });

    db.run("COMMIT", () => {
        db.run("VACUUM", () => {
            console.log("Database cleaned successfully.");
            db.close();
        });
    });
});
