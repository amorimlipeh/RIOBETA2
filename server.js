
const express=require('express');
const fs=require('fs');
const path=require('path');
const app=express();
app.use(express.json());
app.use(express.static('public'));

const file=n=>path.join(__dirname,'data',n)
const read=n=>{try{return JSON.parse(fs.readFileSync(file(n)))}catch{return[]}}
const save=(n,d)=>fs.writeFileSync(file(n),JSON.stringify(d,null,2))

// login
app.post('/api/login',(req,res)=>{
 const users=read('usuarios.json')
 const u=users.find(x=>x.login===req.body.login && x.senha===req.body.senha)
 if(!u) return res.json({ok:false})
 res.json({ok:true,empresa:u.empresa})
})

// empresas
app.get('/api/empresas',(req,res)=>res.json(read('empresas.json')))
app.post('/api/empresas',(req,res)=>{
 let e=read('empresas.json')
 e.push({id:Date.now(),nome:req.body.nome,ativa:true})
 save('empresas.json',e)
 res.json({ok:true})
})

// usuarios
app.post('/api/usuarios',(req,res)=>{
 let u=read('usuarios.json')
 u.push(req.body)
 save('usuarios.json',u)
 res.json({ok:true})
})

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public/index.html')))
app.listen(process.env.PORT||3000,'0.0.0.0')
