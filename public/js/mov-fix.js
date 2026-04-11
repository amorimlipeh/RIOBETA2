
window.renderMovimentacoesFix = function(data) {
  const container = document.querySelector('#ultimas-movimentacoes tbody');
  if (!container) return;

  container.innerHTML = '';

  const movs = data.movimentacoes || [];

  movs.forEach(m => {
    let cor = '#fff';
    if (m.tipo === 'entrada') cor = '#22c55e';
    if (m.tipo === 'saida') cor = '#ef4444';
    if (m.tipo === 'ajuste') cor = '#f59e0b';

    container.innerHTML += `
      <tr>
        <td style="color:${cor};font-weight:bold">${m.tipo}</td>
        <td>${m.produtoNome || m.produtoId}</td>
        <td>${m.endereco || '-'}</td>
        <td>${m.quantidade}</td>
      </tr>
    `;
  });
};

