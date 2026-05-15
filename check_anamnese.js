const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function check() {
  const dbPath = path.resolve(process.cwd(), 'database/app_odonto.sqlite');
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  
  console.log('Sample Anamnesis Answers:');
  const res = await db.all(`
    SELECT 
      PA.PRINOM as patientName,
      Q.TX_PERGUNTA as question,
      RI.TX_COMPLEMENTO as complementaryInfo,
      QI.TX_MSG_ALERTA as alertMsg,
      RI.ID_OPCAO_RSP as responseId
    FROM ANAMNESE_RSP R
    JOIN PESSOAL PA ON R.ID_PESSOA = PA.NROPAC
    JOIN ANAMNESE_RSP_ITEM RI ON R.ID_RSP = RI.ID_RSP
    JOIN ANAMNESE_QST_ITEM QI ON RI.ID_QST_ITEM = QI.ID_QST_ITEM
    JOIN ANAMNESE_QST_ITEM Q ON RI.ID_QST_ITEM = Q.ID_QST_ITEM
    LIMIT 20
  `);
  console.log(JSON.stringify(res, null, 2));
  await db.close();
}
check();
