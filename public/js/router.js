window.openModule = async function(moduleName) {
  APP_STATE.module = moduleName;
  document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
  const active = document.querySelector(`[data-module="${moduleName}"]`);
  if (active) active.classList.add('active');
  byId('module-title').innerText = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
  renderModule(moduleName);
};
