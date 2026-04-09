const workspace = document.getElementById('workspace');
const buttons = document.querySelectorAll('.menu-item');

let produtos = [];
let produtoEditandoId = null;
let estoque = [];
let movimentacoes = [];

function showToast(message, type = 'success') {
  const toast = document.createElement('div');

  toast.className = `toast ${type}`;
  toast.innerText = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 50);

  setTimeout(() => {
    toast.classList.remove('show');

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erro inesperado.');
  }

  return data;
}

async function carregarProdutos() {
  produtos = await apiFetch('/api/produtos');
}

async function carregarEstoque() {
  estoque = await apiFetch('/api/estoque');
}

async function carregarMovimentacoes() {
  movimentacoes = await apiFetch('/api/movimentacoes');
}

window.movimentarEstoque = async function () {
  try {
    const produtoId = document.getElementById('movProduto').value;
    const tipo = document.getElementById('movTipo').value;
    const endereco = document.getElementById('movEndereco').value;
    const quantidade = document.getElementById('movQuantidade').value;

    await apiFetch('/api/estoque/movimentar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produtoId, tipo, endereco, quantidade })
    });

    showToast('Movimentação realizada com sucesso.', 'success');

    await carregarProdutos();
    await carregarEstoque();
    await carregarMovimentacoes();
    renderView('estoque');

  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.transferirEstoque = async function () {
  try {
    const produtoId = document.getElementById('transfProduto').value;
    const origem = document.getElementById('transfOrigem').value;
    const destino = document.getElementById('transfDestino').value;
    const quantidade = document.getElementById('transfQuantidade').value;

    await apiFetch('/api/estoque/transferir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produtoId, origem, destino, quantidade })
    });

    showToast('Transferência realizada com sucesso.', 'success');

    await carregarProdutos();
    await carregarEstoque();
    await carregarMovimentacoes();
    renderView('estoque');

  } catch (err) {
    showToast(err.message, 'error');
  }
};
