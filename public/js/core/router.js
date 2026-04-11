(function () {

const app = document.getElementById('app');

const views = {
  dashboard: () => '<h2>Dashboard</h2>',
  produtos: () => '<h2>Produtos</h2>',
  estoque: () => '<h2>Estoque</h2>',
  pedidos: () => '<div id="pedidos-root"></div>',
  separacao: () => '<div id="separacao-root"></div>',
  scanner: () => '<h2>Scanner</h2>',
  wms: () => '<h2>WMS</h2>'
};

function renderView(view) {

  if (!views[view]) return;

  app.innerHTML = views[view]();

  setTimeout(() => {

    if (view === 'pedidos' && typeof window.renderPedidos === 'function') {
      window.renderPedidos();
    }

    if (view === 'separacao' && typeof window.renderSeparacao === 'function') {
      window.renderSeparacao();
    }

  }, 100);
}

document.querySelectorAll('.menu-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.getAttribute('data-view');
    renderView(view);
  });
});

renderView('dashboard');

})();
