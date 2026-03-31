const router = require("express").Router();
const { read, write } = require("../services/fileDb");
const { log } = require("../services/logger");
const FILE = "empresas.json";

router.get("/", (req, res) => {
  res.json(read(FILE, []));
});

router.post("/", (req, res) => {
  const items = read(FILE, []);
  const novo = { id: Date.now(), ...req.body };
  items.unshift(novo);
  write(FILE, items);
  log("empresas", "create", novo);
  res.json({ ok: true, item: novo });
});

module.exports = router;
