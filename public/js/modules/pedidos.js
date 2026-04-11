window.editandoPedidoIndex = null;

    const btn =
      document.getElementById('btnSalvarPedidoFinal') ||
      document.getElementById('btnSalvarPedido');

    if(btn){
      btn.innerText = 'Salvar Pedido';
    }

(function () {
  const PEDIDOS_STORAGE_KEY = 'pedidosSalvosMemoria';

  let pedidosProdutosCache = [];
  let pedidoProdutoSelecionado = null;
  let pedidosSalvosMemoria = [];

  function txt(v) {
    return String(v || '').trim();
  }

  function norm(v) {
    return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function getCodigo(p) {
    return txt(p.codigo || p.code || p.sku || '');
  }

  function getNome(p) {
    return txt(p.nome || p.name || p.descricao || 'Produto');
  }

  function getFator(p) {
    const f = Number(p.fator || p.fatorConversao || p.fator_conversao || p.caixa || 1);
    return isNaN(f) || f <= 0 ? 1 : f;
  }

  function getImagem(p) {
    return txt(p.imagem || p.image || p.foto || '');
  }

  async function carregarProdutosPedido() {
    const fontes = ['/api/produtos', '/data/produtos.json'];

    for (const url of fontes) {
      try {
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) continue;
        const data = await r.json();

        if (Array.isArray(data)) {
          pedidosProdutosCache = data;
          return;
        }

        if (Array.isArray(data.produtos)) {
          pedidosProdutosCache = data.produtos;
          return;
        }
      } catch {}
    }

    pedidosProdutosCache = [
      { codigo: 'TST001', nome: 'Caixa Organizadora Média', fator: 12, imagem: '' },
      { codigo: 'TST002', nome: 'Plástico Bolha Premium', fator: 10, imagem: '' },
      { codigo: 'TST003', nome: 'Etiqueta Logística', fator: 20, imagem: '' },
      { codigo: 'TST004', nome: 'Papel Kraft Bobina', fator: 15, imagem: '' },
      { codigo: 'TST005', nome: 'Fita Adesiva Transparente', fator: 6, imagem: '' }
    ];
  }

  function carregarPedidosSalvos() {
    try {
      pedidosSalvosMemoria = JSON.parse(localStorage.getItem(PEDIDOS_STORAGE_KEY) || '[]');
    } catch {
      pedidosSalvosMemoria = [];
    }
  }

  function persistirPedidosSalvos() {
    localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(pedidosSalvosMemoria));
  }

  function getPedidosRoot() {
    return document.getElementById('pedidos-root');
  }

  function criarPedidosLayout() {
    const root = getPedidosRoot();
    if (!root) return;
    if (document.getElementById('pedidosV2Base')) return;

    const bloco = document.createElement('div');
    bloco.id = 'pedidosV2Base';
    bloco.style.marginTop = '20px';

    bloco.innerHTML = `
      <div id="pedidosSubgridTopo" style="
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(320px,1fr));
        gap:16px;
        margin-bottom:16px;
      ">
        <div style="
          background:linear-gradient(180deg,#23344d,#1b2940);
          padding:20px;
          border-radius:18px;
        ">
          <h2 style="color:white;margin-bottom:20px;">Novo Pedido</h2>

          <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
            gap:12px;
          ">
            <input id="pedidoCliente" placeholder="Cliente" class="form-control">
            <input id="pedidoRepresentante" placeholder="Representante" class="form-control">
            <input id="pedidoData" type="date" class="form-control">
            <input id="pedidoNumero" placeholder="Nº Pedido" class="form-control">
          </div>

          <button id="btnAdicionarProdutoPedido" style="
            margin-top:15px;
            width:100%;
            background:#2563eb;
            color:#fff;
            border:none;
            padding:14px;
            border-radius:12px;
            font-weight:bold;
          ">
            + Adicionar Produto
          </button>
        </div>

        <div id="painelPedidosSalvos" style="
          background:#223754;
          padding:18px;
          border-radius:18px;
        ">
          <h3 style="margin:0 0 15px 0;color:#fff;">📋 Pedidos Salvos</h3>
          <div id="listaPedidosSalvos" style="
            display:flex;
            flex-direction:column;
            gap:12px;
          ">
            <p style="color:#cbd5e1;">Nenhum pedido salvo ainda.</p>
          </div>
        </div>
      </div>

      <div style="
        background:linear-gradient(180deg,#23344d,#1b2940);
        padding:20px;
        border-radius:18px;
      ">
        <h3 style="color:white;margin-bottom:15px;">Itens do Pedido</h3>
        <div id="listaItensPedido" style="color:#cbd5e1;">
          Nenhum item adicionado.
        </div>
      </div>
    `;

    root.innerHTML = '';
    root.appendChild(bloco);

    const dataInput = document.getElementById('pedidoData');
    if (dataInput && !dataInput.value) {
      const hoje = new Date();
      const yyyy = hoje.getFullYear();
      const mm = String(hoje.getMonth() + 1).padStart(2, '0');
      const dd = String(hoje.getDate()).padStart(2, '0');
      dataInput.value = `${yyyy}-${mm}-${dd}`;
    }
  }

  function criarModalAdicionarProduto() {
    if (document.getElementById('modalProdutoPedido')) return;

    const modal = document.createElement('div');
    modal.id = 'modalProdutoPedido';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.background = 'rgba(0,0,0,.75)';
    modal.style.zIndex = '99999';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '20px';

    modal.innerHTML = `
      <div style="
        width:100%;
        max-width:560px;
        background:#162742;
        border-radius:18px;
        padding:20px;
        box-shadow:0 0 30px rgba(0,0,0,.45);
        max-height:85vh;
        overflow:auto;
      ">
        <h3 style="color:#fff;margin:0 0 14px 0;">Adicionar Produto</h3>

        <input
          id="pesquisaProdutoPedido"
          type="text"
          placeholder="Pesquisar produto..."
          style="
            width:100%;
            padding:14px;
            border:none;
            border-radius:10px;
            margin-bottom:14px;
            background:#0b1730;
            color:#fff;
            outline:none;
          "
        >

        <div id="listaBuscaProdutosPedido" style="display:flex;flex-direction:column;gap:8px;"></div>

        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;">
          <button id="btnCancelarProdutoPedido" style="
            padding:12px 18px;
            border:none;
            border-radius:10px;
            background:#475569;
            color:#fff;
            font-weight:700;
            cursor:pointer;
          ">Cancelar</button>

          <button id="btnConfirmarProdutoPedido" style="
            padding:12px 18px;
            border:none;
            border-radius:10px;
            background:#2f6df6;
            color:#fff;
            font-weight:700;
            cursor:pointer;
          ">Adicionar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) fecharModalProdutoPedido();
    });

    document.getElementById('btnCancelarProdutoPedido').onclick = fecharModalProdutoPedido;
    document.getElementById('btnConfirmarProdutoPedido').onclick = confirmarSelecionadosPedido;
    document.getElementById('pesquisaProdutoPedido').addEventListener('input', function () {
      renderListaBuscaProdutos(this.value);
    });
  }

  function abrirModalProdutoPedido() {
    const modal = document.getElementById('modalProdutoPedido');
    if (!modal) return;
    pedidoProdutoSelecionado = null;
    modal.style.display = 'flex';
    const input = document.getElementById('pesquisaProdutoPedido');
    if (input) {
      input.value = '';
      input.focus();
    }
    renderListaBuscaProdutos('');
  }

  function fecharModalProdutoPedido() {
    const modal = document.getElementById('modalProdutoPedido');
    if (modal) modal.style.display = 'none';
  }

  function renderListaBuscaProdutos(busca) {
    const lista = document.getElementById('listaBuscaProdutosPedido');
    if (!lista) return;

    const termo = norm(busca);
    const filtrados = pedidosProdutosCache.filter(p => {
      const c = norm(getCodigo(p));
      const n = norm(getNome(p));
      return !termo || c.includes(termo) || n.includes(termo);
    });

    if (!filtrados.length) {
      lista.innerHTML = `<div style="color:#cbd5e1;padding:8px 2px;">Nenhum produto encontrado.</div>`;
      return;
    }

    lista.innerHTML = filtrados.map((p, i) => {
      const codigo = getCodigo(p);
      const nome = getNome(p);
      const fator = getFator(p);
      const img = getImagem(p);

      const thumb = img
        ? `<img src="${img}" style="width:52px;height:52px;object-fit:cover;border-radius:10px;">`
        : `<div style="width:52px;height:52px;border-radius:10px;background:#0b1730;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;">IMG</div>`;

      return `
        <div style="
          background:#0b1730;
          border-radius:12px;
          padding:12px;
          display:flex;
          flex-direction:column;
          gap:10px;
        ">
          <div style="
            display:grid;
            grid-template-columns:30px 52px 1fr;
            gap:10px;
            align-items:center;
          ">
            <input type="checkbox" class="pedidoSelectProduto" data-idx="${i}" style="width:20px;height:20px;">
            ${thumb}
            <div>
              <div style="color:#fff;font-weight:800;font-size:13px;">${codigo}</div>
              <div style="color:#dbe7ff;font-size:14px;">${nome}</div>
              <div style="color:#7fb0ff;font-size:12px;">Fator: ${fator}</div>
            </div>
          </div>

          <div style="display:flex;gap:10px;">
            <input
              type="number"
              min="1"
              value="1"
              class="pedidoQtdProduto"
              data-idx="${i}"
              style="
                flex:1;
                padding:10px;
                border:none;
                border-radius:8px;
                background:#162742;
                color:#fff;
              "
            >

            <select
              class="pedidoTipoProduto"
              data-idx="${i}"
              style="
                width:90px;
                padding:10px;
                border:none;
                border-radius:8px;
                background:#162742;
                color:#fff;
              "
            >
              <option value="cx">CX</option>
              <option value="und">UND</option>
            </select>
          </div>
        </div>
      `;
    }).join('');

    lista.innerHTML += `
      <button id="btnAdicionarSelecionadosPedido"
        style="
          width:100%;
          margin-top:15px;
          padding:14px;
          border:none;
          border-radius:10px;
          background:#2f6df6;
          color:#fff;
          font-weight:800;
          cursor:pointer;
        ">
        Adicionar Selecionados
      </button>
    `;

    document.getElementById('btnAdicionarSelecionadosPedido').onclick = confirmarSelecionadosPedido;
  }

  function garantirListaItensPedido() {
    const lista = document.getElementById('listaItensPedidoReal');
    if (lista) return lista;

    const container = document.getElementById('listaItensPedido');
    if (!container) return null;

    if (txt(container.innerText) === 'Nenhum item adicionado.') {
      container.innerHTML = '';
    }

    const novaLista = document.createElement('div');
    novaLista.id = 'listaItensPedidoReal';
    novaLista.style.display = 'flex';
    novaLista.style.flexDirection = 'column';
    novaLista.style.gap = '12px';
    container.appendChild(novaLista);

    return novaLista;
  }

  function garantirFooterPedido() {
    const lista = document.getElementById('listaItensPedidoReal');
    if (!lista) return null;

    let footer = document.getElementById('pedidoFooterAcoes');
    if (!footer) {
      footer = document.createElement('div');
      footer.id = 'pedidoFooterAcoes';
      footer.style.display = 'none';
      footer.style.marginTop = '14px';
      footer.innerHTML = `
        <button id="btnSalvarPedidoFinal" style="
          width:100%;
          padding:14px;
          border:none;
          border-radius:10px;
          background:#22c55e;
          color:#fff;
          font-weight:800;
          cursor:pointer;
        ">Salvar Pedido</button>
      `;
      lista.parentElement.appendChild(footer);

      footer.querySelector('#btnSalvarPedidoFinal').onclick = function () {
        abrirModalFinalizacaoPedido();
      };
    }

    return footer;
  }

  function criarCardItemPedido({ codigo, nome, totalUnd, caixas, avulsas, fator, imagem }) {
    const item = document.createElement('div');
    item.className = 'pedido-item-card-real';
    item.dataset.codigo = codigo || '';
    item.dataset.nome = nome || '';
    item.dataset.totalUnd = String(totalUnd || 0);
    item.dataset.caixas = String(caixas || 0);
    item.dataset.avulsas = String(avulsas || 0);
    item.dataset.fator = String(fator || 1);
    item.dataset.imagem = imagem || '';

    item.style.display = 'grid';
    item.style.gridTemplateColumns = '56px 1fr 40px';
    item.style.gap = '10px';
    item.style.alignItems = 'center';
    item.style.background = '#162742';
    item.style.padding = '10px';
    item.style.borderRadius = '12px';

    const thumb = imagem
      ? `<img src="${imagem}" style="width:56px;height:56px;object-fit:cover;border-radius:10px;">`
      : `<div style="width:56px;height:56px;border-radius:10px;background:#2f6df6;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;">IMG</div>`;

    item.innerHTML = `
      ${thumb}
      <div style="display:flex;flex-direction:column;gap:4px;color:#fff;">
        <div class="pedido-card-codigo" style="font-weight:800;">${codigo}</div>
        <div class="pedido-card-nome" style="color:#dbe7ff;">${nome}</div>
        <div class="pedido-card-resumo" style="color:#7fb0ff;font-size:12px;">
          <span class="pedido-qtd">${caixas} CX</span> | <span class="pedido-und">${totalUnd} UND</span>
        </div>
        <div class="pedido-card-detalhe" style="color:#7fb0ff;font-size:12px;">
          Fator: <span class="pedido-fator">${fator}</span> | Avulsas: <span class="pedido-avulsas">${avulsas}</span>
        </div>
      </div>
      <div style="
        display:flex;
        flex-direction:row;
        gap:8px;
        align-items:center;
        justify-content:flex-end;
        flex-wrap:wrap;
      ">
        <button onclick="
          const card=this.closest('.pedido-item-card-real');
          const atual=Number(card.dataset.caixas||0);
          const novo=prompt('Nova quantidade em caixas:', String(atual));
          if(novo!==null && novo!=='' && !isNaN(Number(novo))){
            const caixasNovo=Math.max(0, Number(novo));
            const fator=Number(card.dataset.fator||1)||1;
            const totalNovo=caixasNovo*fator;
            const avulsasNovo=0;
            card.dataset.caixas=String(caixasNovo);
            card.dataset.totalUnd=String(totalNovo);
            card.dataset.avulsas=String(avulsasNovo);
            const qtdEl=card.querySelector('.pedido-qtd');
            const undEl=card.querySelector('.pedido-und');
            const avEl=card.querySelector('.pedido-avulsas');
            if(qtdEl) qtdEl.innerText=caixasNovo+' CX';
            if(undEl) undEl.innerText=totalNovo+' UND';
            if(avEl) avEl.innerText=String(avulsasNovo);
          }
        "
        style="
          border:none;
          background:#2f6df6;
          color:#fff;
          padding:8px 12px;
          border-radius:8px;
          cursor:pointer;
          font-size:12px;
          font-weight:700;
          min-width:84px;
        ">✏️ Editar</button>

        <button onclick="
          this.closest('.pedido-item-card-real').remove();
          const lista=document.getElementById('listaItensPedidoReal');
          const footer=document.getElementById('pedidoFooterAcoes');
          if(lista && footer && !lista.querySelector('.pedido-item-card-real')){
            footer.style.display='none';
            lista.innerHTML='';
            const vazio=document.createElement('p');
            vazio.style.color='#cbd5e1';
            vazio.innerText='Nenhum item adicionado.';
            lista.appendChild(vazio);
          }
        "
        style="
          border:none;
          background:#ef4444;
          color:#fff;
          padding:8px 12px;
          border-radius:8px;
          cursor:pointer;
          font-size:12px;
          font-weight:700;
          min-width:84px;
        ">🗑 Excluir</button>
      </div>
    `;

    return item;
  }

  function confirmarSelecionadosPedido() {
    const checks = document.querySelectorAll('.pedidoSelectProduto:checked');
    if (!checks.length) {
      alert('Selecione ao menos um produto.');
      return;
    }

    const lista = garantirListaItensPedido();
    if (!lista) return;

    checks.forEach(check => {
      const idx = Number(check.dataset.idx);
      const produto = pedidosProdutosCache[idx];
      if (!produto) return;

      const qtd = Number(document.querySelector('.pedidoQtdProduto[data-idx="' + idx + '"]')?.value || 1);
      const tipo = document.querySelector('.pedidoTipoProduto[data-idx="' + idx + '"]')?.value || 'cx';

      const codigo = getCodigo(produto);
      const nome = getNome(produto);
      const fator = getFator(produto);
      const imagem = getImagem(produto);

      const totalUnd = tipo === 'cx' ? qtd * fator : qtd;
      const caixas = Math.floor(totalUnd / fator);
      const avulsas = totalUnd % fator;

      lista.appendChild(criarCardItemPedido({
        codigo, nome, totalUnd, caixas, avulsas, fator, imagem
      }));
    });

    const footer = garantirFooterPedido();
    if (footer) footer.style.display = 'block';

    fecharModalProdutoPedido();
  }

  function coletarItensPedidoAtual() {
    const itens = [];
    document.querySelectorAll('.pedido-item-card-real').forEach(card => {
      const codigo = card.dataset.codigo || '';
      const nome = card.dataset.nome || '';
      const totalUnd = Number(card.dataset.totalUnd || 0);
      const caixas = Number(card.dataset.caixas || 0);
      const avulsas = Number(card.dataset.avulsas || 0);
      const fator = Number(card.dataset.fator || 1);
      const imagem = card.dataset.imagem || '';

      itens.push({
        codigo,
        nome,
        totalUnd,
        caixas,
        avulsas,
        fator,
        imagem,
        resumo: `${caixas} CX | ${totalUnd} UND`,
        detalhe: `Fator: ${fator} | Avulsas: ${avulsas}`
      });
    });
    return itens;
  }

  function renderPedidosSalvos() {
    const lista = document.getElementById('listaPedidosSalvos');
    if (!lista) return;

    lista.innerHTML = '';

    if (!pedidosSalvosMemoria.length) {
      lista.innerHTML = '<p style="color:#cbd5e1;">Nenhum pedido salvo ainda.</p>';
      return;
    }

    pedidosSalvosMemoria.forEach((pedido, index) => {
      const item = document.createElement('div');

      item.style.background = '#162742';
      item.style.padding = '14px';
      item.style.borderRadius = '12px';
      item.style.display = 'flex';
      item.style.flexDirection = 'column';
      item.style.gap = '8px';

      item.innerHTML = `
        <div style="color:#fff;font-weight:700;">${pedido.id}</div>
        <div style="color:#dbe7ff;font-size:13px;">${pedido.cliente || 'Sem cliente'}${pedido.numero ? ' • Nº ' + pedido.numero : ''}</div>
        <div style="color:#facc15;font-size:13px;">🟡 ${pedido.status}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button onclick="window.visualizarPedidoModal(${index})" style="
            flex:1;border:none;background:#2f6df6;color:#fff;
            padding:10px;border-radius:8px;font-weight:700;
          ">Abrir</button>

          <button onclick="window.editarPedidoDireto(${index})" style="
            flex:1;border:none;background:#f59e0b;color:#fff;
            padding:10px;border-radius:8px;font-weight:700;
          ">Editar</button>

          <button onclick="window.cancelarPedidoSalvo(${index})" style="
            flex:1;border:none;background:#ef4444;color:#fff;
            padding:10px;border-radius:8px;font-weight:700;
          ">Cancelar</button>
        </div>
      `;

      lista.appendChild(item);
    });
  }

  function adicionarPedidoNaLista() {
    const cliente = document.getElementById('pedidoCliente')?.value || '';
    const representante = document.getElementById('pedidoRepresentante')?.value || '';
    const numero = document.getElementById('pedidoNumero')?.value || '';
    const data = document.getElementById('pedidoData')?.value || '';
    const itens = coletarItensPedidoAtual();

    if (!itens.length) return;

    const pedido = {
      id: (window.editandoPedidoIndex !== null && pedidosSalvosMemoria[window.editandoPedidoIndex])
        ? (pedidosSalvosMemoria[window.editandoPedidoIndex].id || ('PED-' + Date.now()))
        : ('PED-' + Date.now()),
      cliente,
      representante,
      numero,
      data,
      status: 'Aguardando Separação',
      itens
    };

    if (window.editandoPedidoIndex !== null && pedidosSalvosMemoria[window.editandoPedidoIndex]) {
      pedidosSalvosMemoria[window.editandoPedidoIndex] = pedido;
      window.editandoPedidoIndex = null;

    const btn =
      document.getElementById('btnSalvarPedidoFinal') ||
      document.getElementById('btnSalvarPedido');

    if(btn){
      btn.innerText = 'Salvar Pedido';
    }
    } else {
      pedidosSalvosMemoria.unshift(pedido);
    }

    persistirPedidoSalvos?.();
    persistirPedidosSalvos?.();
    renderPedidosSalvos();

    if (typeof limparFormularioPedido === 'function') {
      limparFormularioPedido();
    }
  }


function abrirPedidoSalvo(index) {
  const pedido = pedidosSalvosMemoria[index];
  if (!pedido) return;

  window.editandoPedidoIndex = index;

  document.getElementById('pedidoCliente').value = pedido.cliente || '';
  document.getElementById('pedidoRepresentante').value = pedido.representante || '';
  document.getElementById('pedidoNumero').value = pedido.numero || '';
  document.getElementById('pedidoData').value = pedido.data || '';

  const listaItens = document.getElementById('pedidoItensLista');
  if(listaItens){
    listaItens.innerHTML = '';

    (pedido.itens || []).forEach(item=>{
      const div = document.createElement('div');
      div.className = 'pedido-item-card';
      div.style.marginBottom = '10px';
      div.style.padding = '12px';
      div.style.background = '#162742';
      div.style.borderRadius = '10px';

      div.innerHTML = `
        <div style="font-weight:700;color:#fff;">${item.codigo || ''}</div>
        <div style="color:#cbd5e1;">${item.nome || ''}</div>
        <div style="color:#93c5fd;">${item.caixas || 0} CX | ${item.unidades || 0} UND</div>
      `;

      listaItens.appendChild(div);
    });
  }

  const btn =
    document.getElementById('btnSalvarPedidoFinal') ||
    document.getElementById('btnSalvarPedido');

  if(btn){
    btn.innerText = 'Salvar Alterações';
  }

  window.scrollTo({
    top:0,
    behavior:'smooth'
  });
}
)();


window.destroyPedidosUI = function () {
  try { document.getElementById('pedidosV2Base')?.remove(); } catch(e) {}
  try { document.getElementById('modalProdutoPedido')?.remove(); } catch(e) {}
  try { document.getElementById('modalFinalizarPedido')?.remove(); } catch(e) {}

  try {
    document.querySelectorAll('.pedido-item-card-real').forEach(el => el.remove());
  } catch(e) {}
};



window.visualizarPedidoModal=function(index){

const pedido=JSON.parse(localStorage.getItem('pedidosSalvosMemoria')||'[]')[index];
if(!pedido)return;

let modal=document.getElementById("modalPedidoVisualizacao");

if(!modal){
modal=document.createElement("div");
modal.id="modalPedidoVisualizacao";

modal.style.cssText=`
position:fixed;
inset:0;
background:rgba(0,0,0,.75);
display:flex;
align-items:center;
justify-content:center;
z-index:999999;
padding:20px;
`;

document.body.appendChild(modal);
}

modal.innerHTML=`
<div style="
background:#13233d;
padding:25px;
border-radius:15px;
width:90%;
max-width:650px;
max-height:80vh;
overflow:auto;
box-shadow:0 0 30px rgba(0,0,0,.45);
">

<h2 style="color:#fff;margin-bottom:20px;">
Pedido ${pedido.id}
</h2>

<div id="modalItensPedido"></div>

<div style="
display:flex;
gap:10px;
margin-top:20px;
">

<button onclick="
document.getElementById('modalPedidoVisualizacao').remove()
"
style="
flex:1;
padding:12px;
border:none;
border-radius:10px;
background:#475569;
color:#fff;
font-weight:700;
">
Fechar
</button>

</div>

</div>
`;

const container=document.getElementById("modalItensPedido");

pedido.itens.forEach(item=>{

container.innerHTML+=`
<div style="
background:#0d1a2f;
padding:12px;
margin-bottom:10px;
border-radius:10px;
color:#fff;
">
<div><b>${item.codigo}</b></div>
<div>${item.nome}</div>
<div style="font-size:12px;color:#7fb0ff;">
${item.resumo||''}
</div>
</div>
`;

});

}







window.editarPedidoDoModal=function(index){
  try{
    if(typeof window.editarPedidoDireto==='function'){
      window.editarPedidoDireto(index);
    }
  }catch(e){
    console.error(e);
  }
};





window.editarPedidoDireto = function(index){
  try{
    window.editandoPedidoIndex = index;

    if(typeof abrirPedidoSalvo === 'function'){
      abrirPedidoSalvo(index);
    }

    const btn =
      document.getElementById('btnSalvarPedidoFinal') ||
      document.getElementById('btnSalvarPedido') ||
      document.querySelector('#pedidoFooterAcoes button') ||
      document.querySelector('button[onclick*="salvarPedido"]');

    if(btn){
      btn.innerText = 'Salvar Alterações';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if(typeof renderPedidosSalvos === 'function'){
      renderPedidosSalvos();
    }

  }catch(e){
    console.error('ERRO AO EDITAR PEDIDO:', e);
  }
};

window.editarPedido = window.editarPedidoDireto;
