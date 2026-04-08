const workspace = document.getElementById('workspace');
const buttons = document.querySelectorAll('.menu-item');

let produtos = [];

async function carregarProdutos() {
  try {
    const response = await fetch('/api/produtos');
    produtos = await response.json();
  } catch (error) {
    produtos = [];
  }
}

function dashboardView() {
  return `
    <div class="hero-card fade-in">
      <h1>Dashboard Executivo</h1>
      <p>Painel central de gestão logística</p>
    </div>

    <div class="grid-cards fade-in">
      <div class="stat-card"><h3>Produtos</h3><p>${produtos.length}</p></div>
      <div class="stat-card"><h3>Pedidos</h3><p>89</p></div>
      <div class="stat-card"><h3>Estoque</h3><p>22.450</p></div>
      <div class="stat-card"><h3>WMS</h3><p>97%</p></div>
    </div>
  `;
}

function produtosView() {
  return `
    <div class="hero-card fade-in">
      <h1>Gestão de Produtos</h1>
      <p>Cadastro e gerenciamento completo.</p>
    </div>

    <div class="produto-layout fade-in">
      <div class="produto-form-card">
        <h3>Novo Produto</h3>
        <input id="codigo" placeholder="Código">
        <input id="nome" placeholder="Nome">
        <input id="categoria" placeholder="Categoria">
        <input id="quantidade" type="number" placeholder="Quantidade">
        <button onclick="salvarProduto()">Salvar Produto</button>
      </div>

      <div class="produto-table-card">
        <h3>Lista de Produtos</h3>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Qtd</th>
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

function renderTabela() {
  const tabela = document.getElementById('produtosTabela');
  if (!tabela) return;

  tabela.innerHTML = '';

  produtos.forEach((produto) => {
    tabela.innerHTML += `
      <tr>
        <td>${produto.codigo}</td>
        <td>${produto.nome}</td>
        <td>${produto.categoria || '-'}</td>
        <td>${produto.quantidade}</td>
        <td>
          <button onclick="removerProduto('${produto.id}')">Excluir</button>
        </td>
      </tr>
    `;
  });
}

async function renderView(view) {
  if (view === 'dashboard' || view === 'produtos') {
    await carregarProdutos();
  }

  workspace.innerHTML = views[view] ? views[view]() : views.dashboard();

  if (view === 'produtos') {
    renderTabela();
  }
}

window.salvarProduto = async function () {
  const codigo = document.getElementById('codigo').value.trim();
  const nome = document.getElementById('nome').value.trim();
  const categoria = document.getElementById('categoria').value.trim();
  const quantidade = document.getElementById('quantidade').value;

  if (!codigo || !nome) {
    alert('Código e nome são obrigatórios.');
    return;
  }

  await fetch('/api/produtos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo, nome, categoria, quantidade })
  });

  await carregarProdutos();
  renderTabela();

  document.getElementById('codigo').value = '';
  document.getElementById('nome').value = '';
  document.getElementById('categoria').value = '';
  document.getElementById('quantidade').value = '';
};

window.removerProduto = async function (id) {
  await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
  await carregarProdutos();
  renderTabela();
};

buttons.forEach(button => {
  button.addEventListener('click', async () => {
    buttons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    await renderView(button.dataset.view);
  });
});

renderView('dashboard');
