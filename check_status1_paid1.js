const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database/app_odonto.sqlite');

const query = `
  SELECT COUNT(*) as count
  FROM INTERVENCAO
  WHERE STATUS = '1' AND ORCAMENTO = '1'
`;

db.get(query, (err, row) => {
  if (err) { console.error(err); return; }
  console.log("STATUS 1 AND ORCAMENTO 1 COUNT:", row.count);
  db.close();
});
