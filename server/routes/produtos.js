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

router.get('/', (req, res) => {
  const { produtos } = recalculateInventory();
  res.json(produtos);
});

router.post('/', (req, res) => {
  const produtos = readJson(PRODUTOS_FILE, []);
  const codigo = String(req.body.codigo || '').trim().toUpperCase();
  const nome = String(req.body.nome || '').trim();
  const categoria = String(req.body.categoria || '').trim();
  const fator = Number(req.body.fator || 1) || 1;
  const sku = String(req.body.sku || '').trim();
  const imagem = String(req.body.imagem || '').trim();
  const quantidadeInicial = Number(req.body.quantidade || 0) || 0;

  if (!codigo || !nome) {
    return res.status(400).json({ ok: false, message: 'Código e nome são obrigatórios.' });
  }

  const duplicado = produtos.find((p) => String(p.codigo || '').toUpperCase() === codigo);
  if (duplicado) {
    return res.status(400).json({ ok: false, message: 'Já existe produto com esse código.' });
  }

  const novo = {
    id: `prod_${Date.now()}`,
    codigo,
    nome,
    categoria,
    fator,
    sku: sku || `SKU-${Math.floor(Math.random() * 999999)}`,
    imagem,
    estoqueTotal: 0,
    quantidade: 0,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };

  produtos.unshift(novo);
  saveJson(PRODUTOS_FILE, produtos);

  if (quantidadeInicial > 0) {
    const movs = readJson(MOVS_FILE, []);
    movs.unshift({
      id: `mov_${Date.now()}`,
      produtoId: novo.id,
      tipo: 'entrada',
      endereco: 'SEM_ENDERECO',
      quantidade: quantidadeInicial,
      status: 'ativo',
      data: new Date().toISOString(),
      observacao: 'Saldo inicial do cadastro do produto'
    });
    saveJson(MOVS_FILE, movs);
  }

  const { produtos: atualizados } = recalculateInventory();
  const salvo = atualizados.find((p) => String(p.id) === String(novo.id)) || novo;
  res.status(201).json(salvo);
});

router.put('/:id', (req, res) => {
  const produtos = readJson(PRODUTOS_FILE, []);
  const index = produtos.findIndex((p) => String(p.id) === String(req.params.id));

  if (index === -1) {
    return res.status(404).json({ ok: false, message: 'Produto não encontrado.' });
  }

  const atual = produtos[index];
  const codigo = String(req.body.codigo || atual.codigo || '').trim().toUpperCase();
  const nome = String(req.body.nome || atual.nome || '').trim();

  const duplicado = produtos.find((p, i) => i !== index && String(p.codigo || '').toUpperCase() === codigo);
  if (duplicado) {
    return res.status(400).json({ ok: false, message: 'Já existe produto com esse código.' });
  }

  produtos[index] = {
    ...atual,
    codigo,
    nome,
    categoria: String(req.body.categoria ?? atual.categoria ?? '').trim(),
    fator: Number(req.body.fator ?? atual.fator ?? 1) || 1,
    sku: String(req.body.sku ?? atual.sku ?? '').trim(),
    imagem: String(req.body.imagem ?? atual.imagem ?? '').trim(),
    atualizadoEm: new Date().toISOString()
  };

  saveJson(PRODUTOS_FILE, produtos);
  const { produtos: atualizados } = recalculateInventory();
  res.json(atualizados.find((p) => String(p.id) === String(req.params.id)) || produtos[index]);
});

router.delete('/:id', (req, res) => {
  const produtoId = String(req.params.id);
  let produtos = readJson(PRODUTOS_FILE, []);
  produtos = produtos.filter((p) => String(p.id) !== produtoId);
  saveJson(PRODUTOS_FILE, produtos);

  let movs = readJson(MOVS_FILE, []);
  movs = movs.filter((m) => String(m.produtoId) !== produtoId);
  saveJson(MOVS_FILE, movs);

  recalculateInventory();
  res.json({ ok: true });
});

module.exports = router;
