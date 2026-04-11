
async function salvarProduto(produto){

  const res = await fetch('/api/produtos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(produto)
  });

  const data = await res.json();

  if(!res.ok){
    alert(data.message || 'Erro ao salvar produto');
    return;
  }

  // 🔥 NOVO: já cria entrada no estoque automaticamente
  if(produto.quantidadeInicial && Number(produto.quantidadeInicial) > 0){
    await fetch('/api/estoque/movimentar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produtoId: data.id || produto.id,
        tipo: 'entrada',
        endereco: produto.endereco || '0000000',
        quantidade: Number(produto.quantidadeInicial)
      })
    });
  }

  alert('Produto salvo com sucesso');
  carregarProdutos();
}


async function editarProduto(id, dados){

  const res = await fetch('/api/produtos/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });

  const data = await res.json();

  if(!res.ok){
    alert(data.message || 'Erro ao editar produto');
    return;
  }

  alert('Produto atualizado com sucesso');
  carregarProdutos(); // 🔥 força atualizar tela
}

