let produtos = [];

async function carregarProdutos(){
    const res = await fetch('/api/produtos');
    produtos = await res.json();
    renderProdutos(produtos);
    atualizarKPIs();
}

function gerarSKU(){
    return 'SKU-'+Math.floor(Math.random()*999999);
}

async function salvarProduto(){
    const payload={
        codigo:document.getElementById('codigo').value,
        nome:document.getElementById('nome').value,
        categoria:document.getElementById('categoria').value,
        quantidade:Number(document.getElementById('quantidade').value),
        fator:Number(document.getElementById('fator').value),
        sku:document.getElementById('sku').value || gerarSKU(),
        imagem:document.getElementById('imagem').value
    };

    await fetch('/api/produtos',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
    });

    limparFormulario();
    carregarProdutos();
}

async function excluirProduto(id){
    await fetch('/api/produtos/'+id,{method:'DELETE'});
    carregarProdutos();
}

function renderProdutos(lista){
    const tbody=document.getElementById('produtosTabela');
    tbody.innerHTML='';

    lista.forEach((p,index)=>{
        tbody.innerHTML+=`
        <tr>
            <td>${p.codigo}</td>
            <td>${p.nome}</td>
            <td>${p.categoria}</td>
            <td>${p.quantidade}</td>
            <td>${p.fator}</td>
            <td>${p.sku}</td>
            <td>
                ${p.imagem ? `<img src="${p.imagem}" width="40">` : '-'}
            </td>
            <td>
                <button onclick="excluirProduto(${index})">Excluir</button>
            </td>
        </tr>`;
    });
}

function filtrarProdutos(){
    const termo=document.getElementById('pesquisaProduto').value.toLowerCase();

    const filtrados=produtos.filter(p=>
        p.nome.toLowerCase().includes(termo) ||
        p.codigo.toLowerCase().includes(termo) ||
        p.sku.toLowerCase().includes(termo)
    );

    renderProdutos(filtrados);
}

function atualizarKPIs(){
    document.getElementById('kpiTotalProdutos').innerText=produtos.length;

    const totalQtd=produtos.reduce((a,b)=>a+b.quantidade,0);
    document.getElementById('kpiQtdTotal').innerText=totalQtd;
}

function limparFormulario(){
    document.querySelectorAll('input').forEach(i=>i.value='');
}

carregarProdutos();
