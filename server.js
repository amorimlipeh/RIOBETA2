
const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const jwt = require('jsonwebtoken')
const path = require('path')

const app = express()
app.use(express.json())
app.use(express.static('public'))

const db = new sqlite3.Database('./database.db')

// init db
db.serialize(()=>{
 db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, login TEXT, senha TEXT)")
})

// middleware auth
function auth(req,res,next){
 const token = req.headers.authorization
 if(!token) return res.status(401).json({ok:false})
 try{
  jwt.verify(token,'segredo')
  next()
 }catch{
  res.status(401).json({ok:false})
 }
}

// login
app.post('/api/login',(req,res)=>{
 const {login,senha} = req.body
 db.get("SELECT * FROM users WHERE login=? AND senha=?",[login,senha],(err,row)=>{
  if(!row) return res.json({ok:false})
  const token = jwt.sign({id:row.id},'segredo')
  res.json({ok:true,token})
 })
})

// create user
app.post('/api/user',(req,res)=>{
 const {login,senha} = req.body
 db.run("INSERT INTO users (login,senha) VALUES (?,?)",[login,senha])
 res.json({ok:true})
})

// protected route
app.get('/api/protected',auth,(req,res)=>{
 res.json({ok:true,msg:"Acesso liberado"})
})

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public/index.html')))
app.listen(3000,'0.0.0.0')
