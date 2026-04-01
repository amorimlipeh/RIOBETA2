
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
app.post('/api/fixar',(req,res)=>{
 let e=read('fixos.json')
 e.push(req.body)
 save('fixos.json',e)
 res.json({ok:true})
})
app.get('/api/fixos',(req,res)=>res.json(read('fixos.json')))

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public/index.html')))
app.listen(process.env.PORT||3000,'0.0.0.0')
