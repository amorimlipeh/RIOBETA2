const express = require("express");
const path = require("path");
const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

const routes = [
  ["auth", require("./routes/auth")],
  ["dashboard", require("./routes/dashboard")],
  ["produtos", require("./routes/produtos")],
  ["estoque", require("./routes/estoque")],
  ["wms", require("./routes/wms")],
  ["picking", require("./routes/picking")],
  ["pedidos", require("./routes/pedidos")],
  ["separacao", require("./routes/separacao")],
  ["containers", require("./routes/containers")],
  ["importacao", require("./routes/importacao")],
  ["scanner", require("./routes/scanner")],
  ["ia", require("./routes/ia")],
  ["notificacoes", require("./routes/notificacoes")],
  ["mensagens", require("./routes/mensagens")],
  ["usuarios", require("./routes/usuarios")],
  ["empresas", require("./routes/empresas")],
  ["admin", require("./routes/admin")],
  ["developer", require("./routes/developer")],
  ["logs", require("./routes/logs")],
  ["configuracoes", require("./routes/configuracoes")],
  ["health", require("./routes/health")]
];

for (const [name, router] of routes) {
  app.use(`/api/${name}`, router);
}

app.get("/api/status", (req, res) => {
  res.json({ ok: true, sistema: "RIOBETA2 BASE COMPLETA FINAL V1" });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

module.exports = app;
