
const express=require('express');
const fs=require('fs');
const path=require('path');
const app=express();
app.use(express.json());
app.use(express.static('public'));

const f=n=>path.join(__dirname,'data',n);
const read=n=>{try{return JSON.parse(fs.readFileSync(f(n)))}catch{return[]}}
const save=(n,d)=>fs.writeFileSync(f(n),JSON.stringify(d,null,2))

app.get('/api/picking/:id',(req,res)=>{
 const pedidos=read('pedidos.json')
 const estoque=read('estoque.json')
 const ped=pedidos.find(p=>p.id==req.params.id)
 if(!ped) return res.json({ok:false})

 let lista=ped.itens.map(i=>{
   let est=estoque.find(e=>e.nome===i.nome)
   return {...i,endereco:est?est.endereco:'N/A'}
 })
 lista.sort((a,b)=>(a.endereco||'').localeCompare(b.endereco||''))

 res.json({ok:true,lista})
})

app.post('/api/retirar',(req,res)=>{
 let estoque=read('estoque.json')
 let item=estoque.find(i=>i.nome===req.body.nome && i.endereco===req.body.endereco)
 if(item){
   item.qtd-=Number(req.body.qtd)
   if(item.qtd<=0) estoque=estoque.filter(i=>i!==item)
   save('estoque.json',estoque)
 }
 res.json({ok:true})
})

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public/index.html')))
app.listen(process.env.PORT||3000,'0.0.0.0')
