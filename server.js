
const express=require('express');
const fs=require('fs');
const path=require('path');
const app=express();
app.use(express.json());
app.use(express.static('public'));

const f=n=>path.join(__dirname,'data',n);
const read=n=>{try{return JSON.parse(fs.readFileSync(f(n)))}catch{return[]}}
const save=(n,d)=>fs.writeFileSync(f(n),JSON.stringify(d,null,2))

app.get('/api/estoque',(req,res)=>res.json(read('estoque.json')))

// buscar produto para picking
app.get('/api/picking/:nome',(req,res)=>{
 const e=read('estoque.json')
 const item=e.find(i=>i.nome.toLowerCase()===req.params.nome.toLowerCase())
 if(!item) return res.json({ok:false})
 res.json({ok:true,...item})
})

// retirar produto
app.post('/api/retirar',(req,res)=>{
 let e=read('estoque.json')
 let item=e.find(i=>i.endereco===req.body.endereco && i.nome===req.body.nome)

 if(item){
   item.qtd -= Number(req.body.qtd)
   if(item.qtd<=0) e=e.filter(i=>i!==item)
   save('estoque.json',e)
 }

 res.json({ok:true})
})

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public/index.html')))
app.listen(process.env.PORT||3000,'0.0.0.0')
