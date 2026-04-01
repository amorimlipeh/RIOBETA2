
const express=require('express');
const fs=require('fs');
const path=require('path');
const app=express();
app.use(express.json());
app.use(express.static('public'));

const f=n=>path.join(__dirname,'data',n);
const read=n=>{try{return JSON.parse(fs.readFileSync(f(n)))}catch{return[]}}
const save=(n,d)=>fs.writeFileSync(f(n),JSON.stringify(d,null,2))

// estoque
app.get('/api/estoque',(req,res)=>res.json(read('estoque.json')))
app.post('/api/estoque',(req,res)=>{
 let e=read('estoque.json')
 let fixos=read('fixos.json')

 const fixo=fixos.find(x=>x.endereco===req.body.endereco)
 if(fixo && fixo.produto!==req.body.nome){
   return res.json({ok:false,msg:'Endereço fixo para outro produto'})
 }

 let item=e.find(i=>i.endereco===req.body.endereco && i.nome===req.body.nome)
 if(item){ item.qtd+=Number(req.body.qtd) }
 else{ e.push({nome:req.body.nome,qtd:Number(req.body.qtd),endereco:req.body.endereco}) }

 save('estoque.json',e)
 res.json({ok:true})
})

// fixar produto
app.post('/api/fixar',(req,res)=>{
 let fxs=read('fixos.json')
 fxs.push({endereco:req.body.endereco,produto:req.body.produto})
 save('fixos.json',fxs)
 res.json({ok:true})
})

app.get('/api/fixos',(req,res)=>res.json(read('fixos.json')))

// sugestao simples
app.get('/api/sugerir',(req,res)=>{
 const e=read('estoque.json')
 for(let i=1;i<=30;i++){
   let pos=String(i).padStart(3,'0')
   let addr='01-'+pos+'-1-1'
   if(!e.find(x=>x.endereco===addr)){
     return res.json({endereco:addr})
   }
 }
 res.json({endereco:null})
})

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public/index.html')))
app.listen(process.env.PORT||3000,'0.0.0.0')
