(function(){

const PEDIDOS_STORAGE_KEY='pedidosSalvosMemoria';

let pedidosSalvosMemoria=
JSON.parse(localStorage.getItem(PEDIDOS_STORAGE_KEY)||'[]');

let editandoPedidoIndex=null;

function persistirPedidos(){
localStorage.setItem(
PEDIDOS_STORAGE_KEY,
JSON.stringify(pedidosSalvosMemoria)
);
}

function renderPedidosSalvos(){

const area=document.querySelector('#pedidosSalvosLista') ||
document.querySelector('.pedidos-salvos') ||
document.querySelector('#listaPedidosSalvos');

if(!area) return;

area.innerHTML='';

pedidosSalvosMemoria.forEach((pedido,index)=>{

area.innerHTML+=`
<div class="pedido-card">
<div><strong>${pedido.id}</strong></div>
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

window.abrirPedidoVisualizacao=function(index){

const pedido=pedidosSalvosMemoria[index];

if(!pedido) return;

alert(
pedido.itens.map(i=>
`${i.codigo} - ${i.nome}
${i.caixas||0} CX / ${i.unidades||0} UND`
).join('\n\n')
);

}

window.editarPedido=function(index){

const pedido=pedidosSalvosMemoria[index];

if(!pedido) return;

editandoPedidoIndex=index;

window.itensPedidoAtual=[...pedido.itens];

if(typeof abrirModalProdutoPedido==='function'){
abrirModalProdutoPedido();
}

renderItensPedido();

}

window.cancelarPedido=function(index){

if(!confirm('Deseja cancelar este pedido?')) return;

pedidosSalvosMemoria.splice(index,1);

persistirPedidos();

renderPedidosSalvos();

}

window.salvarPedidoAtualizado=function(){

if(!window.itensPedidoAtual?.length){
alert('Nenhum item no pedido.');
return;
}

const cliente=
document.getElementById('pedidoCliente')?.value||'';

const representante=
document.getElementById('pedidoRepresentante')?.value||'';

const numero=
document.getElementById('pedidoNumero')?.value||'';

const data=
document.getElementById('pedidoData')?.value||'';

const pedido={

id:
editandoPedidoIndex!==null
? pedidosSalvosMemoria[editandoPedidoIndex].id
: 'PED-'+Date.now(),

cliente,
representante,
numero,
data,

status:'Aguardando Separação',

itens:[...window.itensPedidoAtual]

};

if(editandoPedidoIndex!==null){

pedidosSalvosMemoria[editandoPedidoIndex]=pedido;

editandoPedidoIndex=null;

}else{

pedidosSalvosMemoria.unshift(pedido);

}

persistirPedidos();

renderPedidosSalvos();

window.itensPedidoAtual=[];

renderItensPedido();

alert('Pedido salvo com sucesso.');

}

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

})();
