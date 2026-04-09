window.abrirModalEscolhaEdicao = function(id){

    const modalExistente = document.getElementById("modalEscolhaEdicao");
    if(modalExistente) modalExistente.remove();

    const modal = document.createElement("div");
    modal.id = "modalEscolhaEdicao";

    modal.innerHTML = `
        <div class="modal-escolha-bg">
            <div class="modal-escolha-box">
                <h2>Escolha o tipo de edição</h2>
                <p>O que deseja editar?</p>

                <button onclick="editarMovimentacaoDireta(${id})">
                    Movimentação
                </button>

                <button onclick="editarTransferenciaDireta(${id})">
                    Transferência
                </button>

                <button onclick="fecharModalEscolhaEdicao()" class="cancelar">
                    Cancelar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

window.fecharModalEscolhaEdicao = function(){
    document.getElementById("modalEscolhaEdicao")?.remove();
}
