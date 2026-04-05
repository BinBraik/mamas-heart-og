function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!hamburger || !mobileMenu) {
    return;
  }

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });

  document.querySelectorAll('.mobile-link').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      event.preventDefault();
      const targetSelector = anchor.getAttribute('href');
      document.querySelector(targetSelector)?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function initAddButtons() {
  document.querySelectorAll('.add-btn').forEach((button) => {
    button.addEventListener('click', function addButtonAnimation() {
      this.textContent = '♡';
      this.style.background = 'var(--brand-rose)';
      setTimeout(() => {
        this.textContent = '+';
        this.style.background = 'var(--brand-primary)';
      }, 1200);
    });
  });
}


function initThemeSwitcher() {
  const themeButtons = document.querySelectorAll('.theme-btn[data-theme]');

  if (!themeButtons.length) {
    return;
  }

  const root = document.documentElement;
  const defaultTheme = 'honey-linen';
  const savedTheme = localStorage.getItem('mh-theme');
  const initialTheme = savedTheme || defaultTheme;

  const setTheme = (themeName) => {
    root.setAttribute('data-theme', themeName);
    themeButtons.forEach((button) => {
      const isActive = button.dataset.theme === themeName;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  setTheme(initialTheme);

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedTheme = button.dataset.theme;
      if (!selectedTheme) {
        return;
      }
      setTheme(selectedTheme);
      localStorage.setItem('mh-theme', selectedTheme);
    });
  });
}

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.product-card, .testimonial-card, .why-feature, .age-card').forEach((element) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(28px)';
    element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(element);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initSmoothScroll();
  initAddButtons();
  initScrollReveal();
  initThemeSwitcher();
});
