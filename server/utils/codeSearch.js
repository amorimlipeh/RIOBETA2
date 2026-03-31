module.exports = (itens=[], termo='') => itens.filter(i => JSON.stringify(i).toLowerCase().includes(String(termo).toLowerCase()));
