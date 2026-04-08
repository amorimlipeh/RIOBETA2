const workspace = document.getElementById('workspace');
const buttons = document.querySelectorAll('.menu-item');

const views = {
  dashboard: `
    <div class="hero-card fade-in">
      <h1>Dashboard Executivo</h1>
      <p>Painel central de gestão logística</p>
    </div>

    <div class="grid-cards fade-in">
      <div class="stat-card"><h3>Produtos</h3><p>1.245</p></div>
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

    <div class="dashboard-row fade-in">
      <div class="big-card full">
        <h3>📋 Atividade Recente</h3>
        <ul>
          <li>João separou pedido #5511</li>
          <li>Maria ajustou estoque SKU-991</li>
          <li>Carlos conferiu contêiner CX-02</li>
          <li>Sistema sincronizado com sucesso</li>
        </ul>
      </div>
    </div>
  `,

  produtos: `
    <div class="hero-card fade-in">
      <h1>Módulo Produtos</h1>
      <p>Cadastro, pesquisa e gestão de produtos.</p>
    </div>
    <div class="big-card fade-in">
      <h3>Visão Inicial</h3>
      <p>Base pronta para CRUD completo de produtos.</p>
    </div>
  `,

  estoque: `
    <div class="hero-card fade-in">
      <h1>Módulo Estoque</h1>
      <p>Controle operacional de entradas, saídas e ajustes.</p>
    </div>
    <div class="big-card fade-in">
      <h3>Visão Inicial</h3>
      <p>Base pronta para saldo, movimentação e histórico.</p>
    </div>
  `,

  pedidos: `
    <div class="hero-card fade-in">
      <h1>Módulo Pedidos</h1>
      <p>Gestão de pedidos e fluxo operacional.</p>
    </div>
    <div class="big-card fade-in">
      <h3>Visão Inicial</h3>
      <p>Base pronta para criação, fila e status dos pedidos.</p>
    </div>
  `,

  scanner: `
    <div class="hero-card fade-in">
      <h1>Módulo Scanner</h1>
      <p>Captura, leitura e integração operacional.</p>
    </div>
    <div class="big-card fade-in">
      <h3>Visão Inicial</h3>
      <p>Base pronta para o scanner real nas próximas builds.</p>
    </div>
  `,

  wms: `
    <div class="hero-card fade-in">
      <h1>Módulo WMS</h1>
      <p>Mapa logístico, ruas, posições e endereçamento.</p>
    </div>
    <div class="big-card fade-in">
      <h3>Visão Inicial</h3>
      <p>Base pronta para mapa WMS e gestão de endereços.</p>
    </div>
  `
};

function renderView(view) {
  workspace.classList.remove('view-show');
  workspace.classList.add('view-hide');

  setTimeout(() => {
    workspace.innerHTML = views[view] || views.dashboard;
    workspace.classList.remove('view-hide');
    workspace.classList.add('view-show');
  }, 120);
}

buttons.forEach(button => {
  button.addEventListener('click', () => {
    buttons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    renderView(button.dataset.view);
  });
});

renderView('dashboard');
