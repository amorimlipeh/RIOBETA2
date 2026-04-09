const workspace = document.getElementById('workspace');
const buttons = document.querySelectorAll('.menu-item');

let produtos = [];
let produtoEditandoId = null;

async function carregarProdutos() {
  try {
    const response = await fetch('/api/produtos');
    produtos = await response.json();
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

        ${
          produtoEditandoId
            ? `<button onclick="cancelarEdicao()" style="background:#475569">Cancelar</button>`
            : ''
        }
      </div>

      <div class="produto-table-card">
        <h3>Lista de Produtos</h3>

        <input id="pesquisaProduto" onkeyup="filtrarProdutos()" placeholder="Pesquisar por código, nome ou SKU">

        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
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
        <td>${produto.codigo}</td>
        <td>${produto.nome}</td>
        <td>${produto.quantidade}</td>
        <td>${produto.sku || '-'}</td>
        <td>
          <button onclick="editarProduto('${produto.id}')">Editar</button>
          <button onclick="removerProduto('${produto.id}')">Excluir</button>
        </td>
      </tr>
    `;
  });
}

window.filtrarProdutos = function () {
  const termo = document.getElementById('pesquisaProduto').value.toLowerCase();

  const filtrados = produtos.filter(produto =>
    produto.codigo.toLowerCase().includes(termo) ||
    produto.nome.toLowerCase().includes(termo) ||
    (produto.sku || '').toLowerCase().includes(termo)
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
  renderView('produtos');
};

window.editarProduto = function (id) {
  const produto = produtos.find(p => p.id === id);

  produtoEditandoId = id;

  renderView('produtos');

  setTimeout(() => {
    document.getElementById('codigo').value = produto.codigo;
    document.getElementById('nome').value = produto.nome;
    document.getElementById('categoria').value = produto.categoria;
    document.getElementById('quantidade').value = produto.quantidade;
    document.getElementById('fator').value = produto.fator;
    document.getElementById('sku').value = produto.sku;
    document.getElementById('imagem').value = produto.imagem;
  }, 100);
};

window.cancelarEdicao = function () {
  produtoEditandoId = null;
  renderView('produtos');
};

window.removerProduto = async function (id) {
  await fetch('/api/produtos/' + id, { method: 'DELETE' });

  await carregarProdutos();
  renderView('produtos');
};

async function renderView(view) {
  if (view === 'dashboard' || view === 'produtos') {
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

    await renderView(button.dataset.view);
  });
});

renderView('dashboard');
