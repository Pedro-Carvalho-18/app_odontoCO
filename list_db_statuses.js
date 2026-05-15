const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database/app_odonto.sqlite');
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

async function list() {
  const db = await getDb();
  const statuses = await db.all("SELECT * FROM __STATUS_AGENDA");
  console.log(JSON.stringify(statuses, null, 2));
  await db.close();
}

list();
