const fs = require('fs');
const path = require('path');

const schemaFile = 'Dados/eds80.sql';
const buildFilesPattern = /^eds8.*_build_.*\.sql$/;
const outputSchema = 'supabase/migrations/20240513000000_initial_schema.sql';
const outputData = 'supabase/seed.sql';

const typeMapping = [
    { from: /\[int\]\s+IDENTITY\(\d+,\d+\)/gi, to: 'SERIAL' },
    { from: /\[int\]/gi, to: 'INTEGER' },
    { from: /\[varchar\]\((MAX|max|\d+)\)/gi, to: (match, p1) => p1.toLowerCase() === 'max' ? 'TEXT' : `VARCHAR(${p1})` },
    { from: /\[nvarchar\]\((MAX|max|\d+)\)/gi, to: (match, p1) => p1.toLowerCase() === 'max' ? 'TEXT' : `VARCHAR(${p1})` },
    { from: /\[char\]\((\d+)\)/gi, to: 'CHAR($1)' },
    { from: /\[datetime\]/gi, to: 'TIMESTAMP' },
    { from: /\[image\]/gi, to: 'BYTEA' },
    { from: /\[text\]/gi, to: 'TEXT' },
    { from: /\[money\]/gi, to: 'DECIMAL(19,4)' },
    { from: /\[smallint\]/gi, to: 'SMALLINT' },
    { from: /\[tinyint\]/gi, to: 'SMALLINT' },
    { from: /\[bit\]/gi, to: 'BOOLEAN' },
    { from: /\[numeric\]\((\d+,\d+)\)/gi, to: 'NUMERIC($1)' },
    { from: /\[decimal\]\((\d+,\d+)\)/gi, to: 'DECIMAL($1)' },
    { from: /\[binary\]\((\d+)\)/gi, to: 'BYTEA' },
    { from: /\[varbinary\]\((MAX|max|\d+)\)/gi, to: 'BYTEA' },
];

function convertTSQLtoPG(sql) {
    let pgSql = sql;

    // Remove T-SQL specific commands
    pgSql = pgSql.replace(/SET ANSI_NULLS ON/gi, '');
    pgSql = pgSql.replace(/SET QUOTED_IDENTIFIER ON/gi, '');
    pgSql = pgSql.replace(/SET ANSI_PADDING (ON|OFF)/gi, '');
    
    // Replace GO on its own line with ;
    pgSql = pgSql.replace(/^\s*GO\s*$/gm, ';');

    // Remove [dbo].
    pgSql = pgSql.replace(/\[dbo\]\./gi, '');

    // Simplify CREATE TABLE constraints before removing brackets from names
    pgSql = pgSql.replace(/WITH\s*\([^)]+\)/gi, '');
    pgSql = pgSql.replace(/ON\s*\[PRIMARY\]/gi, '');
    pgSql = pgSql.replace(/TEXTIMAGE_ON\s*\[PRIMARY\]/gi, '');

    // Convert types
    for (const mapping of typeMapping) {
        pgSql = pgSql.replace(mapping.from, mapping.to);
    }

    // Remove square brackets from identifiers
    pgSql = pgSql.replace(/\[([^\]]+)\]/g, '$1');
    
    // Clean up primary key clustered syntax
    pgSql = pgSql.replace(/CONSTRAINT\s+(\w+)\s+PRIMARY\s+KEY\s+CLUSTERED/gi, 'CONSTRAINT $1 PRIMARY KEY');
    
    // Remove ASC/DESC in primary key definitions
    pgSql = pgSql.replace(/(PRIMARY\s+KEY\s*\()([^)]+)(\))/gi, (match, p1, p2, p3) => {
        const cleaned = p2.replace(/\s+ASC/gi, '').replace(/\s+DESC/gi, ' DESC');
        return p1 + cleaned + p3;
    });

    // Remove NONCLUSTERED from INDEX
    pgSql = pgSql.replace(/CREATE\s+NONCLUSTERED\s+INDEX/gi, 'CREATE INDEX');

    // Remove ASC from index column definitions
    pgSql = pgSql.replace(/(CREATE\s+INDEX\s+.*?\()([^)]+)(\))/gis, (match, p1, p2, p3) => {
        const cleaned = p2.replace(/\s+ASC/gi, '').replace(/\s+DESC/gi, ' DESC');
        return p1 + cleaned + p3;
    });

    // Remove any remaining ON PRIMARY (in case they didn't have brackets)
    pgSql = pgSql.replace(/\s+ON\s+PRIMARY/gi, '');
    pgSql = pgSql.replace(/\s+TEXTIMAGE_\s*/gi, ' ');

    // Clean up extra whitespace and empty semicolons
    pgSql = pgSql.replace(/;\s*;/g, ';');
    pgSql = pgSql.replace(/\n\s*\n\s*\n/g, '\n\n');

    return pgSql;
}

function extractInserts(sql) {
    // Regex to match INSERT INTO ... VALUES (...) or INSERT INTO ... (...) VALUES (...)
    // and handle multi-line.
    // We ignore table variables starting with @.
    const insertRegex = /INSERT\s+INTO\s+([^@\s(]+)\s*(?:\([^)]+\))?\s+VALUES\s*\([^;]+?;/gis;
    
    let matches;
    const inserts = [];
    while ((matches = insertRegex.exec(sql)) !== null) {
        let insert = matches[0];
        insert = insert.replace(/\[dbo\]\./gi, '');
        insert = insert.replace(/\[([^\]]+)\]/g, '$1');
        inserts.push(insert.trim());
    }
    return inserts;
}

async function run() {
    console.log('Starting migration...');

    // 1. Schema Migration
    if (fs.existsSync(schemaFile)) {
        console.log(`Reading schema from ${schemaFile}...`);
        const tsqlSchema = fs.readFileSync(schemaFile, 'utf16le');
        const pgSchema = convertTSQLtoPG(tsqlSchema);
        fs.writeFileSync(outputSchema, pgSchema, 'utf8');
        console.log(`Schema saved to ${outputSchema}`);
    }

    // 2. Data Migration
    const dadosDir = 'Dados';
    const allFiles = fs.readdirSync(dadosDir);
    const buildFiles = allFiles.filter(f => buildFilesPattern.test(f));
    
    let allInserts = [];
    for (const file of buildFiles) {
        console.log(`Processing ${file} for inserts...`);
        const content = fs.readFileSync(path.join(dadosDir, file), 'utf8');
        const inserts = extractInserts(content);
        if (inserts.length > 0) {
            allInserts = allInserts.concat(inserts);
        }
    }

    if (allInserts.length > 0) {
        fs.writeFileSync(outputData, allInserts.join('\n') + '\n');
        console.log(`Extracted ${allInserts.length} inserts to ${outputData}`);
    }

    // 3. Raw Data Analysis (Simple attempt)
    const distDir = path.join(dadosDir, 'Dist');
    if (fs.existsSync(distDir)) {
        const rawFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.raw'));
        console.log(`Found ${rawFiles.length} raw files. Analyzing a few...`);
        // We could try to extract strings from raw files and guess the format
        // But for now, let's just list what we found.
    }

    console.log('Migration script finished.');
}

run().catch(console.error);
