const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'usuarios.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}

function readUsers() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8').trim();
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function saveUsers(users) {
  ensureDataFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, sistema: 'RIOBETA2 V20 AUTH' });
});

app.post('/api/register', (req, res) => {
  const { login, senha } = req.body || {};
  if (!login || !senha) {
    return res.status(400).json({ ok: false, msg: 'Login e senha são obrigatórios.' });
  }

  const users = readUsers();
  const exists = users.find(u => String(u.login).toLowerCase() === String(login).toLowerCase());
  if (exists) {
    return res.status(409).json({ ok: false, msg: 'Usuário já existe.' });
  }

  const user = {
    id: Date.now(),
    login: String(login).trim(),
    senha: String(senha),
    cargo: 'admin',
    criadoEm: new Date().toISOString()
  };

  users.push(user);
  saveUsers(users);

  return res.json({
    ok: true,
    msg: 'Usuário criado com sucesso.',
    usuario: { id: user.id, login: user.login, cargo: user.cargo }
  });
});

app.post('/api/login', (req, res) => {
  const { login, senha } = req.body || {};
  if (!login || !senha) {
    return res.status(400).json({ ok: false, msg: 'Login e senha são obrigatórios.' });
  }

  const users = readUsers();
  const user = users.find(
    u => String(u.login).toLowerCase() === String(login).toLowerCase() && String(u.senha) === String(senha)
  );

  if (!user) {
    return res.status(401).json({ ok: false, msg: 'Erro login' });
  }

  return res.json({
    ok: true,
    usuario: {
      id: user.id,
      login: user.login,
      cargo: user.cargo || 'admin'
    }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 RIOBETA2 V20 AUTH rodando na porta ${PORT}`);
});
