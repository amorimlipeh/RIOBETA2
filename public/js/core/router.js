const workspace = document.getElementById('workspace');
const buttons = document.querySelectorAll('.menu-item');

let produtos = [];
let produtoEditandoId = null;

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

function gerarSKU() {
  return 'SKU-' + Math.floor(Math.random() * 999999);
}

function dashboardView() {
  return `
    <div class="hero-card fade-in">
      <h1>Dashboard Executivo</h1>
      <p>Painel central de gestão logística</p>
    </div>

    <div class="grid-cards fade-in">
      <div class="stat-card"><h3>Total Produtos</h3><p>${produtos.length}</p></div>
      <div class="stat-card"><h3>Pedidos</h3><p>89</p></div>
      <div class="stat-card"><h3>Estoque</h3><p>22.450</p></div>
      <div class="stat-card"><h3>WMS</h3><p>97%</p></div>
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

    <div class="produto-layout fade-in">
      <div class="produto-form-card">
        <h3>${produtoEditandoId ? 'Editar Produto' : 'Novo Produto'}</h3>

        <input id="codigo" placeholder="Código">
        <input id="nome" placeholder="Nome">
        <input id="categoria" placeholder="Categoria">
        <input id="quantidade" type="number" placeholder="Quantidade">
        <input id="fator" type="number" placeholder="Fator">
        <input id="sku" placeholder="SKU (Opcional)">
        <input id="imagem" placeholder="URL da Imagem">

        <button onclick="salvarProduto()">
          ${produtoEditandoId ? 'Salvar Alterações' : 'Salvar Produto'}
        </button>

        ${produtoEditandoId ? `<button onclick="cancelarEdicao()" style="background:#475569">Cancelar</button>` : ''}
      </div>

      <div class="produto-table-card">
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
    </div>
  `;
}

const views = {
  dashboard: () => dashboardView(),
  produtos: () => produtosView(),
  estoque: () => `<div class="hero-card"><h1>Módulo Estoque</h1></div>`,
  pedidos: () => `<div class="hero-card"><h1>Módulo Pedidos</h1></div>`,
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
        <td style="display:flex;gap:6px;">
          <button onclick="editarProduto('${produto.id}')">Editar</button>
          <button onclick="removerProduto('${produto.id}')">Excluir</button>
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
  const payload = {
    codigo: document.getElementById('codigo').value,
    nome: document.getElementById('nome').value,
    categoria: document.getElementById('categoria').value,
    quantidade: Number(document.getElementById('quantidade').value),
    fator: Number(document.getElementById('fator').value),
    sku: document.getElementById('sku').value || gerarSKU(),
    imagem: document.getElementById('imagem').value
  };

  if (!payload.codigo || !payload.nome) {
    alert('Código e nome são obrigatórios.');
    return;
  }

  if (produtoEditandoId) {
    await fetch('/api/produtos/' + produtoEditandoId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    produtoEditandoId = null;
  } else {
    await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  await carregarProdutos();
  await renderView('produtos', { skipLoad: true });
};

window.editarProduto = async function (id) {
  const produto = produtos.find(p => String(p.id) === String(id));
  if (!produto) return;

  produtoEditandoId = id;

  workspace.innerHTML = views.produtos();
  renderTabela();
  preencherFormulario(produto);
};

window.cancelarEdicao = async function () {
  produtoEditandoId = null;
  await renderView('produtos', { skipLoad: true });
};

window.removerProduto = async function (id) {
  await fetch('/api/produtos/' + id, { method: 'DELETE' });
  await carregarProdutos();
  await renderView('produtos', { skipLoad: true });
};

async function renderView(view, options = {}) {
  if (!options.skipLoad && (view === 'dashboard' || view === 'produtos')) {
    await carregarProdutos();
  }

  workspace.innerHTML = views[view]();

  if (view === 'produtos') {
    renderTabela();
  }
}

buttons.forEach(button => {
  button.addEventListener('click', async () => {
    buttons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    produtoEditandoId = null;
    await renderView(button.dataset.view);
  });
});

renderView('dashboard');
