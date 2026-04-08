const workspace = document.getElementById('workspace');
const buttons = document.querySelectorAll('.menu-item');

let produtos = [];

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

    <div class="dashboard-row fade-in">
      <div class="big-card">
        <h3>📈 Performance Operacional</h3>
        <div class="fake-chart"></div>
      </div>

      <div class="big-card">
        <h3>🚨 Alertas</h3>
        <ul>
          <li>Estoque baixo: SKU-201</li>
          <li>Pedido atrasado: #5542</li>
          <li>Conferência pendente: 14</li>
        </ul>
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
      <div class="stat-card"><h3>Total Produtos</h3><p>${produtos.length}</p></div>
      <div class="stat-card"><h3>Quantidade Total</h3><p>${quantidadeTotal}</p></div>
    </div>

    <div class="produto-layout fade-in">
      <div class="produto-form-card">
        <h3>Novo Produto</h3>
        <input id="codigo" placeholder="Código">
        <input id="nome" placeholder="Nome">
        <input id="categoria" placeholder="Categoria">
        <input id="quantidade" type="number" placeholder="Quantidade">
        <input id="fator" type="number" placeholder="Fator">
        <input id="sku" placeholder="SKU (Opcional)">
        <input id="imagem" placeholder="URL da Imagem">
        <button onclick="salvarProduto()">Salvar Produto</button>
      </div>

      <div class="produto-table-card">
        <h3>Lista de Produtos</h3>
        <input id="pesquisaProduto" onkeyup="filtrarProdutos()" placeholder="Pesquisar por código, nome ou SKU">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Qtd</th>
              <th>Fator</th>
              <th>SKU</th>
              <th>Img</th>
              <th>Ação</th>
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
  estoque: () => `<div class="hero-card fade-in"><h1>Módulo Estoque</h1><p>Próxima build.</p></div>`,
  pedidos: () => `<div class="hero-card fade-in"><h1>Módulo Pedidos</h1><p>Próxima build.</p></div>`,
  scanner: () => `<div class="hero-card fade-in"><h1>Módulo Scanner</h1><p>Próxima build.</p></div>`,
  wms: () => `<div class="hero-card fade-in"><h1>Módulo WMS</h1><p>Próxima build.</p></div>`
};

function renderTabela(lista = produtos) {
  const tabela = document.getElementById('produtosTabela');
  if (!tabela) return;

  tabela.innerHTML = '';

  lista.forEach((produto) => {
    tabela.innerHTML += `
      <tr>
        <td>${produto.codigo || '-'}</td>
        <td>${produto.nome || '-'}</td>
        <td>${produto.categoria || '-'}</td>
        <td>${produto.quantidade || 0}</td>
        <td>${produto.fator || 0}</td>
        <td>${produto.sku || '-'}</td>
        <td>${produto.imagem ? `<img src="${produto.imagem}" width="40" height="40" style="object-fit:cover;border-radius:8px;">` : '-'}</td>
        <td><button onclick="removerProduto('${produto.id}')">Excluir</button></td>
      </tr>
    `;
  });
}

window.filtrarProdutos = function () {
  const termo = (document.getElementById('pesquisaProduto')?.value || '').toLowerCase();

  const filtrados = produtos.filter(produto =>
    String(produto.codigo || '').toLowerCase().includes(termo) ||
    String(produto.nome || '').toLowerCase().includes(termo) ||
    String(produto.sku || '').toLowerCase().includes(termo)
  );

  renderTabela(filtrados);
};

window.salvarProduto = async function () {
  const codigo = document.getElementById('codigo').value.trim();
  const nome = document.getElementById('nome').value.trim();
  const categoria = document.getElementById('categoria').value.trim();
  const quantidade = Number(document.getElementById('quantidade').value || 0);
  const fator = Number(document.getElementById('fator').value || 0);
  const sku = document.getElementById('sku').value.trim() || gerarSKU();
  const imagem = document.getElementById('imagem').value.trim();

  if (!codigo || !nome) {
    alert('Código e nome são obrigatórios.');
    return;
  }

  await fetch('/api/produtos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo, nome, categoria, quantidade, fator, sku, imagem })
  });

  await carregarProdutos();
  await renderView('produtos');
};

window.removerProduto = async function (id) {
  await fetch('/api/produtos/' + id, { method: 'DELETE' });
  await carregarProdutos();
  await renderView('produtos');
};

async function renderView(view) {
  if (view === 'dashboard' || view === 'produtos') {
    await carregarProdutos();
  }

  workspace.classList.remove('view-show');
  workspace.classList.add('view-hide');

  setTimeout(() => {
    workspace.innerHTML = views[view] ? views[view]() : views.dashboard();
    workspace.classList.remove('view-hide');
    workspace.classList.add('view-show');

    if (view === 'produtos') {
      renderTabela();
    }
  }, 120);
}

buttons.forEach(button => {
  button.addEventListener('click', async () => {
    buttons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    await renderView(button.dataset.view);
  });
});

renderView('dashboard');
