
const express=require('express');
const app=express();
app.use(express.json());
app.use(express.static('public'));

let operadores=[
 {nome:'João',tempo:120,itens:30},
 {nome:'Maria',tempo:90,itens:40},
 {nome:'Carlos',tempo:200,itens:20}
];

app.get('/api/ia',(req,res)=>{
 let ranking=[...operadores].sort((a,b)=>b.itens-a.itens)
 let gargalo=operadores.find(o=>o.tempo>150)

 let sugestao='Operação balanceada'
 if(gargalo){
   sugestao='Reduzir carga do operador '+gargalo.nome
 }

 res.json({
   ranking,
   gargalo:gargalo||null,
   sugestao,
   media: Math.round(operadores.reduce((s,o)=>s+o.tempo,0)/operadores.length)
 })
})

app.listen(process.env.PORT||3000,'0.0.0.0')
