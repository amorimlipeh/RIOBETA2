const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const PRODUTOS_FILE = path.join(DATA_DIR, 'produtos.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(PRODUTOS_FILE)) {
  fs.writeFileSync(PRODUTOS_FILE, '[]', 'utf8');
}

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

function readProdutos() {
  try {
    const raw = fs.readFileSync(PRODUTOS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (error) {
    return [];
  }
}

function saveProdutos(produtos) {
  fs.writeFileSync(PRODUTOS_FILE, JSON.stringify(produtos, null, 2), 'utf8');
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'online' });
});

app.get('/api/produtos', (req, res) => {
  const produtos = readProdutos();
  res.json(produtos);
});

app.post('/api/produtos', (req, res) => {
  const { codigo, nome, categoria, quantidade } = req.body || {};

  if (!codigo || !nome) {
    return res.status(400).json({ ok: false, message: 'Código e nome são obrigatórios.' });
  }

  const produtos = readProdutos();

  const novoProduto = {
    id: Date.now().toString(),
    codigo: String(codigo).trim(),
    nome: String(nome).trim(),
    categoria: String(categoria || '').trim(),
    quantidade: Number(quantidade || 0)
  };

  produtos.push(novoProduto);
  saveProdutos(produtos);

  res.json({ ok: true, produto: novoProduto });
});

app.delete('/api/produtos/:id', (req, res) => {
  const { id } = req.params;
  const produtos = readProdutos();
  const atualizados = produtos.filter(produto => produto.id !== id);

  saveProdutos(atualizados);
  res.json({ ok: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
