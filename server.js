const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());

// =========================
// MOVIMENTAÇÃO DE ESTOQUE
// =========================
app.post("/api/estoque/movimentar", (req, res) => {
  const { produtoId, tipo, quantidade, endereco, origem, destino } = req.body;

  let estoque = JSON.parse(fs.readFileSync("data/estoque.json"));
  let movimentacoes = JSON.parse(fs.readFileSync("data/movimentacoes.json"));

  const qtd = Number(quantidade);

  // ===== ENTRADA =====
  if (tipo === "entrada") {
    const index = estoque.findIndex(e => e.produtoId == produtoId && e.endereco == endereco);

    if (index >= 0) {
      estoque[index].quantidade += qtd;
    } else {
      estoque.push({ produtoId, endereco, quantidade: qtd });
    }
  }

  // ===== SAÍDA =====
  else if (tipo === "saida") {
    const index = estoque.findIndex(e => e.produtoId == produtoId && e.endereco == endereco);

    if (index >= 0) {
      estoque[index].quantidade -= qtd;

      if (estoque[index].quantidade < 0) {
        estoque[index].quantidade = 0;
      }
    }
  }

  // ===== AJUSTE =====
  else if (tipo === "ajuste") {
    const index = estoque.findIndex(e => e.produtoId == produtoId && e.endereco == endereco);

    if (index >= 0) {
      estoque[index].quantidade = qtd;
    } else {
      estoque.push({ produtoId, endereco, quantidade: qtd });
    }
  }

  // ===== TRANSFERÊNCIA =====
  else if (tipo === "transferencia") {
    const origemIndex = estoque.findIndex(e => e.produtoId == produtoId && e.endereco == origem);
    const destinoIndex = estoque.findIndex(e => e.produtoId == produtoId && e.endereco == destino);

    if (origemIndex >= 0) {
      estoque[origemIndex].quantidade -= qtd;
    }

    if (destinoIndex >= 0) {
      estoque[destinoIndex].quantidade += qtd;
    } else {
      estoque.push({ produtoId, endereco: destino, quantidade: qtd });
    }
  }

  // ===== SALVAR MOVIMENTAÇÃO (SEM ALTERAR TIPO) =====
  movimentacoes.push({
    id: Date.now(),
    produtoId,
    tipo,
    quantidade: qtd,
    endereco: endereco || null,
    origem: origem || null,
    destino: destino || null,
    data: new Date()
  });

  fs.writeFileSync("data/estoque.json", JSON.stringify(estoque, null, 2));
  fs.writeFileSync("data/movimentacoes.json", JSON.stringify(movimentacoes, null, 2));

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
