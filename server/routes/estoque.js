const router = require("express").Router();
const { read, write } = require("../services/fileDb");
const { log } = require("../services/logger");
const FILE = "estoque.json";

router.get("/", (req, res) => {
  res.json(read(FILE, []));
});

router.post("/", (req, res) => {
  const items = read(FILE, []);
  const novo = { id: Date.now(), ...req.body };
  items.unshift(novo);
  write(FILE, items);
  log("estoque", "create", novo);
  res.json({ ok: true, item: novo });
});

module.exports = router;


/* ===== MODAL ESCOLHA DE EDIÇÃO ===== */
let itemSelecionadoEdicao = null;

function abrirModalEscolhaEdicao(item){
    itemSelecionadoEdicao = item;
    const modal = document.getElementById("modalEscolhaEdicao");
    if(modal) modal.classList.remove("hidden");
}

function fecharModalEscolhaEdicao(){
    const modal = document.getElementById("modalEscolhaEdicao");
    if(modal) modal.classList.add("hidden");
}

function editarMovimentacaoSelecionada(){
    const item = itemSelecionadoEdicao;
    fecharModalEscolhaEdicao();

    if(!item) return;

    if(typeof abrirFormularioEditarMovimentacao === "function"){
        return abrirFormularioEditarMovimentacao(item);
    }
    if(typeof editarMovimentacao === "function"){
        return editarMovimentacao(item);
    }
    if(typeof editarItem === "function"){
        return editarItem(item);
    }

    console.warn("Nenhuma função de edição de movimentação encontrada.");
}

function editarTransferenciaSelecionada(){
    const item = itemSelecionadoEdicao;
    fecharModalEscolhaEdicao();

    if(!item) return;

    if(typeof abrirFormularioEditarTransferencia === "function"){
        return abrirFormularioEditarTransferencia(item);
    }
    if(typeof editarTransferencia === "function"){
        return editarTransferencia(item);
    }
    if(typeof editarItem === "function"){
        return editarItem(item);
    }

    console.warn("Nenhuma função de edição de transferência encontrada.");
}

document.addEventListener("click", function(e){
    const modal = document.getElementById("modalEscolhaEdicao");
    if(e.target === modal){
        fecharModalEscolhaEdicao();
    }
});
