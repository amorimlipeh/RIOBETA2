
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const file = path.join(__dirname,'data','usuarios.json');
if(!fs.existsSync(file)) fs.writeFileSync(file,'[]');

function getUsers(){
  return JSON.parse(fs.readFileSync(file));
}
function save(u){
  fs.writeFileSync(file, JSON.stringify(u,null,2));
}

app.post('/api/register',(req,res)=>{
  const {login,senha}=req.body;
  const users=getUsers();
  if(users.find(x=>x.login===login)) return res.json({ok:false});
  users.push({login,senha});
  save(users);
  res.json({ok:true});
});

app.post('/api/login',(req,res)=>{
  const {login,senha}=req.body;
  const users=getUsers();
  const u=users.find(x=>x.login===login && x.senha===senha);
  if(!u) return res.json({ok:false});
  res.json({ok:true});
});

app.get('*',(req,res)=>res.sendFile(__dirname+'/public/index.html'));

app.listen(process.env.PORT||3000,()=>console.log('ok'));
