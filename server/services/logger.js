const { read, write } = require("./fileDb");
function log(modulo, acao, detalhe = {}) {
  const logs = read("logs.json", []);
  logs.unshift({ id: Date.now(), modulo, acao, detalhe, data: new Date().toISOString() });
  write("logs.json", logs);
}
module.exports = { log };
