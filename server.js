const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// =========================
// SERVIR FRONTEND
// =========================
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =========================
// HELPERS
// =========================
const readJSON = (file) => JSON.parse(fs.readFileSync(file));
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// =========================
// PRODUTOS
// =========================
app.get("/api/produtos", (req, res) => {
  const produtos = readJSON("data/produtos.json");
  res.json(produtos);
});

// =========================
// ESTOQUE
// =========================
app.get("/api/estoque", (req, res) => {
  const estoque = readJSON("data/estoque.json");
  res.json(estoque);
});

// =========================
// MOVIMENTAÇÃO
// =========================
app.post("/api/estoque/movimentar", (req, res) => {
  const { produtoId, tipo, quantidade, endereco, origem, destino } = req.body;

  let estoque = readJSON("data/estoque.json");
  let movimentacoes = readJSON("data/movimentacoes.json");

  const qtd = Number(quantidade);

  // ===== ENTRADA =====
  if (tipo === "entrada") {
    const i = estoque.findIndex(e => e.produtoId == produtoId && e.endereco == endereco);

    if (i >= 0) estoque[i].quantidade += qtd;
    else estoque.push({ produtoId, endereco, quantidade: qtd });
  }

  // ===== SAÍDA =====
  else if (tipo === "saida") {
    const i = estoque.findIndex(e => e.produtoId == produtoId && e.endereco == endereco);

    if (i >= 0) {
      estoque[i].quantidade -= qtd;
      if (estoque[i].quantidade < 0) estoque[i].quantidade = 0;
    }
  }

  // ===== AJUSTE =====
  else if (tipo === "ajuste") {
    const i = estoque.findIndex(e => e.produtoId == produtoId && e.endereco == endereco);

    if (i >= 0) estoque[i].quantidade = qtd;
    else estoque.push({ produtoId, endereco, quantidade: qtd });
  }

  // ===== TRANSFERÊNCIA (CORRETA) =====
  else if (tipo === "transferencia") {

    const origemIndex = estoque.findIndex(e => e.produtoId == produtoId && e.endereco == origem);
    const destinoIndex = estoque.findIndex(e => e.produtoId == produtoId && e.endereco == destino);

    if (origemIndex >= 0) {
      estoque[origemIndex].quantidade -= qtd;
      if (estoque[origemIndex].quantidade < 0) estoque[origemIndex].quantidade = 0;
    }

    if (destinoIndex >= 0) {
      estoque[destinoIndex].quantidade += qtd;
    } else {
      estoque.push({ produtoId, endereco: destino, quantidade: qtd });
    }
  }

  // ===== SALVAR MOVIMENTAÇÃO =====
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

  writeJSON("data/estoque.json", estoque);
  writeJSON("data/movimentacoes.json", movimentacoes);

  res.json({ ok: true });
});

// =========================
// PORTA RAILWAY
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
