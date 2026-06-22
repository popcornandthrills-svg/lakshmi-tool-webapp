const sqlite3 = require('sqlite3').verbose();

const dbPath = process.argv[2];
if (!dbPath) {
  console.error('Usage: node scripts/inspect-db.js <db-path>');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
