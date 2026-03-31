window.login = async function() {
  const usuario = byId('usuario').value;
  const senha = byId('senha').value;
  const resp = await API.post('/api/auth/login', { usuario, senha });
  if (!resp.ok) {
    byId('login-msg').innerText = resp.erro || 'Erro no login';
    return;
  }
  APP_STATE.user = resp;
  byId('login-screen').classList.add('hidden');
  byId('app-screen').classList.remove('hidden');
  renderMenu();
  renderCards();
  renderModule(APP_STATE.module);
};

window.logout = function() {
  location.reload();
};
