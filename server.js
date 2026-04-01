
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const file = (f) => path.join(__dirname, 'data', f);

function read(f){
  try { return JSON.parse(fs.readFileSync(file(f))); }
  catch { return []; }
}

function save(f,data){
  fs.writeFileSync(file(f), JSON.stringify(data,null,2));
}

app.get('/api/dashboard',(req,res)=>{
  const p=read('produtos.json');
  const e=read('estoque.json');
  const ped=read('pedidos.json');
  res.json({
    produtos:p.length,
    estoqueTotal:e.reduce((s,i)=>s+Number(i.qtd||0),0),
    pedidosAbertos:ped.filter(i=>i.status!=='finalizado').length
  });
});

app.get('/api/produtos',(req,res)=>res.json(read('produtos.json')));
app.post('/api/produtos',(req,res)=>{
  let d=read('produtos.json');
  d.push({id:Date.now(),...req.body});
  save('produtos.json',d);
  res.json({ok:true});
});
app.delete('/api/produtos/:id',(req,res)=>{
  let d=read('produtos.json').filter(i=>i.id!=req.params.id);
  save('produtos.json',d);
  res.json({ok:true});
});

app.get('/api/estoque',(req,res)=>res.json(read('estoque.json')));
app.post('/api/estoque',(req,res)=>{
  let d=read('estoque.json');
  d.push({id:Date.now(),...req.body});
  save('estoque.json',d);
  res.json({ok:true});
});

app.get('/api/pedidos',(req,res)=>res.json(read('pedidos.json')));
app.post('/api/pedidos',(req,res)=>{
  let d=read('pedidos.json');
  d.push({id:Date.now(),status:'aberto',...req.body});
  save('pedidos.json',d);
  res.json({ok:true});
});
app.post('/api/pedidos/:id',(req,res)=>{
  let d=read('pedidos.json');
  d=d.map(i=>i.id==req.params.id?{...i,status:'finalizado'}:i);
  save('pedidos.json',d);
  res.json({ok:true});
});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public/index.html')));

const PORT=process.env.PORT||3000;
app.listen(PORT,'0.0.0.0',()=>console.log('V3 ONLINE'));
