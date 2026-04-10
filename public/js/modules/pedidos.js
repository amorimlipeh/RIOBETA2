
window.editandoPedidoIndex = null;

(function(){

const PEDIDOS_STORAGE_KEY='pedidosSalvosMemoria';

let pedidosProdutosCache=[];
let pedidosSalvosMemoria=[];


/* ===========================
   STORAGE
=========================== */

function carregarPedidosSalvos(){
try{
pedidosSalvosMemoria=JSON.parse(localStorage.getItem(PEDIDOS_STORAGE_KEY)||'[]');
}catch{
pedidosSalvosMemoria=[];
}
}

function persistirPedidosSalvos(){
localStorage.setItem(PEDIDOS_STORAGE_KEY,JSON.stringify(pedidosSalvosMemoria));
}


/* ===========================
   ITENS
=========================== */

function coletarItensPedidoAtual(){
const itens=[];

document.querySelectorAll('.pedido-item-card-real').forEach(card=>{

itens.push({
codigo:card.dataset.codigo||'',
nome:card.dataset.nome||'',
totalUnd:Number(card.dataset.totalund||0),
caixas:Number(card.dataset.caixas||0),
avulsas:Number(card.dataset.avulsas||0),
fator:Number(card.dataset.fator||1),
imagem:card.dataset.imagem||''
});

});

return itens;
}


/* ===========================
   LIMPAR FORM
=========================== */

function limparFormularioPedido(){

['pedidoCliente','pedidoRepresentante','pedidoNumero'].forEach(id=>{
const el=document.getElementById(id);
if(el) el.value='';
});

const lista=document.getElementById('listaItensPedidoReal');

if(lista){
lista.innerHTML='<p style="color:#cbd5e1;">Nenhum item adicionado.</p>';
}

const footer=document.getElementById('pedidoFooterAcoes');
if(footer) footer.style.display='none';

window.editandoPedidoIndex=null;

}


/* ===========================
   RENDER PEDIDOS
=========================== */

function renderPedidosSalvos(){

const lista=document.getElementById('listaPedidosSalvos');
if(!lista) return;

lista.innerHTML='';

if(!pedidosSalvosMemoria.length){
lista.innerHTML='<p style="color:#cbd5e1;">Nenhum pedido salvo.</p>';
return;
}

pedidosSalvosMemoria.forEach((pedido,index)=>{

lista.innerHTML+=`
<div style="background:#162742;padding:14px;border-radius:12px;margin-bottom:10px;">
<div style="color:#fff;font-weight:700;">${pedido.id}</div>
<div style="color:#dbe7ff;">${pedido.cliente||'Sem cliente'}</div>

<div style="display:flex;gap:10px;margin-top:10px;">
<button onclick="window.visualizarPedidoModal(${index})"
style="flex:1;background:#2f6df6;color:#fff;border:none;padding:10px;border-radius:8px;">
Abrir
</button>

<button onclick="window.cancelarPedidoSalvo(${index})"
style="flex:1;background:#ef4444;color:#fff;border:none;padding:10px;border-radius:8px;">
Cancelar
</button>
</div>
</div>
`;

});

}


/* ===========================
   SALVAR PEDIDO
=========================== */

function adicionarPedidoNaLista(){

const cliente=document.getElementById('pedidoCliente')?.value||'';
const representante=document.getElementById('pedidoRepresentante')?.value||'';
const numero=document.getElementById('pedidoNumero')?.value||'';
const data=document.getElementById('pedidoData')?.value||'';

const itens=coletarItensPedidoAtual();

if(!itens.length) return;

const pedido={
id:
window.editandoPedidoIndex!==null
&& pedidosSalvosMemoria[window.editandoPedidoIndex]
? pedidosSalvosMemoria[window.editandoPedidoIndex].id
: 'PED-'+Date.now(),

cliente,
representante,
numero,
data,
status:'Aguardando Separação',
itens
};

if(
window.editandoPedidoIndex!==null
&& pedidosSalvosMemoria[window.editandoPedidoIndex]
){

pedidosSalvosMemoria[window.editandoPedidoIndex]=pedido;

}else{

pedidosSalvosMemoria.unshift(pedido);

}

persistirPedidosSalvos();

renderPedidosSalvos();

abrirModalFinalizacaoPedido();

}


/* ===========================
   ABRIR PEDIDO
=========================== */

function abrirPedidoSalvo(index){

const pedido=pedidosSalvosMemoria[index];
if(!pedido) return;

window.editandoPedidoIndex=index;

document.getElementById('pedidoCliente').value=pedido.cliente||'';
document.getElementById('pedidoRepresentante').value=pedido.representante||'';
document.getElementById('pedidoNumero').value=pedido.numero||'';
document.getElementById('pedidoData').value=pedido.data||'';

const lista=document.getElementById('listaItensPedidoReal');

if(lista){

lista.innerHTML='';

pedido.itens.forEach(item=>{

lista.innerHTML+=`
<div class="pedido-item-card-real"
data-codigo="${item.codigo}"
data-nome="${item.nome}"
data-totalund="${item.totalUnd}"
data-caixas="${item.caixas}"
data-avulsas="${item.avulsas}"
data-fator="${item.fator}"
data-imagem="${item.imagem}"
style="
background:#162742;
padding:12px;
border-radius:10px;
margin-bottom:10px;
color:#fff;
">
<b>${item.codigo}</b><br>
${item.nome}<br>
${item.caixas} CX | ${item.totalUnd} UND
</div>
`;

});

}

window.scrollTo({
top:0,
behavior:'smooth'
});

}


/* ===========================
   CANCELAR
=========================== */

function cancelarPedidoSalvo(index){

pedidosSalvosMemoria.splice(index,1);

persistirPedidosSalvos();

renderPedidosSalvos();

}


/* ===========================
   MODAL FINAL
=========================== */

function abrirModalFinalizacaoPedido(){

let modal=document.getElementById('modalFinalizarPedido');

if(modal) modal.remove();

modal=document.createElement('div');

modal.id='modalFinalizarPedido';

modal.style.cssText=`
position:fixed;
inset:0;
background:rgba(0,0,0,.7);
display:flex;
align-items:center;
justify-content:center;
z-index:999999;
`;

modal.innerHTML=`
<div style="
background:#162742;
padding:25px;
border-radius:15px;
width:90%;
max-width:420px;
">

<h3 style="color:#fff;">Pedido salvo com sucesso</h3>

<div style="display:flex;gap:10px;margin-top:20px;">

<button onclick="
document.getElementById('modalFinalizarPedido').remove();
"
style="
flex:1;
padding:12px;
background:#475569;
color:#fff;
border:none;
border-radius:10px;
">
Continuar Editando
</button>

<button onclick="
limparFormularioPedido();
document.getElementById('modalFinalizarPedido').remove();
"
style="
flex:1;
padding:12px;
background:#22c55e;
color:#fff;
border:none;
border-radius:10px;
">
Finalizar Pedido
</button>

</div>
</div>
`;

document.body.appendChild(modal);

}


/* ===========================
   WINDOW EXPORT
=========================== */

window.abrirPedidoSalvo=abrirPedidoSalvo;
window.cancelarPedidoSalvo=cancelarPedidoSalvo;
window.adicionarPedidoNaLista=adicionarPedidoNaLista;
window.limparFormularioPedido=limparFormularioPedido;

carregarPedidosSalvos();

setTimeout(renderPedidosSalvos,500);

})();
