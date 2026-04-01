const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function ensureFile(file, fallback) {
  const full = path.join(__dirname, 'data', file);
  if (!fs.existsSync(path.dirname(full))) fs.mkdirSync(path.dirname(full), { recursive: true });
  if (!fs.existsSync(full)) fs.writeFileSync(full, JSON.stringify(fallback, null, 2));
  return full;
}

function read(file, fallback) {
  try {
    const full = ensureFile(file, fallback);
    const raw = fs.readFileSync(full, 'utf-8').trim();
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJson(file, data) {
  const full = ensureFile(file, []);
  fs.writeFileSync(full, JSON.stringify(data, null, 2));
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, sistema: 'RIOBETA2 ONLINE' });
});

app.get('/api/dashboard', (req, res) => {
  const produtos = read('produtos.json', []);
  const estoque = read('estoque.json', []);
  const pedidos = read('pedidos.json', []);
  const logs = read('logs.json', []);

  const estoqueTotal = estoque.reduce((sum, item) => sum + Number(item.quantidade || item.qtd || 0), 0);
  const pedidosAbertos = pedidos.filter(item => (item.status || 'aberto').toLowerCase() !== 'finalizado').length;

  res.json({
    ok: true,
    produtos: produtos.length,
    estoqueTotal,
    pedidosAbertos,
    recebimentos: 0,
    ocupacao: '0%',
    logs: logs.slice(0, 5)
  });
});

app.get('/api/produtos', (req, res) => {
  res.json(read('produtos.json', []));
});

app.post('/api/produtos', (req, res) => {
  const produtos = read('produtos.json', []);
  const novo = {
    id: Date.now(),
    codigo: req.body.codigo || '',
    nome: req.body.nome || ''
  };
  produtos.unshift(novo);
  writeJson('produtos.json', produtos);

  const logs = read('logs.json', []);
  logs.unshift({ modulo: 'produtos', acao: `Produto salvo: ${novo.nome || novo.codigo || novo.id}` });
  writeJson('logs.json', logs);

  res.json({ ok: true, item: novo });
});

app.get('/api/estoque', (req, res) => {
  res.json(read('estoque.json', []));
});

app.post('/api/estoque', (req, res) => {
  const estoque = read('estoque.json', []);
  const novo = {
    id: Date.now(),
    produto: req.body.produto || '',
    quantidade: Number(req.body.quantidade || req.body.qtd || 0)
  };
  estoque.unshift(novo);
  writeJson('estoque.json', estoque);

  const logs = read('logs.json', []);
  logs.unshift({ modulo: 'estoque', acao: `Movimento salvo: ${novo.produto || 'item'} (${novo.quantidade})` });
  writeJson('logs.json', logs);

  res.json({ ok: true, item: novo });
});

app.get('/api/pedidos', (req, res) => {
  res.json(read('pedidos.json', []));
});

app.post('/api/pedidos', (req, res) => {
  const pedidos = read('pedidos.json', []);
  const novo = {
    id: Date.now(),
    pedido: req.body.pedido || '',
    status: req.body.status || 'aberto'
  };
  pedidos.unshift(novo);
  writeJson('pedidos.json', pedidos);

  const logs = read('logs.json', []);
  logs.unshift({ modulo: 'pedidos', acao: `Pedido criado: ${novo.pedido || novo.id}` });
  writeJson('logs.json', logs);

  res.json({ ok: true, item: novo });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 RIOBETA2 online na porta ${PORT}`);
});
