
const express=require('express');
const fs=require('fs');
const path=require('path');
const app=express();
app.use(express.json());
app.use(express.static('public'));

let operadores=[]

app.post('/api/iniciar',(req,res)=>{
  operadores.push({
    id:Date.now(),
    nome:req.body.nome||'Operador',
    status:'andamento',
    endereco:req.body.endereco||'-',
    tempo:0
  })
  res.json({ok:true})
})

app.get('/api/painel',(req,res)=>{
  res.json(operadores)
})

app.post('/api/finalizar',(req,res)=>{
  operadores=operadores.map(o=>o.id==req.body.id?{...o,status:'finalizado'}:o)
  res.json({ok:true})
})

setInterval(()=>{
  operadores=operadores.map(o=>({...o,tempo:o.tempo+1}))
},1000)

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public/index.html')))
app.listen(process.env.PORT||3000,'0.0.0.0')
