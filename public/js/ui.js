window.renderMenu = function() {
  byId('menu-modules').innerHTML = APP_STATE.modules.map(moduleName => `
    <button class="menu-btn ${moduleName === APP_STATE.module ? 'active' : ''}" data-module="${moduleName}" onclick="openModule('${moduleName}')">
      ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}
    </button>
  `).join('');
};

window.renderCards = async function() {
  const status = await API.get('/api/status');
  const cards = [
    { title: 'Produtos', value: '0' },
    { title: 'Estoque total', value: '0' },
    { title: 'Pedidos em aberto', value: '0' },
    { title: 'Recebimentos pendentes', value: '0' },
    { title: 'Status API', value: status.ok ? 'ON' : 'OFF' }
  ];
  byId('cards').innerHTML = cards.map(c => `
    <div class="card">
      <div style="font-size:14px;color:#475569">${c.title}</div>
      <div style="font-size:34px;font-weight:700;margin-top:8px">${c.value}</div>
    </div>
  `).join('');
};

window.renderModule = function(moduleName) {
  const map = {
    dashboard: "<h2>Dashboard</h2><p>Dashboard permanece ativo e visível.</p>",
    produtos: "<h2>Produtos</h2><p>Módulo base presente e pronto para ativação real.</p>",
    estoque: "<h2>Estoque</h2><p>Módulo base presente e pronto para ativação real.</p>",
    enderecos: "<h2>Endereços</h2><p>Módulo base presente e pronto para ativação real.</p>",
    pedidos: "<h2>Pedidos</h2><p>Módulo base presente e pronto para ativação real.</p>",
    recebimento: "<h2>Recebimento</h2><p>Módulo base presente e pronto para ativação real.</p>",
    inventario: "<h2>Inventário</h2><p>Módulo base presente e pronto para ativação real.</p>",
    notificacoes: "<h2>Notificações</h2><p>Módulo base presente e pronto para ativação real.</p>",
    configuracoes: "<h2>Configurações</h2><p>Módulo base presente e pronto para ativação real.</p>"
  };
  byId('module-view').innerHTML = map[moduleName] || "<h2>Módulo</h2><p>Base carregada.</p>";
};
