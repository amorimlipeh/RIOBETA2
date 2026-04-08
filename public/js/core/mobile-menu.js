const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const menuItems = document.querySelectorAll('.menu-item');

function openMobileMenu() {
  sidebar.classList.add('sidebar-open');
  mobileOverlay.classList.add('overlay-show');
}

function closeMobileMenu() {
  sidebar.classList.remove('sidebar-open');
  mobileOverlay.classList.remove('overlay-show');
}

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    const isOpen = sidebar.classList.contains('sidebar-open');
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });
}

if (mobileOverlay) {
  mobileOverlay.addEventListener('click', closeMobileMenu);
}

menuItems.forEach(item => {
  item.addEventListener('click', () => {
    if (window.innerWidth <= 900) {
      closeMobileMenu();
    }
  });
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    closeMobileMenu();
  }
});
