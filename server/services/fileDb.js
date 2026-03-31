const fs = require("fs");
const path = require("path");
const paths = require("../config/paths");

function ensureFile(name, fallback) {
  if (!fs.existsSync(paths.data)) fs.mkdirSync(paths.data, { recursive: true });
  const filePath = path.join(paths.data, name);
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
  return filePath;
}
function read(name, fallback = []) {
  return JSON.parse(fs.readFileSync(ensureFile(name, fallback), "utf-8"));
}
function write(name, data) {
  fs.writeFileSync(ensureFile(name, []), JSON.stringify(data, null, 2));
  return data;
}
module.exports = { ensureFile, read, write };
