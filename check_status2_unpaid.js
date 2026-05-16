const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database/app_odonto.sqlite');

const query = `
  SELECT COUNT(*) as count
  FROM INTERVENCAO
  WHERE STATUS = '2' AND (ORCAMENTO IS NULL OR ORCAMENTO = '0' OR ORCAMENTO = '')
`;

db.get(query, (err, row) => {
  if (err) { console.error(err); return; }
  console.log("STATUS 2 (CONCLUIDO) AND ORCAMENTO 0/NULL COUNT:", row.count);
  db.close();
});
