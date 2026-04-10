(function(){

const PEDIDOS_STORAGE_KEY='pedidosSalvosMemoria';

let pedidosSalvosMemoria=
JSON.parse(localStorage.getItem(PEDIDOS_STORAGE_KEY)||'[]');

let editandoPedidoIndex=null;


/* =========================
   STORAGE
========================= */
function persistirPedidos(){
localStorage.setItem(
PEDIDOS_STORAGE_KEY,
JSON.stringify(pedidosSalvosMemoria)
);
}


/* =========================
   BOTÃO DINÂMICO
========================= */
function atualizarTextoBotao(){

const btn=
document.querySelector('#btnSalvarPedido') ||
document.querySelector('#btnSalvarPedidoFinal');

if(!btn) return;

btn.innerText=
editandoPedidoIndex!==null
? 'Salvar Alterações'
: 'Salvar Pedido';

}


/* =========================
   PEDIDOS SALVOS
========================= */
function renderPedidosSalvos(){

const area=
document.querySelector('#pedidosSalvosLista') ||
document.querySelector('.pedidos-salvos') ||
document.querySelector('#listaPedidosSalvos');

if(!area) return;

area.innerHTML='';

pedidosSalvosMemoria.forEach((pedido,index)=>{

const emEdicao=
editandoPedidoIndex===index;

area.innerHTML+=`
<div class="pedido-card"
style="
${emEdicao?'border:2px solid #f59e0b;background:#3b2a10;':''}
">

<div>
<strong>${pedido.id}</strong>
${emEdicao?'<span style="color:#fbbf24;"> ✏️ Editando agora</span>':''}
</div>

<div>${pedido.cliente||'Sem cliente'}</div>
<div>🟡 ${pedido.status||'Aguardando Separação'}</div>

<div class="pedido-acoes">

<button onclick="abrirPedidoVisualizacao(${index})">
Abrir
</button>

<button onclick="editarPedido(${index})"
style="background:#f59e0b;">
Editar
</button>

<button onclick="cancelarPedido(${index})"
style="background:#ef4444;">
Cancelar
</button>

</div>
</div>
`;

});

}


/* =========================
   VISUALIZAÇÃO
========================= */
window.abrirPedidoVisualizacao=function(index){

const pedido=pedidosSalvosMemoria[index];
if(!pedido) return;

let texto=`
Pedido: ${pedido.id}

Cliente: ${pedido.cliente||'-'}
Status: ${pedido.status||'-'}

Itens:
`;

pedido.itens.forEach(item=>{
texto+=`

${item.codigo} - ${item.nome}
${item.caixas||0} CX / ${item.unidades||0} UND
`;
});

alert(texto);

}


/* =========================
   EDITAR
========================= */
window.editarPedido=function(index){

const pedido=pedidosSalvosMemoria[index];
if(!pedido) return;

editandoPedidoIndex=index;

window.itensPedidoAtual=[...pedido.itens];

document.getElementById('pedidoCliente').value=
pedido.cliente||'';

document.getElementById('pedidoRepresentante').value=
pedido.representante||'';

document.getElementById('pedidoNumero').value=
pedido.numero||'';

document.getElementById('pedidoData').value=
pedido.data||'';

renderItensPedido();
renderPedidosSalvos();
atualizarTextoBotao();

window.scrollTo({
top:0,
behavior:'smooth'
});

}


/* =========================
   CANCELAR
========================= */
window.cancelarPedido=function(index){

if(!confirm('Deseja cancelar este pedido?')) return;

pedidosSalvosMemoria.splice(index,1);

if(editandoPedidoIndex===index){
editandoPedidoIndex=null;
}

persistirPedidos();
renderPedidosSalvos();
atualizarTextoBotao();

}


/* =========================
   SALVAR
========================= */
window.salvarPedidoAtualizado=function(){

if(!window.itensPedidoAtual?.length){
alert('Nenhum item no pedido.');
return;
}

const pedido={

id:
editandoPedidoIndex!==null
? pedidosSalvosMemoria[editandoPedidoIndex].id
: 'PED-'+Date.now(),

cliente:
document.getElementById('pedidoCliente')?.value||'',

representante:
document.getElementById('pedidoRepresentante')?.value||'',

numero:
document.getElementById('pedidoNumero')?.value||'',

data:
document.getElementById('pedidoData')?.value||'',

status:'Aguardando Separação',

itens:[...window.itensPedidoAtual]

};

if(editandoPedidoIndex!==null){

pedidosSalvosMemoria[editandoPedidoIndex]=pedido;

}else{

pedidosSalvosMemoria.unshift(pedido);

}

editandoPedidoIndex=null;

persistirPedidos();

window.itensPedidoAtual=[];

renderItensPedido();
renderPedidosSalvos();
atualizarTextoBotao();

alert('Pedido salvo com sucesso.');

}


/* =========================
   RENDER ITENS
========================= */
function renderItensPedido(){

const area=
document.querySelector('#itensPedidoLista') ||
document.querySelector('.itens-pedido');

if(!area) return;

area.innerHTML='';

(window.itensPedidoAtual||[]).forEach(item=>{

area.innerHTML+=`
<div class="item-card">
<strong>${item.codigo}</strong><br>
${item.nome}<br>
${item.caixas||0} CX | ${item.unidades||0} UND
</div>
`;

});

}


window.finalizarPedido=window.salvarPedidoAtualizado;


renderPedidosSalvos();
atualizarTextoBotao();

})();
