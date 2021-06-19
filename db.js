/** Database setup for biztime. */
const { Client } = require("pg");

let DB_URI;

if (process.env.NODE_ENV === 'test') {
  DB_URI = 'postgresql://cfan:adv96086@/biztime_test';
} else {
  DB_URI = 'postgresql://cfan:adv96086@/biztime';
}

let db = new Client({
  connectionString: DB_URI
});

db.connect();

module.exports = db;