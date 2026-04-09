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

/* ESTOQUE */
app.get('/api/estoque',(req,res)=>{
  res.json(readJson(ESTOQUE_FILE));
});

app.get('/api/movimentacoes',(req,res)=>{
  res.json(readJson(MOVS_FILE));
});

app.post('/api/estoque/movimentar',(req,res)=>{
  const { produtoId,endereco,quantidade,tipo } = req.body;

  const estoque = readJson(ESTOQUE_FILE);
  const produtos = readJson(PRODUTOS_FILE);
  const movs = readJson(MOVS_FILE);

  let registro = estoque.find(e=>
    e.produtoId===produtoId &&
    e.endereco===endereco
  );

  if(!registro){
    registro={
      produtoId,
      endereco,
      quantidade:0
    };

    estoque.push(registro);
  }

  if(tipo==='entrada'){
    registro.quantidade += Number(quantidade);
  }

  if(tipo==='saida'){
    registro.quantidade -= Number(quantidade);
  }

  if(tipo==='ajuste'){
    registro.quantidade = Number(quantidade);
  }

  const produto = produtos.find(p=>p.id===produtoId);

  produto.estoqueTotal =
    estoque
    .filter(e=>e.produtoId===produtoId)
    .reduce((acc,e)=>acc+e.quantidade,0);

  movs.unshift({
    id:Date.now().toString(),
    produtoId,
    endereco,
    quantidade,
    tipo,
    data:new Date().toISOString()
  });

  saveJson(ESTOQUE_FILE,estoque);
  saveJson(PRODUTOS_FILE,produtos);
  saveJson(MOVS_FILE,movs);

  res.json({ok:true});
});

app.get('*',(req,res)=>{
  res.sendFile(path.join(PUBLIC_DIR,'index.html'));
});

app.listen(PORT,()=>{
  console.log('Servidor rodando porta',PORT);
});
