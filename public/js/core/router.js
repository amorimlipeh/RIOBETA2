const workspace = document.getElementById('workspace');
const buttons = document.querySelectorAll('.menu-item');

let produtos = [];
let produtoEditandoId = null;
let estoque = [];
let movimentacoes = [];
let movimentacaoEditandoId = null;

async function carregarProdutos() {
  try {
    const response = await fetch('/api/produtos');
    const data = await response.json();
    produtos = (Array.isArray(data) ? data : []).map((produto, index) => ({
      ...produto,
      id: produto.id || `legacy-${produto.codigo || index}`
    }));
  } catch {
    produtos = [];
  }
}

async function carregarEstoque() {
  try {
    const response = await fetch('/api/estoque');
    estoque = await response.json();
  } catch {
    estoque = [];
  }
}

async function carregarMovimentacoes() {
  try {
    const response = await fetch('/api/estoque/movimentacoes');
    movimentacoes = await response.json();
  } catch {
    movimentacoes = [];
  }
}

function gerarSKU() {
  return 'SKU-' + Math.floor(Math.random() * 999999);
}

function getEnderecoStatus(qtd, endereco = '') {
  const n = Number(qtd || 0);
  const e = String(endereco || '').trim().toUpperCase();

  if (e === 'SEM_ENDERECO') {
    return { classe: 'status-baixo', texto: 'Sem endereçamento' };
  }

  if (n <= 0) return { classe: 'status-zero', texto: 'Zerado' };
  if (n <= 10) return { classe: 'status-baixo', texto: 'Baixo' };
  return { classe: 'status-ok', texto: 'Normal' };
}

function getTipoBadge(tipo) {
  if (tipo === 'entrada') return { classe: 'tipo-entrada', texto: 'Entrada' };
  if (tipo === 'saida') return { classe: 'tipo-saida', texto: 'Saída' };
  if (tipo === 'transferencia') return { classe: 'tipo-transferencia', texto: 'Transferência' };
  return { classe: 'tipo-ajuste', texto: 'Ajustado' };
}

function formatarDataHora(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('pt-BR');
  } catch {
    return iso;
  }
}

function showModal(message, type = 'success') {
  const existente = document.getElementById('systemModal');
  if (existente) existente.remove();

  const modal = document.createElement('div');
  modal.id = 'systemModal';
  modal.className = 'system-modal-backdrop';
  modal.innerHTML = `
    <div class="system-modal-card ${type}">
      <div class="system-modal-title">${type === 'error' ? 'Atenção' : 'Sucesso'}</div>
      <div class="system-modal-message">${message}</div>
      <button class="system-modal-btn" id="systemModalBtn">OK</button>
    </div>
  `;

  document.body.appendChild(modal);

  const btn = document.getElementById('systemModalBtn');
  const close = () => modal.remove();

  btn?.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
}

function showConfirmModal(message) {
  return new Promise((resolve) => {
    const existente = document.getElementById('confirmModal');
    if (existente) existente.remove();

    const modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.className = 'system-modal-backdrop';
    modal.innerHTML = `
      <div class="system-modal-card warning">
        <div class="system-modal-title">Confirmar ação</div>
        <div class="system-modal-message">${message}</div>
        <div class="system-modal-actions">
          <button class="system-modal-btn btn-secondary" id="confirmNo">Voltar</button>
          <button class="system-modal-btn" id="confirmYes">Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const close = (result) => {
      modal.remove();
      resolve(result);
    };

    document.getElementById('confirmNo')?.addEventListener('click', () => close(false));
    document.getElementById('confirmYes')?.addEventListener('click', () => close(true));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close(false);
    });
  });
}

function setButtonLoading(button, textLoading) {
  if (!button) return () => {};
  const original = button.innerHTML;
  button.disabled = true;
  button.dataset.originalHtml = original;
  button.innerHTML = textLoading;
  return () => {
    button.disabled = false;
    button.innerHTML = button.dataset.originalHtml || original;
  };
}

function produtoOptionLabel(produto) {
  return `${produto.codigo || ''} - ${produto.nome || ''}`;
}

function produtosDatalist() {
  return `
    <datalist id="produtosLista">
      ${produtos.map(p => `<option value="${produtoOptionLabel(p)}"></option>`).join('')}
    </datalist>
  `;
}

function encontrarProdutoPorBusca(valor) {
  const termo = String(valor || '').trim().toLowerCase();
  if (!termo) return null;

  return produtos.find(produto => {
    const codigo = String(produto.codigo || '').toLowerCase();
    const nome = String(produto.nome || '').toLowerCase();
    const sku = String(produto.sku || '').toLowerCase();
    const label = produtoOptionLabel(produto).toLowerCase();

    return (
      codigo === termo ||
      label === termo ||
      codigo.includes(termo) ||
      nome.includes(termo) ||
      sku.includes(termo)
    );
  }) || null;
}

function normalizarBuscaProdutoInput(inputId, onResolved) {
  const el = document.getElementById(inputId);
  if (!el) return;

  const aplicar = () => {
    const valor = String(el.value || '').trim();
    if (!valor) {
      if (typeof onResolved === 'function') onResolved(null);
      return;
    }

    const produto = encontrarProdutoPorBusca(valor);
    if (produto) {
      el.value = produtoOptionLabel(produto);
      if (typeof onResolved === 'function') onResolved(produto);
    } else {
      el.value = '';
      if (typeof onResolved === 'function') onResolved(null);
    }
  };

  if (el.dataset.autocompleteBind === '1') return;
  el.dataset.autocompleteBind = '1';

  el.setAttribute('autocomplete', 'off');
  el.addEventListener('change', aplicar);
  el.addEventListener('blur', aplicar);
  el.addEventListener('input', () => setTimeout(aplicar, 250));
}

function encontrarEnderecoOrigemDoProduto(produto) {
  if (!produto) return '';

  const itemEstoque = (estoque || []).find(item => {
    const matchId = String(item.produtoId || '') === String(produto.id || '');
    const matchNome = String(item.produto || '').toLowerCase() === String(produto.nome || '').toLowerCase();
    const matchCodigo = String(item.codigo || '').toLowerCase() === String(produto.codigo || '').toLowerCase();
    const qtd = Number(item.quantidade || 0) > 0;
    return qtd && (matchId || matchNome || matchCodigo);
  });

  return itemEstoque?.endereco || '';
}

function dashboardView() {
  const totalEstoque = produtos.reduce((a, b) => a + Number(b.estoqueTotal || 0), 0);

  return `
    <div class="hero-card fade-in">
      <h1>Dashboard Executivo</h1>
      <p>Centro de comando operacional do sistema logístico</p>
    </div>

    <div class="grid-cards fade-in">
      <div class="stat-card">
        <h3>📦 Total Produtos</h3>
        <p>${produtos.length}</p>
      </div>
      <div class="stat-card">
        <h3>🧾 Pedidos Pendentes</h3>
        <p>89</p>
      </div>
      <div class="stat-card">
        <h3>📊 Estoque Total</h3>
        <p>${totalEstoque}</p>
      </div>
      <div class="stat-card">
        <h3>🗺️ Performance WMS</h3>
        <p>97%</p>
      </div>
    </div>

    <div class="dashboard-row fade-in">
      <div class="big-card">
        <h3>📈 Performance Operacional</h3>
        <div style="margin-top:20px;display:flex;flex-direction:column;gap:18px;">
          <div>
            <span>Separação</span>
            <div style="background:#1e293b;height:12px;border-radius:20px;margin-top:5px;">
              <div style="width:92%;height:100%;background:#22c55e;border-radius:20px;"></div>
            </div>
          </div>
          <div>
            <span>Armazenagem</span>
            <div style="background:#1e293b;height:12px;border-radius:20px;margin-top:5px;">
              <div style="width:84%;height:100%;background:#3b82f6;border-radius:20px;"></div>
            </div>
          </div>
          <div>
            <span>Conferência</span>
            <div style="background:#1e293b;height:12px;border-radius:20px;margin-top:5px;">
              <div style="width:76%;height:100%;background:#f59e0b;border-radius:20px;"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="big-card">
        <h3>⚡ Atalhos Rápidos</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px;">
          <button class="quick-btn">Novo Pedido</button>
          <button class="quick-btn">Novo Produto</button>
          <button class="quick-btn">Mov. Estoque</button>
          <button class="quick-btn">Scanner</button>
        </div>
      </div>
    </div>

    <div class="big-card fade-in">
      <h3>🕒 Últimas Atividades</h3>
      <div style="margin-top:20px;display:flex;flex-direction:column;gap:12px;">
        <div class="activity-item">📦 Produto adicionado ao estoque</div>
        <div class="activity-item">🧾 Novo pedido criado</div>
        <div class="activity-item">🚚 Transferência entre endereços</div>
        <div class="activity-item">📍 Atualização WMS realizada</div>
      </div>
    </div>
  `;
}

function produtosView() {
  const quantidadeTotal = produtos.reduce((acc, item) => acc + Number(item.quantidade || 0), 0);

  return `
    <div class="hero-card fade-in">
      <h1>Produtos Enterprise</h1>
      <p>Gestão avançada de produtos e estoque.</p>
    </div>

    <div class="grid-cards fade-in">
      <div class="stat-card">
        <h3>Total Produtos</h3>
        <p>${produtos.length}</p>
      </div>
      <div class="stat-card">
        <h3>Quantidade Total</h3>
        <p>${quantidadeTotal}</p>
      </div>
    </div>

    <div class="produto-form-card fade-in" style="margin-bottom:20px;">
      <h3>${produtoEditandoId ? 'Editar Produto' : 'Novo Produto'}</h3>

      <input id="codigo" placeholder="Código">
      <input id="nome" placeholder="Nome">
      <input id="categoria" placeholder="Categoria">
      <input id="quantidade" type="number" placeholder="Quantidade Inicial">
      <input id="fator" type="number" placeholder="Fator">
      <input id="sku" placeholder="SKU (Opcional)">
      <input id="imagem" placeholder="URL da Imagem">

      <button id="btnSalvarProduto" onclick="salvarProduto()">
        ${produtoEditandoId ? 'Salvar Alterações' : 'Salvar Produto'}
      </button>

      ${produtoEditandoId ? `<button onclick="cancelarEdicao()" style="background:#475569">Cancelar</button>` : ''}
    </div>

    <div class="produto-table-card fade-in">
      <h3>Lista de Produtos</h3>
      <input id="pesquisaProduto" onkeyup="filtrarProdutos()" placeholder="Pesquisar produto">

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Qtd</th>
            <th>SKU</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="produtosTabela"></tbody>
      </table>
    </div>
  `;
}

function estoqueView() {
  const totalGeral = produtos.reduce((acc, item) => acc + Number(item.estoqueTotal || 0), 0);
  const estoqueBaixo = produtos.filter(p => Number(p.estoqueTotal || 0) > 0 && Number(p.estoqueTotal || 0) <= 10).length;

  return `
    <div class="hero-card fade-in">
      <h1>Estoque Enterprise</h1>
      <p>Controle híbrido com visão consolidada e movimentação por endereço.</p>
    </div>

    ${produtosDatalist()}

    <div class="grid-cards fade-in">
      <div class="stat-card">
        <h3>Estoque Total</h3>
        <p>${totalGeral}</p>
      </div>
      <div class="stat-card">
        <h3>Endereços Ativos</h3>
        <p>${estoque.length}</p>
      </div>
      <div class="stat-card">
        <h3>Estoque Baixo</h3>
        <p>${estoqueBaixo}</p>
      </div>
      <div class="stat-card">
        <h3>Movimentações</h3>
        <p>${movimentacoes.length}</p>
      </div>
    </div>

    <div class="produto-layout fade-in">
      <div class="produto-form-card">
        <h3>${movimentacaoEditandoId ? 'Editar Movimentação' : 'Nova Movimentação'}</h3>

        <input id="movProdutoBusca" list="produtosLista" placeholder="Digite código ou nome do produto">
        <select id="movTipo">
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
          <option value="ajuste">Ajuste</option>
        </select>

        <input id="movEndereco" placeholder="Endereço WMS (ex: 01-010-1-1)">
        <input id="movQuantidade" type="number" placeholder="Quantidade">

        <button id="btnSalvarMovimentacao" onclick="${movimentacaoEditandoId ? 'salvarEdicaoMovimentacao()' : 'movimentarEstoque()'}">
          ${movimentacaoEditandoId ? 'Salvar Edição' : 'Salvar Movimentação'}
        </button>
        ${movimentacaoEditandoId ? `<button onclick="cancelarEdicaoMovimentacao()" style="background:#475569">Cancelar Edição</button>` : ''}
      </div>

      <div class="produto-form-card">
        <h3>Transferência entre Endereços</h3>

        <input id="transfProdutoBusca" list="produtosLista" placeholder="Digite código ou nome do produto">
        <input id="transfOrigem" placeholder="Endereço de origem">
        <input id="transfDestino" placeholder="Endereço de destino">
        <input id="transfQuantidade" type="number" placeholder="Quantidade">

        <button id="btnTransferir" onclick="transferirEstoque()">Transferir</button></div>
      </div>
    </div>

    <div class="produto-table-card fade-in">
      <h3>Saldo Consolidado por Produto</h3>
      <input id="pesquisaSaldoEstoque" placeholder="Buscar código ou produto..." oninput="filtrarSaldoEstoque()" style="margin-bottom:18px;">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Produto</th>
            <th>Total</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody id="estoqueTabela"></tbody>
      </table>
    </div>

    <div class="dashboard-row fade-in">
      <div class="big-card">
        <h3>Estoque por Endereço</h3>
        <input
          id="filtro-estoque-endereco"
          placeholder="Buscar por código, SKU, nome, categoria ou endereço..."
          style="margin-bottom:14px;"
        >
        <div class="table-scroll">
          <table class="table-wide">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Endereço</th>
                <th>Qtd</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="enderecosTabela"></tbody>
          </table>
        </div>
      </div>

      <div class="big-card">
        <h3>Últimas Movimentações</h3>
        <div class="table-scroll">
          <table class="table-wide mov-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Produto</th>
                <th>Endereço</th>
                <th>Qtd</th>
                <th>Data/Hora</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="movTabela"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function separacaoView() {
  return `<div id="separacao-root"></div>`;
}

const views = {
  dashboard: () => dashboardView(),
  produtos: () => produtosView(),
  estoque: () => estoqueView(),
  pedidos: () => `<div id="pedidos-root"></div>`,
  separacao: () => separacaoView(),
  scanner: () => `<div class="hero-card"><h1>Módulo Scanner</h1></div>`,
  wms: () => `<div class="hero-card"><h1>Módulo WMS</h1></div>`
};

function renderTabela(lista = produtos) {
  const tabela = document.getElementById('produtosTabela');
  if (!tabela) return;

  tabela.innerHTML = '';

  lista.forEach((produto) => {
    tabela.innerHTML += `
      <tr>
        <td>${produto.nome || '-'}</td>
        <td>${produto.categoria || '-'}</td>
        <td>${produto.quantidade || 0}</td>
        <td>${produto.sku || '-'}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn-action btn-edit" onclick="editarProduto('${produto.id}')">Editar</button>
          <button class="btn-action btn-delete" onclick="removerProduto('${produto.id}')">Excluir</button>
        </td>
      </tr>
    `;
  });
}

function renderTabelaEstoque(lista = produtos) {
  const tabela = document.getElementById('estoqueTabela');
  if (!tabela) return;

  tabela.innerHTML = '';

  lista.forEach(produto => {
    tabela.innerHTML += `
      <tr>
        <td>${produto.codigo || '-'}</td>
        <td>${produto.nome || '-'}</td>
        <td>${produto.estoqueTotal || 0}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn-action btn-delete" onclick="excluirProdutoComEstoque('${produto.id}')">Excluir</button>
        </td>
      </tr>
    `;
  });
}

window.filtrarSaldoEstoque = function () {
  const termo = (document.getElementById('pesquisaSaldoEstoque')?.value || '').toLowerCase();

  const filtrados = produtos.filter(produto =>
    String(produto.codigo || '').toLowerCase().includes(termo) ||
    String(produto.nome || '').toLowerCase().includes(termo)
  );

  renderTabelaEstoque(filtrados);
};


function renderTabelaEnderecos() {
  const tabela = document.getElementById('enderecosTabela');
  if (!tabela) return;

  const filtro = String(document.getElementById('filtro-estoque-endereco')?.value || '')
    .trim()
    .toLowerCase();

  tabela.innerHTML = '';

  let lista = Array.isArray(estoque) ? [...estoque] : [];

  lista = lista.map(item => {
    const produto = produtos.find(p =>
      String(p.id) === String(item.produtoId) ||
      String(p.codigo || '').toLowerCase() === String(item.codigo || '').toLowerCase() ||
      String(p.nome || '').toLowerCase() === String(item.produto || '').toLowerCase()
    );

    return {
      ...item,
      produtoNome: produto ? produto.nome : (item.produto || item.produtoId || '-'),
      codigo: produto?.codigo || item.codigo || '',
      sku: produto?.sku || '',
      categoria: produto?.categoria || ''
    };
  });

  if (filtro) {
    lista = lista.filter(item => {
      const alvo = [
        item.produtoNome,
        item.codigo,
        item.sku,
        item.categoria,
        item.endereco
      ].map(v => String(v || '').toLowerCase()).join(' | ');

      return alvo.includes(filtro);
    });
  }

  if (!lista.length) {
    tabela.innerHTML = `
      <tr>
        <td colspan="4">Sem dados</td>
      </tr>
    `;
    return;
  }

  lista.forEach(item => {
    const status = getEnderecoStatus(item.quantidade);

    tabela.innerHTML += `
      <tr>
        <td>${item.produtoNome}</td>
        <td>${item.endereco || '-'}</td>
        <td>${item.quantidade || 0}</td>
        <td><span class="badge ${status.classe}">${status.texto}</span></td>
      </tr>
    `;
  });
}


function renderTabelaMovimentacoes() {
  const tabela = document.getElementById('movTabela');
  if (!tabela) return;

  tabela.innerHTML = '';

  movimentacoes.slice(0, 10).forEach(item => {
    const produto = produtos.find(p => String(p.id) === String(item.produtoId));
    const status = item.status || 'ativo';
    const tipoBadge = getTipoBadge(item.tipo);

    tabela.innerHTML += `
      <tr class="${status === 'cancelado' ? 'cancelado' : ''}">
        <td><span class="badge ${tipoBadge.classe}">${tipoBadge.texto}</span></td>
        <td>${produto ? produto.nome : item.produtoId}</td>
        <td>${item.tipo === 'transferencia' ? `${item.origem} → ${item.destino}` : (item.endereco || '-')}</td>
        <td>${item.quantidade}</td>
        <td>${formatarDataHora(item.data)}</td>
        <td><span class="badge ${status === 'ativo' ? 'status-ok' : 'status-zero'}">${status}</span></td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
          ${status === 'ativo' ? `<button class="btn-action btn-edit" onclick="abrirModalEscolhaEdicao('${item.id}', 'mov')">Editar</button>` : '-'}
          ${status === 'ativo' ? `<button class="btn-action btn-cancel" onclick="cancelarMovimentacao('${item.id}')">Cancelar</button>` : ''}
        </td>
      </tr>
    `;
  });
}

function preencherFormulario(produto) {
  const campos = {
    codigo: produto.codigo || '',
    nome: produto.nome || '',
    categoria: produto.categoria || '',
    quantidade: produto.quantidade || '',
    fator: produto.fator || '',
    sku: produto.sku || '',
    imagem: produto.imagem || ''
  };

  Object.entries(campos).forEach(([id, valor]) => {
    const el = document.getElementById(id);
    if (el) el.value = valor;
  });
}

window.filtrarProdutos = function () {
  const termo = (document.getElementById('pesquisaProduto')?.value || '').toLowerCase();

  const filtrados = produtos.filter(produto =>
    String(produto.nome || '').toLowerCase().includes(termo) ||
    String(produto.categoria || '').toLowerCase().includes(termo) ||
    String(produto.sku || '').toLowerCase().includes(termo)
  );

  renderTabela(filtrados);
};

window.salvarProduto = async function () {
  const btn = document.getElementById('btnSalvarProduto');
  const resetBtn = setButtonLoading(btn, 'Salvando...');

  try {
    const codigoEl = document.getElementById('codigo');
    const skuEl = document.getElementById('sku');

    const payload = {
      codigo: codigoEl.value,
      nome: document.getElementById('nome').value,
      categoria: document.getElementById('categoria').value,
      quantidade: Number(document.getElementById('quantidade').value),
      fator: Number(document.getElementById('fator').value),
      sku: skuEl.value || gerarSKU(),
      imagem: document.getElementById('imagem').value
    };

    if (!payload.codigo || !payload.nome) {
      showModal('Código e nome são obrigatórios.', 'error');
      return;
    }

    let produtoSalvo = null;

    if (produtoEditandoId) {
      const response = await fetch('/api/produtos/' + produtoEditandoId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      try {
        produtoSalvo = await response.json();
      } catch {
        produtoSalvo = null;
      }

      produtoEditandoId = null;
    } else {
      const response = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      try {
        produtoSalvo = await response.json();
      } catch {
        produtoSalvo = null;
      }

      const quantidadeInicial = Number(payload.quantidade || 0);

      if (quantidadeInicial > 0) {
        const produtoIdCriado = produtoSalvo?.id || produtoSalvo?._id || payload.id || null;

        if (produtoIdCriado) {
          await fetch('/api/estoque/movimentar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              produtoId: produtoIdCriado,
              tipo: 'entrada',
              endereco: 'SEM_ENDERECO',
              quantidade: quantidadeInicial
            })
          });
        }
      }
    }

    await carregarProdutos();
    await carregarEstoque();
    await renderView('produtos', { skipLoad: true });
    showModal('Produto salvo com sucesso.', 'success');
  } finally {
    resetBtn();
  }
};

window.editarProduto = async function (id) {
  const produto = produtos.find(p => String(p.id) === String(id));
  if (!produto) return;

  produtoEditandoId = id;
  await renderView('produtos', { skipLoad: true });
  renderTabela();
  preencherFormulario(produto);
  bindProdutoFormBehavior();
};

window.cancelarEdicao = async function () {
  produtoEditandoId = null;
  await renderView('produtos', { skipLoad: true });
};

window.removerProduto = async function (id) {
  const confirmar = await showConfirmModal('Tem certeza que deseja excluir este produto?');
  if (!confirmar) return;

  await fetch('/api/produtos/' + id, { method: 'DELETE' });
  await carregarProdutos();
  await renderView('produtos', { skipLoad: true });
  showModal('Produto excluído com sucesso.', 'success');
};

function preencherMovimentacao(produto, dados = {}) {
  const busca = document.getElementById('movProdutoBusca');
  const tipo = document.getElementById('movTipo');
  const endereco = document.getElementById('movEndereco');
  const quantidade = document.getElementById('movQuantidade');

  if (busca && produto) busca.value = produtoOptionLabel(produto);
  if (tipo) tipo.value = dados.tipo || 'ajuste';
  if (endereco) endereco.value = dados.endereco || '';
  if (quantidade) quantidade.value = (dados.quantidade ?? '');
}

function preencherTransferencia(produto, dados = {}) {
  const busca = document.getElementById('transfProdutoBusca');
  const origem = document.getElementById('transfOrigem');
  const destino = document.getElementById('transfDestino');
  const quantidade = document.getElementById('transfQuantidade');

  if (busca && produto) busca.value = produtoOptionLabel(produto);
  if (origem) origem.value = dados.origem || '';
  if (destino) destino.value = dados.destino || '';
  if (quantidade) quantidade.value = dados.quantidade || '';
}

window.movimentarEstoque = async function () {
  const btn = document.getElementById('btnSalvarMovimentacao');
  const resetBtn = setButtonLoading(btn, movimentacaoEditandoId ? 'Salvando...' : 'Processando...');

  try {
    const produtoBusca = document.getElementById('movProdutoBusca')?.value;
    const produto = encontrarProdutoPorBusca(produtoBusca);
    const tipo = document.getElementById('movTipo').value;
    const endereco = document.getElementById('movEndereco').value.trim();
    const quantidade = Number(document.getElementById('movQuantidade').value || 0);

    if (!produto) {
      showModal('Selecione um produto válido para a movimentação.', 'error');
      return;
    }

    if (!endereco && tipo !== 'ajuste') {
      showModal('Endereço é obrigatório.', 'error');
      return;
    }

    if (quantidade < 0 || Number.isNaN(quantidade)) {
      showModal('Quantidade inválida.', 'error');
      return;
    }

    if (tipo === 'ajuste') {
      const itemAtual = (estoque || []).find(item => {
        const matchId = String(item.produtoId || '') === String(produto.id || '');
        const matchNome = String(item.produto || '').toLowerCase() === String(produto.nome || '').toLowerCase();
        const matchCodigo = String(item.codigo || '').toLowerCase() === String(produto.codigo || '').toLowerCase();
        const matchEndereco = String(item.endereco || '') === String(endereco || '');
        return (matchId || matchNome || matchCodigo) && matchEndereco;
      });

      const atual = Number(itemAtual?.quantidade || 0);
      const desejado = Number(quantidade || 0);
      const diferenca = desejado - atual;

      if (diferenca === 0) {
        showModal('Nenhuma alteração necessária. O saldo já está nesse valor.', 'success');
        return;
      }

      const tipoReal = diferenca > 0 ? 'entrada' : 'saida';
      const quantidadeReal = Math.abs(diferenca);

      const response = await fetch('/api/estoque/movimentar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produtoId: produto.id,
          tipo: tipoReal,
          endereco,
          quantidade: quantidadeReal
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showModal(data.message || 'Erro ao ajustar estoque.', 'error');
        return;
      }

      showModal('Ajuste realizado com sucesso.', 'success');
    } else {
      const response = await fetch('/api/estoque/movimentar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produtoId: produto.id,
          tipo,
          endereco,
          quantidade
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showModal(data.message || 'Erro ao movimentar estoque.', 'error');
        return;
      }

      showModal('Movimentação realizada com sucesso.', 'success');
    }

    await carregarProdutos();
    await carregarEstoque();
    await carregarMovimentacoes();
    await renderView('estoque', { skipLoad: true });
  } finally {
    resetBtn();
  }
};

window.transferirEstoque = async function () {
  const btn = document.getElementById('btnTransferir');
  const resetBtn = setButtonLoading(btn, 'Transferindo...');

  try {
    const produtoBusca = document.getElementById('transfProdutoBusca')?.value;
    const produto = encontrarProdutoPorBusca(produtoBusca);
    const origem = document.getElementById('transfOrigem').value.trim();
    const destino = document.getElementById('transfDestino').value.trim();
    const quantidade = Number(document.getElementById('transfQuantidade').value || 0);

    if (!produto) {
      showModal('Selecione um produto válido para a transferência.', 'error');
      return;
    }

    if (!origem || !destino || !quantidade) {
      showModal('Origem, destino e quantidade são obrigatórios.', 'error');
      return;
    }

    const response = await fetch('/api/estoque/transferir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produtoId: produto.id, origem, destino, quantidade })
    });

    const data = await response.json();

    if (!response.ok) {
      showModal(data.message || 'Erro ao transferir estoque.', 'error');
      return;
    }

    showModal('Transferência realizada com sucesso.', 'success');

    await carregarProdutos();
    await carregarEstoque();
    await carregarMovimentacoes();
    await renderView('estoque', { skipLoad: true });
  } finally {
    resetBtn();
  }
};

window.cancelarMovimentacao = async function (id) {
  const confirmar = await showConfirmModal('Tem certeza que deseja cancelar esta movimentação?');
  if (!confirmar) return;

  await fetch('/api/estoque/movimentacoes/' + id + '/cancelar', {
    method: 'PUT'
  });

  await carregarProdutos();
  await carregarEstoque();
  await carregarMovimentacoes();
  await renderView('estoque', { skipLoad: true });
  showModal('Movimentação cancelada com sucesso.', 'success');
};

window.abrirModalEscolhaEdicao = function (id, origem = 'mov') {
  const mov = origem === 'mov'
    ? movimentacoes.find(m => String(m.id) === String(id))
    : null;
  const produto = origem === 'saldo'
    ? produtos.find(p => String(p.id) === String(id))
    : (mov ? produtos.find(p => String(p.id) === String(mov.produtoId)) : null);

  if (!produto && !mov) return;

  const existente = document.getElementById('modalEscolhaEdicao');
  if (existente) existente.remove();

  const modal = document.createElement('div');
  modal.id = 'modalEscolhaEdicao';
  modal.className = 'system-modal-backdrop';
  modal.innerHTML = `
    <div class="system-modal-card warning">
      <div class="system-modal-title">O que deseja editar?</div>
      <div class="system-modal-message">Escolha abaixo o tipo de edição.</div>
      <div class="system-modal-actions">
        <button class="system-modal-btn btn-secondary" id="btnEscolhaMov">Movimentação</button>
        <button class="system-modal-btn" id="btnEscolhaTransf">Transferência</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const fechar = () => document.getElementById('modalEscolhaEdicao')?.remove();

  document.getElementById('btnEscolhaMov')?.addEventListener('click', async () => {
    fechar();
    movimentacaoEditandoId = mov ? id : null;
    await renderView('estoque', { skipLoad: true });

    preencherMovimentacao(produto, {
      tipo: mov ? (mov.tipo === 'transferencia' ? 'ajuste' : mov.tipo) : 'ajuste',
      endereco: mov ? (mov.endereco || mov.destino || '') : (encontrarEnderecoOrigemDoProduto(produto) || ''),
      quantidade: mov ? (mov.quantidade || '') : ''
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('btnEscolhaTransf')?.addEventListener('click', async () => {
    fechar();
    movimentacaoEditandoId = mov ? id : null;
    await renderView('estoque', { skipLoad: true });

    preencherTransferencia(produto, {
      origem: mov ? (mov.origem || encontrarEnderecoOrigemDoProduto(produto) || '') : encontrarEnderecoOrigemDoProduto(produto),
      destino: mov ? (mov.destino || '') : '',
      quantidade: mov ? (mov.quantidade || '') : ''
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) fechar();
  });
};

window.excluirProdutoComEstoque = async function (produtoId) {
  const produto = produtos.find(p => String(p.id) === String(produtoId));
  if (!produto) {
    showModal('Produto não encontrado para exclusão.', 'error');
    return;
  }

  const confirmar = await showConfirmModal(`Tem certeza que deseja excluir o produto "${produto.nome || produto.codigo || produto.id}"? O estoque relacionado será zerado antes da exclusão.`);
  if (!confirmar) return;

  try {
    const itensRelacionados = (estoque || []).filter(item => {
      const matchId = String(item.produtoId || '') === String(produtoId);
      const matchNome = String(item.produto || '').toLowerCase() === String(produto.nome || '').toLowerCase();
      const matchCodigo = String(item.codigo || '').toLowerCase() === String(produto.codigo || '').toLowerCase();
      return Number(item.quantidade || 0) > 0 && (matchId || matchNome || matchCodigo);
    });

    for (const item of itensRelacionados) {
      const res = await fetch('/api/estoque/movimentar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produtoId: produtoId,
          tipo: 'saida',
          endereco: item.endereco,
          quantidade: Number(item.quantidade || 0)
        })
      });

      let data = {};
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        throw new Error(data.message || `Erro ao zerar estoque no endereço ${item.endereco}.`);
      }
    }

    const del = await fetch('/api/produtos/' + produtoId, {
      method: 'DELETE'
    });

    let delData = {};
    try {
      delData = await del.json();
    } catch {}

    if (!del.ok) {
      throw new Error(delData.message || 'Erro ao excluir produto.');
    }

    await carregarProdutos();
    await carregarEstoque();
    await carregarMovimentacoes();
    await renderView('estoque', { skipLoad: true });
    showModal('Produto excluído com sucesso.', 'success');
  } catch (error) {
    showModal(error.message || 'Erro ao excluir produto.', 'error');
  }
};

window.abrirAjusteEndereco = async function (produtoId, endereco) {
  const produto = produtos.find(p => String(p.id) === String(produtoId));
  if (!produto) return;

  movimentacaoEditandoId = null;
  await renderView('estoque', { skipLoad: true });

  const item = (estoque || []).find(entry =>
    String(entry.produtoId || '') === String(produtoId) &&
    String(entry.endereco || '') === String(endereco || '')
  );

  preencherMovimentacao(produto, {
    tipo: 'ajuste',
    endereco: endereco || '',
    quantidade: Number(item?.quantidade || 0)
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.abrirTransferenciaEndereco = async function (produtoId, endereco) {
  const produto = (produtos || []).find(p => String(p.id) === String(produtoId));
  if (!produto) return;

  movimentacaoEditandoId = null;
  await renderView('estoque', { skipLoad: true });

  // tenta localizar os campos reais do formulário de transferência
  const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
  const botoes = Array.from(document.querySelectorAll('button'));
  const titulos = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,.card-title,.section-title,strong'));

  const tituloTransferencia = titulos.find(el =>
    (el.textContent || '').toLowerCase().includes('transferência entre endereços') ||
    (el.textContent || '').toLowerCase().includes('transferencia entre enderecos')
  );

  let cardTransferencia = null;
  if (tituloTransferencia) {
    cardTransferencia = tituloTransferencia.closest('.card, .panel, section, div');
  }

  const inputProduto = document.getElementById('transferProdutoBusca')
    || inputs.find(el => (el.placeholder || '').toLowerCase().includes('digite código ou nome do produto') && el.closest('.card, .panel, section, div') === cardTransferencia)
    || inputs.find(el => (el.placeholder || '').toLowerCase().includes('digite código ou nome do produto'));

  const inputOrigem = document.getElementById('transferOrigem')
    || inputs.find(el => (el.placeholder || '').toLowerCase().includes('endereço de origem') || (el.placeholder || '').toLowerCase().includes('endereco de origem'));

  const inputDestino = document.getElementById('transferDestino')
    || inputs.find(el => (el.placeholder || '').toLowerCase().includes('endereço de destino') || (el.placeholder || '').toLowerCase().includes('endereco de destino'));

  const inputQuantidade = document.getElementById('transferQuantidade')
    || inputs.find(el => (el.placeholder || '').toLowerCase() === 'quantidade');

  if (inputProduto) inputProduto.value = produtoOptionLabel(produto);
  if (inputOrigem) inputOrigem.value = endereco || '';
  if (inputDestino) inputDestino.value = '';
  if (inputQuantidade) inputQuantidade.value = '';

  if (cardTransferencia && cardTransferencia.scrollIntoView) {
    cardTransferencia.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    const btnTransferir = botoes.find(btn => (btn.textContent || '').toLowerCase().trim() === 'transferir');
    if (btnTransferir) {
      const bloco = btnTransferir.closest('.card, .panel, section, div');
      if (bloco && bloco.scrollIntoView) {
        bloco.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // dispara eventos para frameworks/escutas de input
  [inputProduto, inputOrigem, inputDestino, inputQuantidade].forEach(el => {
    if (!el) return;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
};



window.abrirAjusteSaldo = async function (produtoId) {
  const produto = produtos.find(p => String(p.id) === String(produtoId));
  if (!produto) return;

  const itemEstoque = (estoque || []).find(item => {
    const matchId = String(item.produtoId || '') === String(produtoId);
    const matchNome = String(item.produto || '').toLowerCase() === String(produto.nome || '').toLowerCase();
    const matchCodigo = String(item.codigo || '').toLowerCase() === String(produto.codigo || '').toLowerCase();
    return Number(item.quantidade || 0) >= 0 && (matchId || matchNome || matchCodigo);
  });

  movimentacaoEditandoId = null;
  await renderView('estoque', { skipLoad: true });

  preencherMovimentacao(produto, {
    tipo: 'ajuste',
    endereco: itemEstoque?.endereco || encontrarEnderecoOrigemDoProduto(produto) || '',
    quantidade: Number(itemEstoque?.quantidade || 0)
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.salvarEdicaoMovimentacao = async function () {
  if (!movimentacaoEditandoId) {
    return window.movimentarEstoque();
  }

  const btn = document.getElementById('btnSalvarMovimentacao');
  const resetBtn = setButtonLoading(btn, 'Salvando...');

  try {
    const movOriginal = movimentacoes.find(m => String(m.id) === String(movimentacaoEditandoId));
    if (!movOriginal) {
      showModal('Movimentação original não encontrada.', 'error');
      return;
    }

    const produtoBusca = document.getElementById('movProdutoBusca')?.value;
    const produto = encontrarProdutoPorBusca(produtoBusca);

    if (!produto) {
      showModal('Selecione um produto válido para a edição.', 'error');
      return;
    }

    const quantidade = Number(document.getElementById('movQuantidade').value || 0);

    const payload = {
      produtoId: produto.id,
      tipo: document.getElementById('movTipo').value,
      endereco: document.getElementById('movEndereco').value.trim(),
      quantidade
    };

    const response = await fetch('/api/movimentacoes/' + movimentacaoEditandoId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      showModal(data.message || 'Erro ao salvar edição.', 'error');
      return;
    }

    movimentacaoEditandoId = null;
    showModal('Movimentação editada com sucesso.', 'success');

    await carregarProdutos();
    await carregarEstoque();
    await carregarMovimentacoes();
    await renderView('estoque', { skipLoad: true });
  } finally {
    resetBtn();
  }
};

window.salvarEdicaoTransferencia = async function () {
  if (!movimentacaoEditandoId) {
    return window.transferirEstoque();
  }

  const movOriginal = movimentacoes.find(m => String(m.id) === String(movimentacaoEditandoId));
  if (!movOriginal) {
    showModal('Movimentação original não encontrada.', 'error');
    return;
  }

  const produtoBusca = document.getElementById('transfProdutoBusca')?.value;
  const produto = encontrarProdutoPorBusca(produtoBusca);
  const origem = document.getElementById('transfOrigem')?.value.trim();
  const destino = document.getElementById('transfDestino')?.value.trim();
  const quantidade = Number(document.getElementById('transfQuantidade')?.value || 0);

  if (!produto) {
    showModal('Selecione um produto válido para a transferência.', 'error');
    return;
  }

  if (!origem || !destino || !quantidade) {
    showModal('Origem, destino e quantidade são obrigatórios.', 'error');
    return;
  }

  const btn = document.getElementById('btnTransferir');
  const resetBtn = setButtonLoading(btn, 'Salvando...');

  try {
    const response = await fetch('/api/movimentacoes/' + movimentacaoEditandoId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produtoId: produto.id,
        origem,
        destino,
        quantidade
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showModal(data.message || 'Erro ao salvar edição da transferência.', 'error');
      return;
    }

    movimentacaoEditandoId = null;
    showModal('Transferência editada com sucesso.', 'success');

    await carregarProdutos();
    await carregarEstoque();
    await carregarMovimentacoes();
    await renderView('estoque', { skipLoad: true });
  } finally {
    resetBtn();
  }
};

window.cancelarEdicaoMovimentacao = async function () {
  movimentacaoEditandoId = null;
  await renderView('estoque', { skipLoad: true });
};

function bindProdutoFormBehavior() {
  const codigo = document.getElementById('codigo');
  const sku = document.getElementById('sku');
  if (!codigo || !sku) return;

  let skuFoiEditadoManual = false;

  sku.addEventListener('input', () => {
    skuFoiEditadoManual = true;
  });

  codigo.addEventListener('input', () => {
    if (!skuFoiEditadoManual || !sku.value.trim()) {
      sku.value = codigo.value;
    }
  });

  if (!sku.value.trim() && codigo.value.trim()) {
    sku.value = codigo.value;
  }
}

function initAutocompleteEstoque() {
  normalizarBuscaProdutoInput('movProdutoBusca');
  normalizarBuscaProdutoInput('transfProdutoBusca', (produto) => {
    const campoOrigem = document.getElementById('transfOrigem');
    if (!campoOrigem) return;
    campoOrigem.value = produto ? encontrarEnderecoOrigemDoProduto(produto) : '';
  });
}

async function renderView(view, options = {}) {
  if (!options.skipLoad) {
    if (view === 'dashboard' || view === 'produtos' || view === 'estoque') {
      await carregarProdutos();
    }
    if (view === 'estoque') {
      await carregarEstoque();
      await carregarMovimentacoes();
    }
  }

  if (typeof window.destroyPedidosUI === 'function' && view !== 'pedidos') {
    try { window.destroyPedidosUI(); } catch {}
  }

  workspace.innerHTML = (views[view] || views.dashboard)();

  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === view);
  });

  localStorage.setItem('ultimaViewAtiva', view);

  if (view === 'produtos') {
    renderTabela();
    bindProdutoFormBehavior();
  }

  if (view === 'estoque') {
    renderTabelaEstoque();
    renderTabelaEnderecos();
    renderUltimasMovimentacoes();
    renderTabelaMovimentacoes();
    try { renderUltimasMovimentacoes(); } catch {}
    initAutocompleteEstoque();
  }

  if (view === 'pedidos' && typeof window.renderPedidos === 'function') {
    setTimeout(() => window.renderPedidos(), 50);
    setTimeout(() => window.renderPedidos(), 250);
  }

  if (view === 'separacao' && typeof window.renderSeparacao === 'function') {
    setTimeout(() => window.renderSeparacao(), 100);
  }
}

buttons.forEach(button => {
  button.addEventListener('click', async () => {
    produtoEditandoId = null;
    movimentacaoEditandoId = null;
    await renderView(button.dataset.view);
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  const ultimaSalva = localStorage.getItem('ultimaViewAtiva');
  const ultima = ultimaSalva && ultimaSalva.trim() ? ultimaSalva : 'dashboard';
  await renderView(ultima);
});


// chamada de segurança
try { renderUltimasMovimentacoes(); } catch (e) {}




function renderUltimasMovimentacoes(){
  const tabela = document.getElementById('ultimasMovimentacoes');
  if(!tabela) return;

  tabela.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';

  fetch('/api/estoque/movimentacoes')
    .then(r=>r.json())
    .then(data=>{
      const movs = data.movimentacoes || [];

      if(!movs.length){
        tabela.innerHTML = '<tr><td colspan="6">Sem movimentações</td></tr>';
        return;
      }

      tabela.innerHTML = movs.reverse().slice(0,50).map(m=>{
        let tipo = m.tipo;

        if(tipo === 'ajuste'){
          tipo = '<span class="badge status-ajuste">Ajustado</span>';
        }else if(tipo === 'entrada'){
          tipo = '<span class="badge status-ok">Entrada</span>';
        }else if(tipo === 'saida'){
          tipo = '<span class="badge status-baixo">Saída</span>';
        }else if(tipo === 'transferencia'){
          tipo = '<span class="badge status-transf">Transferência</span>';
        }

        return `
          <tr>
            <td>${tipo}</td>
            <td>${m.produto || '-'}</td>
            <td>${m.endereco || '-'}</td>
            <td>${m.quantidade || 0}</td>
            <td>${new Date(m.data).toLocaleString()}</td>
            <td>${m.status || ''}</td>
          </tr>
        `;
      }).join('');
    });
}




// ===== FILTRO AVANÇADO ESTOQUE =====
function filtroAvancadoEstoque(item, termo){
  termo = String(termo || '').toLowerCase()

  function contem(v){
    return String(v || '').toLowerCase().includes(termo)
  }

  return (
    contem(item.produto) ||
    contem(item.nome) ||
    contem(item.codigo) ||
    contem(item.sku) ||
    contem(item.endereco) ||
    contem(item.enderecoFormatado)
  )
}


// ===== BOTÕES PADRÃO ENDEREÇO =====
function gerarBotoesEndereco(produtoId, endereco){
  return `
    <div class="acoes-endereco-inline">
      <button class="btn-action btn-edit btn-endereco-acao"
        onclick="abrirAjusteEndereco('${produtoId}','${endereco}')">
        Ajuste
      </button>

      <button class="btn-action btn-endereco-acao btn-transferir-endereco"
        onclick="abrirTransferenciaEndereco('${produtoId}','${endereco}')">
        Transferir
      </button>
    </div>
  `;
}
