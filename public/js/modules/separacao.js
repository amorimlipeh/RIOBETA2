(function () {

const STORAGE = 'pedidosSalvosMemoria';

function getPedidos(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE) || '[]');
  }catch{
    return [];
  }
}

function salvarPedidos(lista){
  localStorage.setItem(STORAGE, JSON.stringify(lista));
}

function getVisualStatus(status){
  const s = String(status || '').trim();

  if(s === 'Concluído'){
    return { cor:'#22c55e', icone:'🟢', fundo:'#123524' };
  }

  if(s === 'Em Separação'){
    return { cor:'#facc15', icone:'🟡', fundo:'#3a2f0b' };
  }

  if(s === 'Aguardando Separação'){
    return { cor:'#facc15', icone:'🟡', fundo:'#162742' };
  }

  return { cor:'#cbd5e1', icone:'⚪', fundo:'#162742' };
}

function txt(v){
  return String(v || '').trim();
}

function norm(v){
  return txt(v)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function qtdItemEmUnidades(item){
  const totalUnd = Number(item?.totalUnd || 0);
  if (totalUnd > 0) return totalUnd;

  const fator = Number(item?.fator || 1) || 1;
  const caixas = Number(item?.caixas || 0) || 0;
  const avulsas = Number(item?.avulsas || 0) || 0;
  return (caixas * fator) + avulsas;
}

async function carregarProdutos(){
  try{
    const res = await fetch('/api/produtos', { cache:'no-store' });
    if(!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  }catch{
    return [];
  }
}

async function carregarEstoque(){
  try{
    const res = await fetch('/api/estoque', { cache:'no-store' });
    if(!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  }catch{
    return [];
  }
}

function encontrarProduto(itemPedido, produtos){
  const codigoPedido = norm(itemPedido?.codigo);
  const nomePedido = norm(itemPedido?.nome);

  return produtos.find(prod => {
    const codigo = norm(prod.codigo || prod.code || prod.sku || prod.id);
    const nome = norm(prod.nome || prod.name || prod.descricao);
    return (codigoPedido && codigo === codigoPedido) || (nomePedido && nome === nomePedido) || (codigoPedido && codigo.includes(codigoPedido)) || (nomePedido && nome.includes(nomePedido));
  }) || null;
}

function enderecosDoProduto(produto, itemPedido, estoque){
  const produtoId = txt(produto?.id);
  const codigo = norm(produto?.codigo || produto?.code || produto?.sku || produto?.id);
  const nome = norm(produto?.nome || produto?.name || produto?.descricao);
  const codigoPedido = norm(itemPedido?.codigo);
  const nomePedido = norm(itemPedido?.nome);

  return (estoque || [])
    .filter(e => Number(e.quantidade || 0) > 0)
    .filter(e => {
      const matchId = produtoId && txt(e.produtoId) === produtoId;
      const matchCodigo = codigo && norm(e.codigo) === codigo;
      const matchNome = nome && norm(e.produto) === nome;
      const matchCodigoPedido = codigoPedido && norm(e.codigo) === codigoPedido;
      const matchNomePedido = nomePedido && norm(e.produto) === nomePedido;
      return matchId || matchCodigo || matchNome || matchCodigoPedido || matchNomePedido;
    })
    .sort((a, b) => Number(b.quantidade || 0) - Number(a.quantidade || 0));
}

async function baixarEstoquePedido(pedido){
  const produtos = await carregarProdutos();
  const estoque = await carregarEstoque();

  if (!produtos.length) {
    throw new Error('Não foi possível carregar os produtos para baixar o estoque.');
  }

  if (!estoque.length) {
    throw new Error('Não foi possível carregar o estoque para baixar o pedido.');
  }

  const plano = [];
  const erros = [];

  for (const item of (pedido.itens || [])) {
    const produto = encontrarProduto(item, produtos);

    if (!produto) {
      erros.push(`Produto não encontrado: ${txt(item.codigo || item.nome || 'Item sem identificação')}`);
      continue;
    }

    const quantidadeNecessaria = qtdItemEmUnidades(item);
    const enderecos = enderecosDoProduto(produto, item, estoque);
    const totalDisponivel = enderecos.reduce((acc, e) => acc + Number(e.quantidade || 0), 0);

    if (totalDisponivel < quantidadeNecessaria) {
      erros.push(`Estoque insuficiente para ${txt(item.codigo || item.nome)}. Necessário: ${quantidadeNecessaria} UND | Disponível: ${totalDisponivel} UND`);
      continue;
    }

    let restante = quantidadeNecessaria;

    for (const endereco of enderecos) {
      if (restante <= 0) break;

      const disponivel = Number(endereco.quantidade || 0);
      const retirar = Math.min(disponivel, restante);

      if (retirar > 0) {
        plano.push({
          produtoId: produto.id,
          endereco: endereco.endereco,
          quantidade: retirar,
          itemLabel: txt(item.codigo || item.nome || produto.nome || produto.codigo || produto.id)
        });
        restante -= retirar;
      }
    }

    if (restante > 0) {
      erros.push(`Não foi possível montar a baixa completa de ${txt(item.codigo || item.nome)}.`);
    }
  }

  if (erros.length) {
    throw new Error(erros.join('\n'));
  }

  for (const passo of plano) {
    const res = await fetch('/api/estoque/movimentar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produtoId: passo.produtoId,
        tipo: 'saida',
        endereco: passo.endereco,
        quantidade: passo.quantidade
      })
    });

    let data = {};
    try {
      data = await res.json();
    } catch {}

    if (!res.ok) {
      throw new Error(data.message || `Erro ao baixar estoque do item ${passo.itemLabel} no endereço ${passo.endereco}.`);
    }
  }
}

function renderSeparacao(){

  const root = document.getElementById('separacao-root');
  if(!root) return;

  const pedidos = getPedidos();

  const pendentes = pedidos.filter(p => p.status === 'Aguardando Separação');
  const andamento = pedidos.filter(p => p.status === 'Em Separação');
  const concluidos = pedidos.filter(p => p.status === 'Concluído');

  root.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;">
      ${renderColuna('Pendentes', pendentes, 'pendente')}
      ${renderColuna('Em Separação', andamento, 'andamento')}
      ${renderColuna('Concluídos', concluidos, 'concluido')}
    </div>
  `;
}

function renderColuna(titulo, lista, modo){
  return `
    <div style="background:#223754;padding:15px;border-radius:14px;">
      <h3 style="color:#fff;margin-bottom:10px;">${titulo}</h3>
      ${
        lista.length === 0
        ? `<p style="color:#cbd5e1;">Nenhum pedido</p>`
        : lista.map(p => renderCard(p, modo)).join('')
      }
    </div>
  `;
}

function renderCard(pedido, modo){
  const visual = getVisualStatus(pedido.status);

  return `
    <div style="
      background:#0b1730;
      padding:12px;
      border-radius:10px;
      margin-bottom:10px;
      color:#fff;
      border:1px solid ${visual.cor};
    ">
      <div style="font-weight:800;">${pedido.id}</div>
      <div style="font-size:13px;">${pedido.cliente || '-'}</div>
      <div style="font-size:12px;color:#7fb0ff;">${(pedido.itens || []).length} itens</div>
      <div style="font-size:13px;color:${visual.cor};margin-top:4px;">${visual.icone} ${pedido.status}</div>

      ${
        modo === 'pendente'
        ? `
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            <button onclick="window.iniciarSeparacao('${pedido.id}')" style="flex:1;padding:10px;border:none;border-radius:8px;background:#f59e0b;color:#fff;font-weight:700;">Iniciar</button>
          </div>
        `
        : ''
      }

      ${
        modo === 'andamento'
        ? `
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            <button onclick="window.concluirSeparacao('${pedido.id}', this)" style="flex:1;padding:10px;border:none;border-radius:8px;background:#22c55e;color:#fff;font-weight:700;">Concluir</button>
          </div>
        `
        : ''
      }
    </div>
  `;
}

window.iniciarSeparacao = function(id){
  const pedidos = getPedidos();

  pedidos.forEach(p => {
    if(p.id === id){
      p.status = 'Em Separação';
    }
  });

  salvarPedidos(pedidos);
  renderSeparacao();
};

window.concluirSeparacao = async function(id, botao){
  const pedidos = getPedidos();
  const pedido = pedidos.find(p => p.id === id);

  if (!pedido) {
    alert('Pedido não encontrado.');
    return;
  }

  const textoOriginal = botao ? botao.innerText : '';
  if (botao) {
    botao.disabled = true;
    botao.innerText = 'Baixando estoque...';
  }

  try {
    await baixarEstoquePedido(pedido);

    pedidos.forEach(p => {
      if(p.id === id){
        p.status = 'Concluído';
      }
    });

    salvarPedidos(pedidos);
    renderSeparacao();
    alert('Separação concluída e estoque baixado com sucesso.');
  } catch (erro) {
    alert(erro.message || 'Erro ao concluir a separação com baixa de estoque.');
  } finally {
    if (botao) {
      botao.disabled = false;
      botao.innerText = textoOriginal || 'Concluir';
    }
  }
};

window.renderSeparacao = renderSeparacao;

})();
