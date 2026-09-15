# 🧭 Núcleo Web — Sitio + Paneles de Cliente y Admin

Sitio corporativo para una agencia/desarrolladora de páginas web, con panel de seguimiento para clientes y panel de administración para gestionar clientes y proyectos.

---

## 📁 Estructura

```
/
├── index.html          # Landing pública (servicios, proceso, casos, precios, contacto)
├── dashboard.html       # Panel de cliente (login + estado de su proyecto)
├── admin.html           # Panel de administración (gestiona clientes y proyectos)
├── server.js            # API REST con Express
├── database.js          # Conexión a MySQL con pool
├── package.json
├── vercel.json
└── .env                 # Variables de entorno (no se sube a Git)
```

---

## ⚙️ Variables de entorno

Crea un archivo `.env` en la raíz (o en Vercel → Settings → Environment Variables):

```env
DATABASE_URL=mysql://usuario:contraseña@host:puerto/nombre_db
```

Usa la misma base de datos MySQL de Railway que ya tienes, o crea una nueva.

---

## 🗄️ Base de datos

Las tablas se crean solas al arrancar el servidor si no existen:

- **admins** — cuentas del equipo de la agencia. Se crea una por defecto: `admin@nucleoweb.mx` / `admin123` — **cámbiala apenas entres**.
- **clientes** — cuentas de acceso de tus clientes al panel.
- **proyectos** — cada proyecto, ligado a un cliente, con estado (`Brief` → `Diseño` → `Desarrollo` → `Revisión` → `Entregado`), nota y enlace al sitio publicado.
- **contactos** — mensajes del formulario de contacto público.

---

## 🔌 API

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/login-admin` | Login del equipo |
| POST | `/api/login-cliente` | Login de un cliente |
| POST | `/api/registro-cliente` | El cliente crea su propia cuenta y elige su contraseña |
| GET/POST/DELETE | `/api/clientes` | Gestionar clientes (el admin puede crear una cuenta con contraseña inicial, pero nunca puede volver a verla) |
| GET/POST/PUT/DELETE | `/api/proyectos` | Gestionar proyectos (usa `?clienteId=` para filtrar) |
| POST | `/api/contacto` | Guarda un mensaje del formulario público |
| GET | `/api/contactos` | Ver mensajes recibidos |

### 🔐 Contraseñas

Las contraseñas de `admins` y `clientes` se guardan **hasheadas con bcrypt**, nunca en texto plano. Ni el admin ni nadie con acceso directo a la base de datos puede leer la contraseña de un cliente — solo se puede verificar si una contraseña coincide al iniciar sesión.

Los clientes pueden registrarse solos desde `dashboard.html#registro` (o desde el link "Crea tu cuenta de cliente" en la página principal), eligiendo ellos mismos su contraseña.

Si ya tenías clientes o el admin creados antes de este cambio (con contraseña en texto plano), no hace falta hacer nada: la primera vez que esa cuenta inicie sesión correctamente, el servidor migra automáticamente su contraseña a un hash.

---

## 💻 Correr en local

```bash
npm install
cp .env.example .env   # y llena DATABASE_URL
npm start
# → http://localhost:3000
```

---

## 🚢 Deploy en Vercel

Igual que tu otro proyecto: conecta el repo, agrega `DATABASE_URL` en Environment Variables, y cada push a `main` despliega solo.

---

## ✏️ Personalizar

- Cambia el nombre "Núcleo Web" en `index.html`, `dashboard.html` y `admin.html` (búscalo con Ctrl+F, aparece pocas veces).
- El caso de éxito de "Delicias de Campeche" en la sección de casos es un ejemplo — reemplázalo por tus propios proyectos reales conforme los tengas.
- Los colores y tipografías están centralizados en el bloque `tailwind.config` de cada archivo HTML.
