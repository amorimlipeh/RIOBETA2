
const express=require('express');
const fs=require('fs');
const path=require('path');
const app=express();
app.use(express.json());
app.use(express.static('public'));

const f=n=>path.join(__dirname,'data',n);
const read=n=>{try{return JSON.parse(fs.readFileSync(f(n)))}catch{return[]}}
const save=(n,d)=>fs.writeFileSync(f(n),JSON.stringify(d,null,2))

app.get('/api/dashboard',(req,res)=>{
 const p=read('produtos.json')
 const e=read('estoque.json')
 const ped=read('pedidos.json')
 res.json({
  produtos:p.length,
  estoque:e.reduce((s,i)=>s+i.qtd,0),
  pedidos:ped.length
 })
})

app.get('/api/produtos',(req,res)=>res.json(read('produtos.json')))
app.post('/api/produtos',(req,res)=>{
 let d=read('produtos.json')
 d.push({id:Date.now(),nome:req.body.nome})
 save('produtos.json',d)
 res.json({ok:true})
})

app.get('/api/estoque',(req,res)=>res.json(read('estoque.json')))
app.post('/api/estoque',(req,res)=>{
 let e=read('estoque.json')
 let h=read('historico.json')

 let item=e.find(i=>i.nome===req.body.nome && i.endereco===req.body.endereco)
 if(item){ item.qtd+=Number(req.body.qtd) }
 else{ e.push({nome:req.body.nome,qtd:Number(req.body.qtd),endereco:req.body.endereco}) }

 h.push({data:new Date(),...req.body})
 save('estoque.json',e)
 save('historico.json',h)
 res.json({ok:true})
})

app.get('/api/historico',(req,res)=>res.json(read('historico.json')))

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public/index.html')))
app.listen(process.env.PORT||3000,'0.0.0.0')
