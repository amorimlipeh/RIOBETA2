
const express=require('express');
const fs=require('fs');
const path=require('path');
const app=express();
app.use(express.json());
app.use(express.static('public'));

const f=n=>path.join(__dirname,'data',n);
const read=n=>{try{return JSON.parse(fs.readFileSync(f(n)))}catch{return[]}}
const save=(n,d)=>fs.writeFileSync(f(n),JSON.stringify(d,null,2))

// empresas
app.get('/api/empresas',(req,res)=>res.json(read('empresas.json')))
app.post('/api/empresas',(req,res)=>{
 let e=read('empresas.json')
 e.push({id:Date.now(),nome:req.body.nome})
 save('empresas.json',e)
 res.json({ok:true})
})

// financeiro
app.get('/api/financeiro',(req,res)=>res.json(read('financeiro.json')))
app.post('/api/financeiro',(req,res)=>{
 let fz=read('financeiro.json')
 fz.push({tipo:req.body.tipo,valor:req.body.valor,data:new Date()})
 save('financeiro.json',fz)
 res.json({ok:true})
})

// usuarios
app.get('/api/usuarios',(req,res)=>res.json(read('usuarios.json')))
app.post('/api/usuarios',(req,res)=>{
 let u=read('usuarios.json')
 u.push({nome:req.body.nome,cargo:req.body.cargo})
 save('usuarios.json',u)
 res.json({ok:true})
})

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public/index.html')))
app.listen(process.env.PORT||3000,'0.0.0.0')
