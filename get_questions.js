const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function getQuestions() {
  const dbPath = path.resolve(process.cwd(), 'database/app_odonto.sqlite');
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  const questions = await db.all("SELECT ID_QST_ITEM as id, TX_PERGUNTA as question FROM ANAMNESE_QST_ITEM WHERE ID_QST = '1' AND (FL_CANCELADO = '0' OR FL_CANCELADO IS NULL) ORDER BY NR_SEQ ASC");
  console.log(JSON.stringify(questions, null, 2));
  await db.close();
}

getQuestions();
