const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readJson(file, fallback) {
  try {
    const full = path.join(__dirname, 'data', file);
    if (!fs.existsSync(full)) {
      fs.writeFileSync(full, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    const raw = fs.readFileSync(full, 'utf-8').trim();
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, sistema: 'RIOBETA2 ONLINE' });
});

app.get('/api/dashboard', (req, res) => {
  const produtos = readJson('produtos.json', []);
  const estoque = readJson('estoque.json', []);
  const pedidos = readJson('pedidos.json', []);
  const logs = readJson('logs.json', []);

  const estoqueTotal = estoque.reduce((sum, item) => sum + Number(item.quantidade || 0), 0);
  const pedidosAbertos = pedidos.filter(item => (item.status || '').toLowerCase() !== 'finalizado').length;

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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
