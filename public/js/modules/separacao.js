(function () {

const STORAGE = 'pedidosSalvosMemoria';

function getPedidos(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE) || '[]');
  }catch{
    return [];
  }
}

function salvarPedidos(lista){
  localStorage.setItem(STORAGE, JSON.stringify(lista));
}

function renderSeparacao(){

  const root = document.getElementById('separacao-root');
  if(!root) return;

  const pedidos = getPedidos();

  const pendentes = pedidos.filter(p => p.status === 'Aguardando Separação');
  const andamento = pedidos.filter(p => p.status === 'Em Separação');
  const concluidos = pedidos.filter(p => p.status === 'Concluído');

  root.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;">
      ${renderColuna('Pendentes', pendentes, 'iniciar')}
      ${renderColuna('Em Separação', andamento, 'concluir')}
      ${renderColuna('Concluídos', concluidos, null)}
    </div>
  `;
}

function renderColuna(titulo, lista, acao){
  return `
    <div style="background:#162742;padding:15px;border-radius:14px;">
      <h3 style="color:#fff;margin-bottom:10px;">${titulo}</h3>
      ${
        lista.length === 0
        ? `<p style="color:#cbd5e1;">Nenhum pedido</p>`
        : lista.map(p => renderCard(p, acao)).join('')
      }
    </div>
  `;
}

function renderCard(pedido, acao){
  return `
    <div style="background:#0b1730;padding:12px;border-radius:10px;margin-bottom:10px;color:#fff;">
      <div style="font-weight:800;">${pedido.id}</div>
      <div style="font-size:13px;">${pedido.cliente || '-'}</div>
      <div style="font-size:12px;color:#7fb0ff;">${pedido.itens.length} itens</div>

      ${
        acao === 'iniciar'
        ? `<button onclick="window.iniciarSeparacao('${pedido.id}')" style="margin-top:8px;width:100%;padding:10px;border:none;border-radius:8px;background:#f59e0b;color:#fff;font-weight:700;">Iniciar</button>`
        : ''
      }

      ${
        acao === 'concluir'
        ? `<button onclick="window.concluirSeparacao('${pedido.id}')" style="margin-top:8px;width:100%;padding:10px;border:none;border-radius:8px;background:#22c55e;color:#fff;font-weight:700;">Concluir</button>`
        : ''
      }
    </div>
  `;
}

window.iniciarSeparacao = function(id){
  const pedidos = getPedidos();
  pedidos.forEach(p => {
    if(p.id === id) p.status = 'Em Separação';
  });
  salvarPedidos(pedidos);
  renderSeparacao();
};

window.concluirSeparacao = function(id){
  const pedidos = getPedidos();
  pedidos.forEach(p => {
    if(p.id === id) p.status = 'Concluído';
  });
  salvarPedidos(pedidos);
  renderSeparacao();
};

window.renderSeparacao = renderSeparacao;

})();
