const mysql = require('mysql2');

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL no está definida en las variables de entorno.');
}

const db = mysql.createPool(url);
module.exports = db.promise();
