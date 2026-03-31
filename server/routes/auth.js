const router = require("express").Router();
const { read } = require("../services/fileDb");
const { DEFAULT_USER } = require("../config/constants");

router.post("/login", (req, res) => {
  const { usuario, senha } = req.body || {};
  const usuarios = read("usuarios.json", [DEFAULT_USER]);
  const found = usuarios.find(u => u.usuario === usuario && u.senha === senha);
  if (!found) return res.status(401).json({ ok: false, erro: "Login inválido" });
  res.json({ ok: true, usuario: found.usuario, perfil: found.perfil || "admin" });
});

module.exports = router;
