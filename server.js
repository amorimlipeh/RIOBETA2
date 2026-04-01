
const express=require('express');
const fs=require('fs');
const path=require('path');
const app=express();
app.use(express.json());
app.use(express.static('public'));

const file=f=>path.join(__dirname,'data',f);

const read=f=>{try{return JSON.parse(fs.readFileSync(file(f)))}catch{return[]}}
const save=(f,d)=>fs.writeFileSync(file(f),JSON.stringify(d,null,2))

app.get('/api/dashboard',(req,res)=>{
 const p=read('produtos.json')
 const e=read('estoque.json')
 const ped=read('pedidos.json')
 res.json({
  produtos:p.length,
  estoque:e.reduce((s,i)=>s+Number(i.qtd||0),0),
  pedidos:ped.filter(i=>i.status!=='finalizado').length
 })
})

app.get('/api/produtos',(req,res)=>res.json(read('produtos.json')))
app.post('/api/produtos',(req,res)=>{
 let d=read('produtos.json')
 d.push({id:Date.now(),...req.body})
 save('produtos.json',d)
 res.json({ok:true})
})
app.put('/api/produtos/:id',(req,res)=>{
 let d=read('produtos.json')
 d=d.map(i=>i.id==req.params.id?{...i,...req.body}:i)
 save('produtos.json',d)
 res.json({ok:true})
})
app.delete('/api/produtos/:id',(req,res)=>{
 let d=read('produtos.json').filter(i=>i.id!=req.params.id)
 save('produtos.json',d)
 res.json({ok:true})
})

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public/index.html')))

app.listen(process.env.PORT||3000,'0.0.0.0')
