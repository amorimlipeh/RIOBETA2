
const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const read = (f)=>JSON.parse(fs.readFileSync(f));
const write = (f,d)=>fs.writeFileSync(f,JSON.stringify(d,null,2));

app.get('/api/produtos',(req,res)=>res.json(read('data/produtos.json')));
app.post('/api/produtos',(req,res)=>{
  let d=read('data/produtos.json');
  d.push(req.body);
  write('data/produtos.json',d);
  res.json({ok:true});
});

app.get('/api/estoque',(req,res)=>res.json(read('data/estoque.json')));
app.post('/api/estoque',(req,res)=>{
  let d=read('data/estoque.json');
  d.push(req.body);
  write('data/estoque.json',d);
  res.json({ok:true});
});

app.get('/api/pedidos',(req,res)=>res.json(read('data/pedidos.json')));
app.post('/api/pedidos',(req,res)=>{
  let d=read('data/pedidos.json');
  d.push(req.body);
  write('data/pedidos.json',d);
  res.json({ok:true});
});

app.listen(3000,()=>console.log('RIOBETA2 ONLINE'));
