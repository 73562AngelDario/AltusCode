require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// ─────────────────────────────────────────────
//  CREACIÓN DE TABLAS (todas, al arrancar)
// ─────────────────────────────────────────────

db.query(`CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255),
    correo VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`).then(async () => {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM admins');
    if (rows[0].count === 0) {
        // ⚠️ Cambia esta contraseña por una tuya en cuanto entres por primera vez.
        await db.query(
            'INSERT INTO admins (nombre, correo, password) VALUES (?,?,?)',
            ['Administrador', 'admin@nucleoweb.mx', 'admin123']
        );
        console.log('✅ Admin por defecto creado: admin@nucleoweb.mx / admin123');
    }
}).catch(err => console.error('Error creando tabla admins:', err));

db.query(`CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255),
    correo VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`).catch(err => console.error('Error creando tabla clientes:', err));

db.query(`CREATE TABLE IF NOT EXISTS proyectos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255),
    clienteId INT,
    tipo VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'Brief',
    nota TEXT,
    enlace VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE CASCADE
)`).catch(err => console.error('Error creando tabla proyectos:', err));

db.query(`CREATE TABLE IF NOT EXISTS contactos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255),
    correo VARCHAR(255),
    mensaje TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`).catch(err => console.error('Error creando tabla contactos:', err));

// ─────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────

app.post('/api/login-admin', async (req, res) => {
    try {
        const { correo, password } = req.body;
        const [rows] = await db.query(
            'SELECT id, nombre, correo FROM admins WHERE correo=? AND password=?',
            [correo, password]
        );
        if (rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login-cliente', async (req, res) => {
    try {
        const { correo, password } = req.body;
        const [rows] = await db.query(
            'SELECT id, nombre, correo FROM clientes WHERE correo=? AND password=?',
            [correo, password]
        );
        if (rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
//  CLIENTES
// ─────────────────────────────────────────────

app.get('/api/clientes', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nombre, correo, password FROM clientes ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clientes', async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;
        const [result] = await db.query(
            'INSERT INTO clientes (nombre, correo, password) VALUES (?,?,?)',
            [nombre, correo, password]
        );
        res.json({ id: result.insertId, nombre, correo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/clientes/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM clientes WHERE id=?', [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
//  PROYECTOS
// ─────────────────────────────────────────────

// GET — todos los proyectos (admin), o solo los de un cliente (?clienteId=)
app.get('/api/proyectos', async (req, res) => {
    try {
        const { clienteId } = req.query;
        let query = `
            SELECT p.*, c.nombre AS cliente_nombre
            FROM proyectos p
            LEFT JOIN clientes c ON p.clienteId = c.id
        `;
        const params = [];
        if (clienteId) {
            query += ' WHERE p.clienteId = ?';
            params.push(clienteId);
        }
        query += ' ORDER BY p.created_at DESC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/proyectos', async (req, res) => {
    try {
        const { nombre, clienteId, tipo, nota, estado } = req.body;
        const [result] = await db.query(
            'INSERT INTO proyectos (nombre, clienteId, tipo, nota, estado) VALUES (?,?,?,?,?)',
            [nombre, clienteId, tipo, nota || null, estado || 'Brief']
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/proyectos/:id', async (req, res) => {
    try {
        const { estado, nota, enlace } = req.body;
        await db.query(
            'UPDATE proyectos SET estado=?, nota=?, enlace=? WHERE id=?',
            [estado, nota || null, enlace || null, req.params.id]
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/proyectos/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM proyectos WHERE id=?', [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
//  CONTACTO (formulario público)
// ─────────────────────────────────────────────

app.post('/api/contacto', async (req, res) => {
    try {
        const { nombre, correo, mensaje } = req.body;
        await db.query(
            'INSERT INTO contactos (nombre, correo, mensaje) VALUES (?,?,?)',
            [nombre, correo, mensaje]
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/contactos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM contactos ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`🚀 Núcleo Web corriendo en puerto ${port}`));
}

module.exports = app;
