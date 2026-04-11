(() => {
  const STORAGE_KEY = 'pedidosSalvosMemoria';
  const SAMPLE_PRODUCTS = [
    { codigo: 'TST001', nome: 'Caixa Organizadora Média', fator: 12, imagem: '' },
    { codigo: 'TST002', nome: 'Plástico Bolha Premium', fator: 10, imagem: '' },
    { codigo: 'TST003', nome: 'Etiqueta Logística', fator: 20, imagem: '' },
    { codigo: 'TST004', nome: 'Papel Kraft Bobina', fator: 15, imagem: '' },
    { codigo: 'TST005', nome: 'Fita Adesiva Transparente', fator: 6, imagem: '' }
  ];

  const state = {
    produtos: [],
    pedidos: [],
    itensPedidoAtual: [],
    editandoPedidoIndex: null,
    filtroProduto: '',
    selecionadosProdutos: new Map(),
    modalItemIndex: null,
  };

  function text(v) {
    return String(v ?? '').trim();
  }

  function norm(v) {
    return text(v)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function getCodigo(p) {
    return text(p.codigo || p.code || p.sku || p.id || '');
  }

  function getNome(p) {
    return text(p.nome || p.name || p.descricao || 'Produto');
  }

  function getFator(p) {
    const v = Number(p.fator || p.fatorConversao || p.fator_conversao || p.caixa || 1);
    return Number.isFinite(v) && v > 0 ? v : 1;
  }

  function getImagem(p) {
    return text(p.imagem || p.image || p.foto || '');
  }

  function computeItem(product, input = {}) {
    const fator = Number(input.fator || getFator(product) || 1) || 1;
    const caixas = Math.max(0, Number(input.caixas || 0) || 0);
    const avulsas = Math.max(0, Number(input.avulsas || 0) || 0);
    const totalUnd = caixas * fator + avulsas;
    return {
      codigo: text(input.codigo || getCodigo(product)),
      nome: text(input.nome || getNome(product)),
      fator,
      caixas,
      avulsas,
      totalUnd,
      imagem: text(input.imagem || getImagem(product)),
      resumo: `${caixas} CX | ${totalUnd} UND`,
      detalhe: `Fator: ${fator} | Avulsas: ${avulsas}`,
    };
  }

  function blankOrderForm() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return {
      cliente: '',
      representante: '',
      data: `${yyyy}-${mm}-${dd}`,
      numero: '',
    };
  }

  function root() {
    return document.getElementById('pedidos-root');
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.pedidos));
  }

  function loadOrders() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      state.pedidos = Array.isArray(parsed) ? parsed : [];
    } catch {
      state.pedidos = [];
    }
  }

  async function loadProducts() {
    const sources = ['/api/produtos', '/data/produtos.json'];
    for (const src of sources) {
      try {
        const response = await fetch(src, { cache: 'no-store' });
        if (!response.ok) continue;
        const json = await response.json();
        const list = Array.isArray(json) ? json : (Array.isArray(json.produtos) ? json.produtos : []);
        if (list.length) {
          state.produtos = list;
          return;
        }
      } catch {}
    }
    state.produtos = SAMPLE_PRODUCTS;
  }

  function currentFormValues() {
    return {
      cliente: document.getElementById('pedidoCliente')?.value || '',
      representante: document.getElementById('pedidoRepresentante')?.value || '',
      data: document.getElementById('pedidoData')?.value || blankOrderForm().data,
      numero: document.getElementById('pedidoNumero')?.value || '',
    };
  }

  function setFormValues(values = {}) {
    const merged = { ...blankOrderForm(), ...values };
    const map = {
      pedidoCliente: merged.cliente,
      pedidoRepresentante: merged.representante,
      pedidoData: merged.data,
      pedidoNumero: merged.numero,
    };
    Object.entries(map).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.value = value || '';
    });
  }

  function clearEditingState() {
    state.editandoPedidoIndex = null;
    state.itensPedidoAtual = [];
    state.modalItemIndex = null;
    state.selecionadosProdutos.clear();
    state.filtroProduto = '';
  }

  function escapeHtml(value) {
    return text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function itemThumb(imagem) {
    if (imagem) {
      return `<img src="${escapeHtml(imagem)}" style="width:56px;height:56px;object-fit:cover;border-radius:12px;">`;
    }
    return `<div style="width:56px;height:56px;border-radius:12px;background:#2f6df6;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;">IMG</div>`;
  }

  function renderShell() {
    const el = root();
    if (!el) return;

    const form = currentFormValues();
    const editing = state.editandoPedidoIndex !== null;
    const editingTitle = editing && state.pedidos[state.editandoPedidoIndex]
      ? `✏️ Editando ${escapeHtml(state.pedidos[state.editandoPedidoIndex].id || '')}`
      : '';

    el.innerHTML = `
      <div id="pedidosV3Base" style="margin-top:20px;display:flex;flex-direction:column;gap:16px;">
        <div id="pedidosSubgridTopo" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;">
          <div style="background:linear-gradient(180deg,#23344d,#1b2940);padding:20px;border-radius:18px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;">
              <h2 style="color:white;margin:0 0 20px 0;">Novo Pedido</h2>
              ${editing ? `<div style="background:#f59e0b;color:#fff;padding:8px 12px;border-radius:999px;font-weight:800;font-size:12px;">${editingTitle}</div>` : ''}
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
              <input id="pedidoCliente" placeholder="Cliente" class="form-control" value="${escapeHtml(form.cliente)}">
              <input id="pedidoRepresentante" placeholder="Representante" class="form-control" value="${escapeHtml(form.representante)}">
              <input id="pedidoData" type="date" class="form-control" value="${escapeHtml(form.data)}">
              <input id="pedidoNumero" placeholder="Nº Pedido" class="form-control" value="${escapeHtml(form.numero)}">
            </div>

            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:15px;">
              <button id="btnAdicionarProdutoPedido" style="flex:1;min-width:180px;background:#2563eb;color:#fff;border:none;padding:14px;border-radius:12px;font-weight:bold;">
                + Adicionar Produto
              </button>
              ${editing ? `<button id="btnCancelarEdicaoPedido" style="min-width:160px;background:#64748b;color:#fff;border:none;padding:14px;border-radius:12px;font-weight:700;">Cancelar Edição</button>` : ''}
            </div>
          </div>

          <div id="painelPedidosSalvos" style="background:#223754;padding:18px;border-radius:18px;">
            <h3 style="margin:0 0 15px 0;color:#fff;">📋 Pedidos Salvos</h3>
            <div id="listaPedidosSalvos" style="display:flex;flex-direction:column;gap:12px;"></div>
          </div>
        </div>

        <div style="background:linear-gradient(180deg,#23344d,#1b2940);padding:20px;border-radius:18px;">
          <h3 style="color:white;margin-bottom:15px;">Itens do Pedido</h3>
          <div id="listaItensPedido" style="display:flex;flex-direction:column;gap:12px;"></div>
          <div id="pedidoFooterAcoes" style="margin-top:14px;display:none;">
            <button id="btnSalvarPedidoFinal" style="width:100%;padding:14px;border:none;border-radius:10px;background:${editing ? '#f59e0b' : '#22c55e'};color:#fff;font-weight:800;cursor:pointer;">
              ${editing ? 'Salvar Alterações' : 'Salvar Pedido'}
            </button>
          </div>
        </div>
      </div>
    `;

    bindMainEvents();
    renderSavedOrders();
    renderCurrentItems();
    ensureModals();
  }

  function renderSavedOrders() {
    const list = document.getElementById('listaPedidosSalvos');
    if (!list) return;
    list.innerHTML = '';

    if (!state.pedidos.length) {
      list.innerHTML = '<p style="color:#cbd5e1;">Nenhum pedido salvo ainda.</p>';
      return;
    }

    state.pedidos.forEach((pedido, index) => {
      const editing = state.editandoPedidoIndex === index;
      const card = document.createElement('div');
      card.style.background = editing ? '#2d4669' : '#162742';
      card.style.padding = '14px';
      card.style.borderRadius = '12px';
      card.style.border = editing ? '2px solid #f59e0b' : '1px solid transparent';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap;">
          <div>
            <div style="color:#fff;font-weight:700;">${escapeHtml(pedido.id)}</div>
            <div style="color:#dbe7ff;font-size:13px;margin-top:4px;">${escapeHtml(pedido.cliente || 'Sem cliente')}${pedido.numero ? ' • Nº ' + escapeHtml(pedido.numero) : ''}</div>
            <div style="color:#facc15;font-size:13px;margin-top:4px;">🟡 ${escapeHtml(pedido.status || 'Aguardando Separação')}</div>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:flex-end;">
            ${editing ? `
              <div style="background:#f59e0b;color:#fff;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800;">✏️ Em edição</div>
              <button
                data-action="adicionar-produto-edicao"
                data-index="${index}"
                style="border:none;background:#22c55e;color:#fff;padding:10px 14px;border-radius:8px;font-weight:700;cursor:pointer;">
                ＋ Adicionar Produto
              </button>
            ` : ''}
          </div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
          <button data-action="abrir" data-index="${index}" style="flex:1;border:none;background:#2f6df6;color:#fff;padding:10px;border-radius:8px;font-weight:700;">Abrir</button>
          <button data-action="editar" data-index="${index}" style="flex:1;border:none;background:#f59e0b;color:#fff;padding:10px;border-radius:8px;font-weight:700;">Editar</button>
          <button data-action="cancelar" data-index="${index}" style="flex:1;border:none;background:#ef4444;color:#fff;padding:10px;border-radius:8px;font-weight:700;">Cancelar</button>
        </div>
      `;
      list.appendChild(card);
    });
  }

  function renderCurrentItems() {
    const list = document.getElementById('listaItensPedido');
    const footer = document.getElementById('pedidoFooterAcoes');
    if (!list || !footer) return;

    list.innerHTML = '';

    if (!state.itensPedidoAtual.length) {
      list.innerHTML = '<p style="color:#cbd5e1;">Nenhum item adicionado.</p>';
      footer.style.display = 'none';
      return;
    }

    state.itensPedidoAtual.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'pedido-item-card-real';
      card.style.display = 'grid';
      card.style.gridTemplateColumns = '56px 1fr auto';
      card.style.gap = '10px';
      card.style.alignItems = 'center';
      card.style.background = '#162742';
      card.style.padding = '10px';
      card.style.borderRadius = '12px';
      card.innerHTML = `
        ${itemThumb(item.imagem)}
        <div style="display:flex;flex-direction:column;gap:4px;color:#fff;">
          <div style="font-weight:800;">${escapeHtml(item.codigo)}</div>
          <div style="color:#dbe7ff;">${escapeHtml(item.nome)}</div>
          <div style="color:#7fb0ff;font-size:12px;">${escapeHtml(item.resumo)}</div>
          <div style="color:#7fb0ff;font-size:12px;">${escapeHtml(item.detalhe)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;min-width:120px;">
          <button data-action="editar-item" data-index="${index}" style="border:none;background:#2f6df6;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;">✏️ Editar Item</button>
          <button data-action="excluir-item" data-index="${index}" style="border:none;background:#ef4444;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;">🗑 Excluir</button>
        </div>
      `;
      list.appendChild(card);
    });

    footer.style.display = 'block';
  }

  function filteredProducts() {
    const termo = norm(state.filtroProduto);
    return state.produtos.filter((produto) => {
      const codigo = norm(getCodigo(produto));
      const nome = norm(getNome(produto));
      return !termo || codigo.includes(termo) || nome.includes(termo);
    });
  }

  function ensureModals() {
    ensureProductModal();
    ensureItemModal();
    ensureViewModal();
  }

  function ensureProductModal() {
    if (document.getElementById('modalProdutoPedido')) return;
    const modal = document.createElement('div');
    modal.id = 'modalProdutoPedido';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `
      <div style="width:100%;max-width:620px;background:#162742;border-radius:18px;padding:20px;box-shadow:0 0 30px rgba(0,0,0,.45);max-height:85vh;overflow:auto;">
        <h3 style="color:#fff;margin:0 0 14px 0;">Adicionar Produto</h3>
        <input id="pesquisaProdutoPedido" type="text" placeholder="Pesquisar produto..." style="width:100%;padding:14px;border:none;border-radius:10px;margin-bottom:14px;background:#0b1730;color:#fff;outline:none;">
        <div id="listaBuscaProdutosPedido" style="display:flex;flex-direction:column;gap:8px;"></div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;">
          <button id="btnCancelarProdutoPedido" style="padding:12px 18px;border:none;border-radius:10px;background:#475569;color:#fff;font-weight:700;cursor:pointer;">Cancelar</button>
          <button id="btnConfirmarProdutoPedido" style="padding:12px 18px;border:none;border-radius:10px;background:#2f6df6;color:#fff;font-weight:700;cursor:pointer;">Adicionar Selecionados</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeProductModal();
    });
    document.getElementById('btnCancelarProdutoPedido')?.addEventListener('click', closeProductModal);
    document.getElementById('btnConfirmarProdutoPedido')?.addEventListener('click', confirmSelectedProducts);
    document.getElementById('pesquisaProdutoPedido')?.addEventListener('input', (e) => {
      state.filtroProduto = e.target.value || '';
      renderProductSearchList();
    });
  }

  function ensureItemModal() {
    if (document.getElementById('modalEditarItemPedido')) return;
    const modal = document.createElement('div');
    modal.id = 'modalEditarItemPedido';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:100000;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `
      <div style="width:100%;max-width:420px;background:#162742;border-radius:18px;padding:20px;max-height:85vh;overflow:auto;">
        <h3 style="color:#fff;margin:0 0 8px 0;">Editar Item</h3>
        <div id="modalEditarItemTitulo" style="color:#dbe7ff;margin-bottom:16px;"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <label style="color:#fff;display:flex;flex-direction:column;gap:6px;">Caixas
            <input id="editarItemCaixas" type="number" min="0" class="form-control">
          </label>
          <label style="color:#fff;display:flex;flex-direction:column;gap:6px;">Avulsas
            <input id="editarItemAvulsas" type="number" min="0" class="form-control">
          </label>
        </div>
        <div id="editarItemResumo" style="color:#9ec5ff;font-size:13px;margin-top:12px;"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;">
          <button id="btnRemoverItemModal" style="flex:1;padding:12px;border:none;border-radius:10px;background:#ef4444;color:#fff;font-weight:700;">Remover Item</button>
          <button id="btnSalvarItemModal" style="flex:1;padding:12px;border:none;border-radius:10px;background:#2f6df6;color:#fff;font-weight:700;">Salvar Item</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeItemModal();
    });
    document.getElementById('btnSalvarItemModal')?.addEventListener('click', saveItemEdition);
    document.getElementById('btnRemoverItemModal')?.addEventListener('click', removeItemFromModal);
    ['editarItemCaixas', 'editarItemAvulsas'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', updateItemModalSummary);
    });
  }

  function ensureViewModal() {
    if (document.getElementById('modalPedidoVisualizacao')) return;
    const modal = document.createElement('div');
    modal.id = 'modalPedidoVisualizacao';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:999999;padding:20px;align-items:center;justify-content:center;';
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeViewModal();
    });
  }

  function openProductModal() {
    const modal = document.getElementById('modalProdutoPedido');
    if (!modal) return;
    state.filtroProduto = '';
    state.selecionadosProdutos.clear();
    const input = document.getElementById('pesquisaProdutoPedido');
    if (input) input.value = '';
    renderProductSearchList();
    modal.style.display = 'flex';
    input?.focus();
  }

  function closeProductModal() {
    const modal = document.getElementById('modalProdutoPedido');
    if (modal) modal.style.display = 'none';
  }

  function renderProductSearchList() {
    const list = document.getElementById('listaBuscaProdutosPedido');
    if (!list) return;
    const products = filteredProducts();
    if (!products.length) {
      list.innerHTML = '<div style="color:#cbd5e1;padding:8px 2px;">Nenhum produto encontrado.</div>';
      return;
    }

    list.innerHTML = products.map((produto, idx) => {
      const key = `${getCodigo(produto)}__${idx}`;
      const selected = state.selecionadosProdutos.get(key) || { checked: false, caixas: 1, tipo: 'cx' };
      return `
        <div style="background:#0b1730;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:10px;">
          <div style="display:grid;grid-template-columns:30px 52px 1fr;gap:10px;align-items:center;">
            <input type="checkbox" data-key="${escapeHtml(key)}" class="pedidoSelectProduto" ${selected.checked ? 'checked' : ''} style="width:20px;height:20px;">
            ${itemThumb(getImagem(produto)).replace('56px','52px')}
            <div>
              <div style="color:#fff;font-weight:800;font-size:13px;">${escapeHtml(getCodigo(produto))}</div>
              <div style="color:#dbe7ff;font-size:14px;">${escapeHtml(getNome(produto))}</div>
              <div style="color:#7fb0ff;font-size:12px;">Fator: ${getFator(produto)}</div>
            </div>
          </div>
          <div style="display:flex;gap:10px;">
            <input type="number" min="1" value="${selected.caixas}" data-key="${escapeHtml(key)}" class="pedidoQtdProduto form-control" style="flex:1;">
            <select data-key="${escapeHtml(key)}" class="pedidoTipoProduto form-control" style="width:90px;">
              <option value="cx" ${selected.tipo === 'cx' ? 'selected' : ''}>CX</option>
              <option value="und" ${selected.tipo === 'und' ? 'selected' : ''}>UND</option>
            </select>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.pedidoSelectProduto').forEach((el) => {
      el.addEventListener('change', (e) => {
        const key = e.target.dataset.key;
        const prev = state.selecionadosProdutos.get(key) || { caixas: 1, tipo: 'cx' };
        state.selecionadosProdutos.set(key, { ...prev, checked: e.target.checked });
      });
    });

    list.querySelectorAll('.pedidoQtdProduto').forEach((el) => {
      el.addEventListener('input', (e) => {
        const key = e.target.dataset.key;
        const prev = state.selecionadosProdutos.get(key) || { checked: false, tipo: 'cx' };
        state.selecionadosProdutos.set(key, { ...prev, caixas: Math.max(1, Number(e.target.value || 1) || 1) });
      });
    });

    list.querySelectorAll('.pedidoTipoProduto').forEach((el) => {
      el.addEventListener('change', (e) => {
        const key = e.target.dataset.key;
        const prev = state.selecionadosProdutos.get(key) || { checked: false, caixas: 1 };
        state.selecionadosProdutos.set(key, { ...prev, tipo: e.target.value || 'cx' });
      });
    });
  }

  function confirmSelectedProducts() {
    const products = filteredProducts();
    const entries = [...state.selecionadosProdutos.entries()].filter(([, value]) => value.checked);
    if (!entries.length) {
      alert('Selecione ao menos um produto.');
      return;
    }

    entries.forEach(([key, value]) => {
      const idx = Number(key.split('__').pop());
      const produto = products[idx];
      if (!produto) return;
      const fator = getFator(produto);
      const quantidade = Math.max(1, Number(value.caixas || 1) || 1);
      const tipo = value.tipo || 'cx';
      const item = tipo === 'und'
        ? computeItem(produto, { caixas: Math.floor(quantidade / fator), avulsas: quantidade % fator })
        : computeItem(produto, { caixas: quantidade, avulsas: 0 });
      state.itensPedidoAtual.push(item);
    });

    closeProductModal();
    renderCurrentItems();
  }

  function openViewModal(index) {
    const pedido = state.pedidos[index];
    if (!pedido) return;
    const modal = document.getElementById('modalPedidoVisualizacao');
    if (!modal) return;
    modal.innerHTML = `
      <div style="background:#13233d;padding:25px;border-radius:15px;width:90%;max-width:540px;max-height:85vh;overflow:auto;box-sizing:border-box;margin:auto;">
        <div style="color:#fff;font-size:22px;font-weight:800;margin-bottom:18px;">Pedido ${escapeHtml(pedido.id || '')}</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${(pedido.itens || []).map((item) => `
            <div style="background:#0f2038;border-radius:12px;padding:14px;color:#fff;">
              <div style="font-weight:800;">${escapeHtml(item.codigo || '')}</div>
              <div>${escapeHtml(item.nome || '')}</div>
              <div style="color:#9ec5ff;font-size:13px;">${escapeHtml(item.resumo || ((item.caixas || 0) + ' CX | ' + (item.totalUnd || 0) + ' UND'))}</div>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:18px;">
          <button id="btnFecharVisualizacaoPedido" style="min-width:180px;padding:12px;border:none;border-radius:10px;background:#64748b;color:#fff;font-weight:700;">Fechar</button>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
    document.getElementById('btnFecharVisualizacaoPedido')?.addEventListener('click', closeViewModal);
  }

  function closeViewModal() {
    const modal = document.getElementById('modalPedidoVisualizacao');
    if (modal) modal.style.display = 'none';
  }

  function openEdit(index) {
    const pedido = state.pedidos[index];
    if (!pedido) return;
    state.editandoPedidoIndex = index;
    state.itensPedidoAtual = (pedido.itens || []).map((item) => ({ ...item }));
    setFormValues(pedido);
    renderShell();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openItemEdit(index) {
    const item = state.itensPedidoAtual[index];
    if (!item) return;
    state.modalItemIndex = index;
    const modal = document.getElementById('modalEditarItemPedido');
    if (!modal) return;
    document.getElementById('modalEditarItemTitulo').textContent = `${item.codigo} • ${item.nome}`;
    document.getElementById('editarItemCaixas').value = String(item.caixas || 0);
    document.getElementById('editarItemAvulsas').value = String(item.avulsas || 0);
    updateItemModalSummary();
    modal.style.display = 'flex';
  }

  function closeItemModal() {
    const modal = document.getElementById('modalEditarItemPedido');
    if (modal) modal.style.display = 'none';
    state.modalItemIndex = null;
  }

  function updateItemModalSummary() {
    const idx = state.modalItemIndex;
    const item = state.itensPedidoAtual[idx];
    const resumo = document.getElementById('editarItemResumo');
    if (!item || !resumo) return;
    const caixas = Math.max(0, Number(document.getElementById('editarItemCaixas')?.value || 0) || 0);
    const avulsas = Math.max(0, Number(document.getElementById('editarItemAvulsas')?.value || 0) || 0);
    const totalUnd = caixas * (item.fator || 1) + avulsas;
    resumo.textContent = `${caixas} CX | ${totalUnd} UND | Fator ${item.fator || 1}`;
  }

  function saveItemEdition() {
    const idx = state.modalItemIndex;
    const current = state.itensPedidoAtual[idx];
    if (!current) return;
    const caixas = Math.max(0, Number(document.getElementById('editarItemCaixas')?.value || 0) || 0);
    const avulsas = Math.max(0, Number(document.getElementById('editarItemAvulsas')?.value || 0) || 0);
    state.itensPedidoAtual[idx] = computeItem(current, {
      codigo: current.codigo,
      nome: current.nome,
      fator: current.fator,
      caixas,
      avulsas,
      imagem: current.imagem,
    });
    closeItemModal();
    renderCurrentItems();
  }

  function removeItemFromModal() {
    const idx = state.modalItemIndex;
    if (idx === null) return;
    state.itensPedidoAtual.splice(idx, 1);
    closeItemModal();
    renderCurrentItems();
  }

  function removeItem(index) {
    state.itensPedidoAtual.splice(index, 1);
    renderCurrentItems();
  }

  function cancelOrder(index) {
    const pedido = state.pedidos[index];
    if (!pedido) return;
    if (!confirm(`Cancelar pedido ${pedido.id}?`)) return;
    state.pedidos.splice(index, 1);
    if (state.editandoPedidoIndex === index) {
      resetOrderForm();
    } else if (state.editandoPedidoIndex !== null && state.editandoPedidoIndex > index) {
      state.editandoPedidoIndex -= 1;
    }
    persist();
    renderSavedOrders();
  }

  function resetOrderForm() {
    clearEditingState();
    setFormValues(blankOrderForm());
    renderShell();
  }

  function saveOrder() {
    if (!state.itensPedidoAtual.length) {
      alert('Adicione ao menos um item ao pedido.');
      return;
    }

    const values = currentFormValues();
    const current = state.editandoPedidoIndex !== null ? state.pedidos[state.editandoPedidoIndex] : null;
    const pedido = {
      id: current?.id || `PED-${Date.now()}`,
      cliente: values.cliente,
      representante: values.representante,
      numero: values.numero,
      data: values.data,
      status: 'Aguardando Separação',
      itens: state.itensPedidoAtual.map((item) => ({ ...item })),
    };

    if (state.editandoPedidoIndex !== null) {
      state.pedidos[state.editandoPedidoIndex] = pedido;
    } else {
      state.pedidos.unshift(pedido);
    }

    persist();
    resetOrderForm();
    alert('Pedido salvo com sucesso.');
  }

  function bindMainEvents() {
    document.getElementById('btnAdicionarProdutoPedido')?.addEventListener('click', (e) => {
      e.preventDefault();
      openProductModal();
    });

    document.getElementById('btnSalvarPedidoFinal')?.addEventListener('click', saveOrder);
    document.getElementById('btnCancelarEdicaoPedido')?.addEventListener('click', resetOrderForm);

    document.getElementById('listaPedidosSalvos')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const index = Number(btn.dataset.index);
      const action = btn.dataset.action;

      if (action === 'abrir') openViewModal(index);
      if (action === 'editar') openEdit(index);
      if (action === 'cancelar') cancelOrder(index);

      if (action === 'adicionar-produto-edicao') {
        if (state.editandoPedidoIndex !== index) {
          openEdit(index);
          setTimeout(() => openProductModal(), 150);
          return;
        }
        openProductModal();
      }
    });

    document.getElementById('listaItensPedido')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const index = Number(btn.dataset.index);
      if (btn.dataset.action === 'editar-item') openItemEdit(index);
      if (btn.dataset.action === 'excluir-item') removeItem(index);
    });
  }

  async function renderPedidos() {
    await loadProducts();
    loadOrders();
    renderShell();
  }

  function destroyPedidosUI() {
    ['modalProdutoPedido', 'modalEditarItemPedido', 'modalPedidoVisualizacao'].forEach((id) => {
      document.getElementById(id)?.remove();
    });
  }

  window.renderPedidos = renderPedidos;
  window.destroyPedidosUI = destroyPedidosUI;
})();
