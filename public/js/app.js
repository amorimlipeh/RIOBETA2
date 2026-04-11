
// ===============================
// SISTEMA GLOBAL DE NAVEGAÇÃO
// ===============================

const content = document.getElementById("app-content") || document.body;

// ===============================
// CARREGAR MÓDULO
// ===============================
async function carregarModulo(nome){

    try{

        console.log("Carregando módulo:", nome);

        const res = await fetch(`/modules/${nome}.html?v=` + Date.now());

        if(!res.ok){
            throw new Error("Módulo não encontrado: " + nome);
        }

        const html = await res.text();

        content.innerHTML = html;

        // executa JS do módulo (se existir)
        try{
            await import(`/js/modules/${nome}.js?v=` + Date.now());
        }catch(e){
            console.warn("Sem JS para módulo:", nome);
        }

    }catch(e){

        console.error("Erro ao carregar módulo:", e);

        content.innerHTML = `
            <div style="padding:20px;color:#fff">
                <h2>⚠️ Erro ao carregar módulo</h2>
                <p>${e.message}</p>
            </div>
        `;
    }
}

// ===============================
// MENU CLIQUE
// ===============================
document.querySelectorAll("[data-module]").forEach(btn=>{
    btn.addEventListener("click",()=>{
        const modulo = btn.getAttribute("data-module");
        carregarModulo(modulo);
    });
});

// ===============================
// INICIALIZAÇÃO
// ===============================
window.onload = ()=>{
    carregarModulo("dashboard");
};

