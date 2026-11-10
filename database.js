const mysql = require('mysql2');

// Si prefieres dejar la URL directo en el código, pégala entre las comillas de abajo.
// (Si DATABASE_URL existe en Vercel, esa tiene prioridad.)
const URL_DIRECTA = 'mysql://root:hKbkNrFGXkEjhHgQaefBpsNKvFPfuWqZ@turntable.proxy.rlwy.net:29238/railway';

const url = process.env.DATABASE_URL || (URL_DIRECTA.startsWith('mysql://') ? URL_DIRECTA : '');

if (!url) {
  throw new Error('DATABASE_URL no está definida en las variables de entorno.');
}

// Pool pensado para Vercel (serverless) + Railway:
// - pocas conexiones y se cierran pronto, para no quedarse con conexiones "muertas"
// - keep-alive para que el proxy de Railway no las corte por inactividad
const pool = mysql.createPool({
  uri: url,
  waitForConnections: true,
  connectionLimit: 3,
  maxIdle: 1,
  idleTimeout: 20000,
  connectTimeout: 15000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
}).promise();

const ERRORES_DE_CONEXION = ['PROTOCOL_CONNECTION_LOST', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT'];

// Si la conexión se cayó, reintenta una vez con una conexión nueva.
async function query(sql, params) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    if (ERRORES_DE_CONEXION.includes(err.code) || /Connection lost|closed the connection/i.test(err.message)) {
      return pool.query(sql, params);
    }
    throw err;
  }
}

module.exports = { query };
