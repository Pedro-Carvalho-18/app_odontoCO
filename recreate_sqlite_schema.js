const fs = require('fs');

function convertToSQLite(tsql) {
    let sql = tsql;

    // 1. Remove [dbo]. and square brackets
    sql = sql.replace(/\[dbo\]\./g, '');
    sql = sql.replace(/\[/g, '').replace(/\]/g, '');

    // 2. Data Types for SQLite
    sql = sql.replace(/\bint\b\s+IDENTITY\(\d+,\d+\)/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
    sql = sql.replace(/\bint\b/gi, 'INTEGER');
    sql = sql.replace(/\bdatetime\b/gi, 'TEXT'); 
    sql = sql.replace(/\bsmallint\b/gi, 'INTEGER');
    sql = sql.replace(/\btinyint\b/gi, 'INTEGER');
    sql = sql.replace(/\bbit\b/gi, 'INTEGER'); 
    sql = sql.replace(/\bmoney\b/gi, 'REAL');
    sql = sql.replace(/\bimage\b/gi, 'BLOB');
    sql = sql.replace(/\btext\b/gi, 'TEXT');
    sql = sql.replace(/\bnvarchar\b/gi, 'TEXT');
    sql = sql.replace(/\bvarchar\b/gi, 'TEXT');

    // 3. Remove T-SQL specific clauses
    sql = sql.replace(/WITH\s*\(.*?\)/gs, '');
    sql = sql.replace(/ON\s*PRIMARY/gi, '');
    sql = sql.replace(/TEXTIMAGE_ON\s*PRIMARY/gi, '');
    sql = sql.replace(/SET\s+ANSI_NULLS\s+(ON|OFF)/gi, '');
    sql = sql.replace(/SET\s+QUOTED_IDENTIFIER\s+(ON|OFF)/gi, '');
    sql = sql.replace(/SET\s+ANSI_PADDING\s+(ON|OFF)/gi, '');
    sql = sql.replace(/TEXTIMAGE_/g, '');

    // 4. Handle "GO"
    sql = sql.replace(/^\s*GO\s*$/gm, ';');

    // 5. Constraints cleanup - Simplified
    sql = sql.replace(/CLUSTERED/gi, '');
    sql = sql.replace(/NONCLUSTERED/gi, '');
    
    return sql;
}

const inputPath = 'database/source_files/eds80.sql';
const outputPath = 'database/schema_sqlite.sql';

try {
    const data = fs.readFileSync(inputPath, 'utf16le');
    const result = convertToSQLite(data);
    fs.writeFileSync(outputPath, result, 'utf8');
    console.log('Successfully recreated SQLite schema script.');
} catch (err) {
    console.error('Error:', err);
}
