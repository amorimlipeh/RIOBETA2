
function renderMovimentacoes(movs) {
  const container = document.getElementById('ultimas-movimentacoes');
  if (!container) return;

  container.innerHTML = '';

  (movs || []).forEach(m => {
    const cor =
      m.tipo === 'entrada' ? '#22c55e' :
      m.tipo === 'saida' ? '#ef4444' : '#f59e0b';

    container.innerHTML += `
      <tr>
        <td style="color:${cor}; font-weight:bold;">${m.tipo}</td>
        <td>${m.produtoNome || m.produtoId}</td>
        <td>${m.endereco || '-'}</td>
        <td>${m.quantidade}</td>
      </tr>
    `;
  });
}

