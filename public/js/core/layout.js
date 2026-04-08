setInterval(()=>{
document.getElementById('clock').innerHTML=
new Date().toLocaleTimeString('pt-BR');
},1000);
