const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/app_odonto.sqlite');

db.all(`
  SELECT 
    (TRIM(P.PRINOM) || ' ' || COALESCE(TRIM(P.SEGNOM), '')) as NOME,
    COUNT(I.NROINTPAC) as total_intervencoes,
    COUNT(D.BITMAP) as dentes_com_status,
    COUNT(F.FACE1) as faces_com_dados
  FROM PESSOAL P
  JOIN INTERVENCAO I ON P.NROPAC = I.NROPAC
  LEFT JOIN DENTE D ON I.NROPAC = D.NROPAC AND I.NROINTPAC = D.NROINTPAC
  LEFT JOIN FACE F ON I.NROPAC = F.NROPAC AND I.NROINTPAC = F.NROINTPAC
  GROUP BY P.NROPAC
  HAVING total_intervencoes > 5
  ORDER BY dentes_com_status DESC, faces_com_dados DESC
  LIMIT 5
`, (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('--- Sugestões de Pacientes com dados no Odontograma (Corrigido) ---');
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
