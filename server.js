const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const PRODUTOS_FILE = path.join(DATA_DIR, 'produtos.json');
const ESTOQUE_FILE = path.join(DATA_DIR, 'estoque_enderecos.json');
const MOVS_FILE = path.join(DATA_DIR, 'movimentacoes.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

function ensure(file){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
  if(!fs.existsSync(file)) fs.writeFileSync(file,'[]');
}

ensure(PRODUTOS_FILE);
ensure(ESTOQUE_FILE);
ensure(MOVS_FILE);

const readJson = (file)=>JSON.parse(fs.readFileSync(file,'utf8')||'[]');
const saveJson = (file,data)=>fs.writeFileSync(file,JSON.stringify(data,null,2));

function recalcularEstoque() {
  const produtos = readJson(PRODUTOS_FILE);
  const movs = readJson(MOVS_FILE);

  const estoqueMap = {};
  const totalMap = {};

  movs
    .filter(m => m.status !== 'cancelado')
    .forEach(m => {
      if (m.tipo === 'transferencia') {
        const origemKey = `${m.produtoId}@@${m.origem}`;
        const destinoKey = `${m.produtoId}@@${m.destino}`;

        estoqueMap[origemKey] = (estoqueMap[origemKey] || 0) - Number(m.quantidade || 0);
        estoqueMap[destinoKey] = (estoqueMap[destinoKey] || 0) + Number(m.quantidade || 0);
      }

      if (m.tipo === 'entrada') {
        const key = `${m.produtoId}@@${m.endereco}`;
        estoqueMap[key] = (estoqueMap[key] || 0) + Number(m.quantidade || 0);
      }

      if (m.tipo === 'saida') {
        const key = `${m.produtoId}@@${m.endereco}`;
        estoqueMap[key] = (estoqueMap[key] || 0) - Number(m.quantidade || 0);
      }

      if (m.tipo === 'ajuste') {
        const key = `${m.produtoId}@@${m.endereco}`;
        estoqueMap[key] = Number(m.quantidade || 0);
      }
    });

  const estoque = Object.entries(estoqueMap)
    .map(([key, quantidade]) => {
      const [produtoId, endereco] = key.split('@@');
      return { produtoId, endereco, quantidade };
    })
    .filter(item => Number(item.quantidade) !== 0);

  estoque.forEach(item => {
    totalMap[item.produtoId] = (totalMap[item.produtoId] || 0) + Number(item.quantidade || 0);
  });

  const produtosAtualizados = produtos.map(produto => ({
    ...produto,
    estoqueTotal: totalMap[produto.id] || 0
  }));

  saveJson(ESTOQUE_FILE, estoque);
  saveJson(PRODUTOS_FILE, produtosAtualizados);

  return { estoque, produtos: produtosAtualizados };
}

/* PRODUTOS */
app.get('/api/produtos',(req,res)=>res.json(readJson(PRODUTOS_FILE)));

app.post('/api/produtos',(req,res)=>{
  const produtos = readJson(PRODUTOS_FILE);

  const novo = {
    id: Date.now().toString(),
    ...req.body,
    estoqueTotal: 0
  };

  produtos.push(novo);
  saveJson(PRODUTOS_FILE,produtos);

  res.json(novo);
});

app.put('/api/produtos/:id',(req,res)=>{
  const produtos = readJson(PRODUTOS_FILE);
  const i = produtos.findIndex(p=>p.id==req.params.id);

  if (i === -1) return res.status(404).json({ ok:false, message:'Produto não encontrado' });

  produtos[i] = { ...produtos[i], ...req.body };
  saveJson(PRODUTOS_FILE,produtos);

  res.json(produtos[i]);
});

app.delete('/api/produtos/:id',(req,res)=>{
  let produtos = readJson(PRODUTOS_FILE);
  produtos = produtos.filter(p=>p.id!=req.params.id);
  saveJson(PRODUTOS_FILE,produtos);
  res.json({ok:true});
});

/* ESTOQUE / MOVIMENTAÇÕES */
app.get('/api/estoque',(req,res)=>{
  res.json(readJson(ESTOQUE_FILE));
});

app.get('/api/movimentacoes',(req,res)=>{
  res.json(readJson(MOVS_FILE));
});

app.post('/api/estoque/movimentar',(req,res)=>{
  const { produtoId,endereco,quantidade,tipo } = req.body;
  const movs = readJson(MOVS_FILE);

  movs.unshift({
    id: Date.now().toString(),
    produtoId,
    endereco,
    quantidade: Number(quantidade || 0),
    tipo,
    status: 'ativo',
    data: new Date().toISOString()
  });

  saveJson(MOVS_FILE,movs);
  recalcularEstoque();

  res.json({ok:true});
});

app.post('/api/estoque/transferir',(req,res)=>{
  const { produtoId, origem, destino, quantidade } = req.body;
  const movs = readJson(MOVS_FILE);

  movs.unshift({
    id: Date.now().toString(),
    produtoId,
    origem,
    destino,
    quantidade: Number(quantidade || 0),
    tipo: 'transferencia',
    status: 'ativo',
    data: new Date().toISOString()
  });

  saveJson(MOVS_FILE,movs);
  recalcularEstoque();

  res.json({ok:true});
});

app.put('/api/movimentacoes/:id/cancelar',(req,res)=>{
  const movs = readJson(MOVS_FILE);
  const i = movs.findIndex(m => String(m.id) === String(req.params.id));

  if (i === -1) return res.status(404).json({ ok:false, message:'Movimentação não encontrada' });

  movs[i] = {
    ...movs[i],
    status: 'cancelado',
    canceladoEm: new Date().toISOString()
  };

  saveJson(MOVS_FILE, movs);
  recalcularEstoque();

  res.json({ ok:true, movimentacao: movs[i] });
});

app.get('*',(req,res)=>{
  res.sendFile(path.join(PUBLIC_DIR,'index.html'));
});

app.listen(PORT,()=>{
  console.log('Servidor rodando porta',PORT);
});
