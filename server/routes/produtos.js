const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const file = path.join(__dirname, '../../data/produtos.json');

function read() {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file));
}

function write(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

router.get('/', (req, res) => {
  res.json(read());
});

router.post('/', (req, res) => {
  const produtos = read();

  const novo = {
    id: 'prod_' + Date.now(),
    codigo: req.body.codigo,
    nome: req.body.nome,
    categoria: req.body.categoria || '',
    fator: Number(req.body.fator || 1),
    criadoEm: new Date().toISOString()
  };

  produtos.push(novo);
  write(produtos);

  res.json(novo);
});

router.put('/:id', (req, res) => {
  const produtos = read();

  const index = produtos.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).send('Produto não encontrado');

  produtos[index] = {
    ...produtos[index],
    ...req.body
  };

  write(produtos);
  res.json(produtos[index]);
});

router.delete('/:id', (req, res) => {
  let produtos = read();
  produtos = produtos.filter(p => p.id !== req.params.id);
  write(produtos);

  // remove do estoque também
  const estoquePath = path.join(__dirname, '../../data/estoque.json');
  let estoque = [];
  if (fs.existsSync(estoquePath)) {
    estoque = JSON.parse(fs.readFileSync(estoquePath));
  }

  estoque = estoque.filter(e => e.produtoId !== req.params.id);
  fs.writeFileSync(estoquePath, JSON.stringify(estoque, null, 2));

  res.sendStatus(200);
});

module.exports = router;
