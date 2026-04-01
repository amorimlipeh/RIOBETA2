const express=require('express');
const fs=require('fs');
const path=require('path');
const app=express();
app.use(express.json());
app.use((req,res,next)=>{res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');res.setHeader('Pragma','no-cache');res.setHeader('Expires','0');next();});
app.use(express.static(path.join(__dirname,'public')));
const dataDir=path.join(__dirname,'data');
const usersFile=path.join(dataDir,'usuarios.json');
function ensureData(){ if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir,{recursive:true}); if(!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([{id:1,login:'admin',senha:'123',cargo:'admin'}],null,2));}
function readUsers(){ ensureData(); return JSON.parse(fs.readFileSync(usersFile,'utf8')||'[]');}
function saveUsers(users){ ensureData(); fs.writeFileSync(usersFile, JSON.stringify(users,null,2));}
app.get('/api/health',(req,res)=>res.json({ok:true,sistema:'RIOBETA2 V21 FINAL',versao:'21.0.0'}));
app.post('/api/register',(req,res)=>{ const {login,senha}=req.body||{}; if(!login||!senha) return res.status(400).json({ok:false,msg:'Preencha login e senha.'}); const users=readUsers(); if(users.find(u=>u.login.toLowerCase()===String(login).toLowerCase())) return res.status(409).json({ok:false,msg:'Usuário já existe.'}); const user={id:Date.now(),login:String(login).trim(),senha:String(senha),cargo:'admin'}; users.push(user); saveUsers(users); res.json({ok:true,msg:'Usuário criado com sucesso.',usuario:{login:user.login,cargo:user.cargo}});});
app.post('/api/login',(req,res)=>{ const {login,senha}=req.body||{}; if(!login||!senha) return res.status(400).json({ok:false,msg:'Preencha login e senha.'}); const user=readUsers().find(u=>u.login.toLowerCase()===String(login).toLowerCase()&&u.senha===String(senha)); if(!user) return res.status(401).json({ok:false,msg:'Erro login'}); res.json({ok:true,usuario:{login:user.login,cargo:user.cargo||'admin'}});});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
const PORT=process.env.PORT||3000; ensureData(); app.listen(PORT,'0.0.0.0',()=>console.log('RIOBETA2 V21 FINAL rodando na porta '+PORT));