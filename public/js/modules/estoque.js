
window.preencherAjuste = function(item){

  document.getElementById('produtoId').value = item.produtoId || '';
  document.getElementById('endereco').value = item.endereco || '';
  document.getElementById('quantidade').value = item.quantidade || '';

  document.getElementById('tipoMovimentacao').value = 'ajuste';

  // 🔥 scroll automático pra área de movimentação
  document.getElementById('formMovimentacao').scrollIntoView({ behavior: 'smooth' });
};


window.movimentarEstoque = async function(){

  const produtoId = document.getElementById('produtoId').value;
  const endereco = document.getElementById('endereco').value;
  const quantidade = Number(document.getElementById('quantidade').value);
  const tipo = document.getElementById('tipoMovimentacao').value;

  if(!produtoId || !endereco || !quantidade){
    alert('Preencha todos os campos');
    return;
  }

  const res = await fetch('/api/estoque/movimentar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      produtoId,
      endereco,
      quantidade,
      tipo
    })
  });

  const data = await res.json();

  if(!res.ok){
    alert(data.message || 'Erro na movimentação');
    return;
  }

  alert('Movimentação realizada');
  carregarEstoque();
};

