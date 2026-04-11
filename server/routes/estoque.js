const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '../../data');
const PRODUTOS_FILE = path.join(DATA_DIR, 'produtos.json');
const MOVS_FILE = path.join(DATA_DIR, 'movimentacoes.json');
const ESTOQUE_FILE = path.join(DATA_DIR, 'estoque_enderecos.json');
const ESTOQUE_LEGACY_FILE = path.join(DATA_DIR, 'estoque.json');

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback = []) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf-8').trim();
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function recalculateInventory() {
  const produtos = readJson(PRODUTOS_FILE, []);
  const movs = readJson(MOVS_FILE, []);

  const productById = new Map(produtos.map((p) => [String(p.id), p]));
  const inventoryMap = new Map();
  const totalMap = new Map();

  const activeMovs = movs
    .filter((m) => m && m.status !== 'cancelado')
    .sort((a, b) => new Date(a.data || 0) - new Date(b.data || 0));

  for (const mov of activeMovs) {
    const produtoId = String(mov.produtoId || '');
    if (!produtoId || !productById.has(produtoId)) continue;

    const quantidade = Number(mov.quantidade || 0);
    if (Number.isNaN(quantidade)) continue;

    if (mov.tipo === 'transferencia') {
      const origem = String(mov.origem || '').trim();
      const destino = String(mov.destino || '').trim();
      if (!origem || !destino) continue;

      const origemKey = `${produtoId}::${origem}`;
      const destinoKey = `${produtoId}::${destino}`;
      inventoryMap.set(origemKey, Number(inventoryMap.get(origemKey) || 0) - quantidade);
      inventoryMap.set(destinoKey, Number(inventoryMap.get(destinoKey) || 0) + quantidade);
      continue;
    }

    const endereco = String(mov.endereco || '').trim();
    if (!endereco) continue;

    const key = `${produtoId}::${endereco}`;
    const atual = Number(inventoryMap.get(key) || 0);

    if (mov.tipo === 'entrada') inventoryMap.set(key, atual + quantidade);
    else if (mov.tipo === 'saida') inventoryMap.set(key, Math.max(0, atual - quantidade));
    else if (mov.tipo === 'ajuste') inventoryMap.set(key, Math.max(0, quantidade));
  }

  const estoque = [];
  for (const [key, quantidade] of inventoryMap.entries()) {
    if (quantidade <= 0) continue;
    const [produtoId, endereco] = key.split('::');
    const produto = productById.get(produtoId);
    if (!produto) continue;

    estoque.push({
      produtoId,
      codigo: produto.codigo || '',
      produto: produto.nome || '',
      endereco,
      quantidade
    });

    totalMap.set(produtoId, Number(totalMap.get(produtoId) || 0) + quantidade);
  }

  const produtosAtualizados = produtos.map((produto) => ({
    ...produto,
    estoqueTotal: Number(totalMap.get(String(produto.id)) || 0),
    quantidade: Number(totalMap.get(String(produto.id)) || 0)
  }));

  saveJson(ESTOQUE_FILE, estoque);
  saveJson(ESTOQUE_LEGACY_FILE, estoque);
  saveJson(PRODUTOS_FILE, produtosAtualizados);

  return { produtos: produtosAtualizados, estoque };
}

function getCurrentStock(produtoId, endereco) {
  const { estoque } = recalculateInventory();
  const item = estoque.find((entry) =>
    String(entry.produtoId) === String(produtoId) &&
    String(entry.endereco) === String(endereco)
  );
  return Number(item?.quantidade || 0);
}

router.get('/', (req, res) => {
  const { estoque } = recalculateInventory();
  res.json(estoque);
});

router.get('/movimentacoes', (req, res) => {
  const produtos = readJson(PRODUTOS_FILE, []);
  const byId = new Map(produtos.map((p) => [String(p.id), p]));
  const movs = readJson(MOVS_FILE, [])
    .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0))
    .map((mov) => ({
      ...mov,
      produto: byId.get(String(mov.produtoId || ''))?.nome || mov.produto || mov.produtoId
    }));
  res.json(movs);
});

router.post('/movimentar', (req, res) => {
  const { produtoId, tipo, endereco, quantidade } = req.body;
  const qtd = Number(quantidade);

  if (!produtoId || !tipo || !endereco || Number.isNaN(qtd)) {
    return res.status(400).json({ ok: false, message: 'Dados obrigatórios não informados.' });
  }

  if (!['entrada', 'saida', 'ajuste'].includes(tipo)) {
    return res.status(400).json({ ok: false, message: 'Tipo de movimentação inválido.' });
  }

  if (tipo !== 'ajuste' && qtd <= 0) {
    return res.status(400).json({ ok: false, message: 'Quantidade deve ser maior que zero.' });
  }

  if (tipo === 'ajuste' && qtd < 0) {
    return res.status(400).json({ ok: false, message: 'Ajuste não pode ser negativo.' });
  }

  const produtos = readJson(PRODUTOS_FILE, []);
  const produto = produtos.find((p) => String(p.id) === String(produtoId));
  if (!produto) {
    return res.status(404).json({ ok: false, message: 'Produto não encontrado.' });
  }

  if (tipo === 'saida') {
    const saldoAtual = getCurrentStock(produtoId, endereco);
    if (saldoAtual < qtd) {
      return res.status(400).json({ ok: false, message: `Saldo insuficiente no endereço. Disponível: ${saldoAtual}` });
    }
  }

  const movs = readJson(MOVS_FILE, []);
  movs.unshift({
    id: `mov_${Date.now()}`,
    produtoId: String(produtoId),
    tipo,
    endereco: String(endereco).trim(),
    quantidade: qtd,
    status: 'ativo',
    data: new Date().toISOString()
  });
  saveJson(MOVS_FILE, movs);

  recalculateInventory();
  res.json({ ok: true });
});

router.post('/transferir', (req, res) => {
  const { produtoId, origem, destino, quantidade } = req.body;
  const qtd = Number(quantidade);

  if (!produtoId || !origem || !destino || Number.isNaN(qtd) || qtd <= 0) {
    return res.status(400).json({ ok: false, message: 'Origem, destino e quantidade são obrigatórios.' });
  }

  if (String(origem).trim() === String(destino).trim()) {
    return res.status(400).json({ ok: false, message: 'Origem e destino não podem ser iguais.' });
  }

  const produtos = readJson(PRODUTOS_FILE, []);
  const produto = produtos.find((p) => String(p.id) === String(produtoId));
  if (!produto) {
    return res.status(404).json({ ok: false, message: 'Produto não encontrado.' });
  }

  const saldoOrigem = getCurrentStock(produtoId, String(origem).trim());
  if (saldoOrigem < qtd) {
    return res.status(400).json({ ok: false, message: `Saldo insuficiente na origem. Disponível: ${saldoOrigem}` });
  }

  const movs = readJson(MOVS_FILE, []);
  movs.unshift({
    id: `mov_${Date.now()}`,
    produtoId: String(produtoId),
    tipo: 'transferencia',
    origem: String(origem).trim(),
    destino: String(destino).trim(),
    quantidade: qtd,
    status: 'ativo',
    data: new Date().toISOString()
  });
  saveJson(MOVS_FILE, movs);

  recalculateInventory();
  res.json({ ok: true });
});

router.put('/movimentacoes/:id/cancelar', (req, res) => {
  const movs = readJson(MOVS_FILE, []);
  const index = movs.findIndex((m) => String(m.id) === String(req.params.id));

  if (index === -1) {
    return res.status(404).json({ ok: false, message: 'Movimentação não encontrada.' });
  }

  movs[index] = {
    ...movs[index],
    status: 'cancelado',
    canceladoEm: new Date().toISOString()
  };

  saveJson(MOVS_FILE, movs);
  recalculateInventory();
  res.json({ ok: true });
});

module.exports = router;
