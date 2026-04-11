const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const estoqueFile = path.join(__dirname, '../../data/estoque.json');
const movFile = path.join(__dirname, '../../data/movimentacoes.json');

function read(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file));
}

function write(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

router.get('/', (req, res) => {
  res.json(read(estoqueFile));
});

router.get('/movimentacoes', (req, res) => {
  res.json(read(movFile));
});

router.post('/movimentar', (req, res) => {
  let estoque = read(estoqueFile);
  let movs = read(movFile);

  const { produtoId, tipo, endereco, quantidade } = req.body;

  const idx = estoque.findIndex(e =>
    e.produtoId === produtoId &&
    e.endereco === endereco
  );

  let atual = idx >= 0 ? estoque[idx].quantidade : 0;

  if (tipo === 'entrada') atual += quantidade;
  if (tipo === 'saida') atual -= quantidade;

  if (tipo === 'ajuste') {
    atual = quantidade; // SALDO FINAL
  }

  if (idx >= 0) {
    estoque[idx].quantidade = atual;
  } else {
    estoque.push({
      produtoId,
      endereco: endereco || 'SEM_ENDERECO',
      quantidade: atual
    });
  }

  movs.push({
    produtoId,
    tipo,
    endereco: endereco || 'SEM_ENDERECO',
    quantidade,
    data: new Date().toISOString()
  });

  write(estoqueFile, estoque);
  write(movFile, movs);

  res.sendStatus(200);
});

module.exports = router;
