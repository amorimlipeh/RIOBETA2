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

function getVisualStatus(status){
  const s = String(status || '').trim();

  if(s === 'Concluído'){
    return { cor:'#22c55e', icone:'🟢', fundo:'#123524' };
  }

  if(s === 'Em Separação'){
    return { cor:'#facc15', icone:'🟡', fundo:'#3a2f0b' };
  }

  if(s === 'Bloqueado'){
    return { cor:'#ef4444', icone:'🔴', fundo:'#3b1212' };
  }

  return { cor:'#facc15', icone:'🟡', fundo:'#162742' };
}

function renderSeparacao(){

  const root = document.getElementById('separacao-root');
  if(!root) return;

  const pedidos = getPedidos();

  const pendentes = pedidos.filter(p => p.status === 'Aguardando Separação');
  const andamento = pedidos.filter(p => p.status === 'Em Separação');
  const concluidos = pedidos.filter(p => p.status === 'Concluído');
  const bloqueados = pedidos.filter(p => p.status === 'Bloqueado');

  root.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;">

      ${renderColuna('Pendentes', pendentes, 'pendente')}
      ${renderColuna('Em Separação', andamento, 'andamento')}
      ${renderColuna('Concluídos', concluidos, 'concluido')}
      ${renderColuna('Bloqueados', bloqueados, 'bloqueado')}

    </div>
  `;
}

function renderColuna(titulo, lista, modo){
  return `
    <div style="background:#223754;padding:15px;border-radius:14px;">
      <h3 style="color:#fff;margin-bottom:10px;">${titulo}</h3>
      ${
        lista.length === 0
        ? `<p style="color:#cbd5e1;">Nenhum pedido</p>`
        : lista.map(p => renderCard(p, modo)).join('')
      }
    </div>
  `;
}

function renderCard(pedido, modo){
  const visual = getVisualStatus(pedido.status);

  return `
    <div style="
      background:#0b1730;
      padding:12px;
      border-radius:10px;
      margin-bottom:10px;
      color:#fff;
      border:1px solid ${visual.cor};
    ">
      <div style="font-weight:800;">${pedido.id}</div>
      <div style="font-size:13px;">${pedido.cliente || '-'}</div>
      <div style="font-size:12px;color:#7fb0ff;">${(pedido.itens || []).length} itens</div>
      <div style="font-size:13px;color:${visual.cor};margin-top:4px;">${visual.icone} ${pedido.status}</div>

      ${
        modo === 'pendente'
        ? `
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            <button onclick="window.iniciarSeparacao('${pedido.id}')" style="flex:1;padding:10px;border:none;border-radius:8px;background:#f59e0b;color:#fff;font-weight:700;">Iniciar</button>
            <button onclick="window.bloquearPedidoSeparacao('${pedido.id}')" style="flex:1;padding:10px;border:none;border-radius:8px;background:#ef4444;color:#fff;font-weight:700;">Bloquear</button>
          </div>
        `
        : ''
      }

      ${
        modo === 'andamento'
        ? `
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            <button onclick="window.concluirSeparacao('${pedido.id}')" style="flex:1;padding:10px;border:none;border-radius:8px;background:#22c55e;color:#fff;font-weight:700;">Concluir</button>
            <button onclick="window.bloquearPedidoSeparacao('${pedido.id}')" style="flex:1;padding:10px;border:none;border-radius:8px;background:#ef4444;color:#fff;font-weight:700;">Bloquear</button>
          </div>
        `
        : ''
      }

      ${
        modo === 'bloqueado'
        ? `
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            <button onclick="window.liberarPedidoSeparacao('${pedido.id}')" style="flex:1;padding:10px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-weight:700;">Liberar Pedido</button>
          </div>
        `
        : ''
      }
    </div>
  `;
}

window.iniciarSeparacao = function(id){
  const pedidos = getPedidos();

  pedidos.forEach(p => {
    if(p.id === id){
      p.status = 'Em Separação';
    }
  });

  salvarPedidos(pedidos);
  renderSeparacao();
};

window.concluirSeparacao = function(id){
  const pedidos = getPedidos();

  pedidos.forEach(p => {
    if(p.id === id){
      p.status = 'Concluído';
    }
  });

  salvarPedidos(pedidos);
  renderSeparacao();
};

window.bloquearPedidoSeparacao = function(id){
  const pedidos = getPedidos();

  pedidos.forEach(p => {
    if(p.id === id){
      p.status = 'Bloqueado';
    }
  });

  salvarPedidos(pedidos);
  renderSeparacao();
};

window.liberarPedidoSeparacao = function(id){
  const pedidos = getPedidos();

  pedidos.forEach(p => {
    if(p.id === id){
      p.status = 'Aguardando Separação';
    }
  });

  salvarPedidos(pedidos);
  renderSeparacao();
};

window.renderSeparacao = renderSeparacao;

})();
