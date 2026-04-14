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

function initAddButtons(root = document) {
  root.querySelectorAll('.add-btn').forEach((button) => {
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

function initScrollReveal(elements = document.querySelectorAll('.product-card, .testimonial-card, .why-feature, .age-card')) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  elements.forEach((element) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(28px)';
    element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(element);
  });
}

function initDarkModeToggle() {
  const toggle = document.getElementById('darkModeToggle');
  const icon = toggle?.querySelector('.toggle-icon');
  if (!toggle) return;

  const setToggleState = (isDark) => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      if (icon) icon.textContent = '🌙';
      toggle.setAttribute('aria-label', 'Switch to light mode');
      return;
    }

    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    if (icon) icon.textContent = '☀️';
    toggle.setAttribute('aria-label', 'Switch to dark mode');
  };

  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    setToggleState(true);
  } else {
    setToggleState(false);
  }

  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setToggleState(!isDark);
  });
}

function formatPrice(price, currency) {
  if (currency === 'SAR') {
    const sarValue = Number(price);
    if (!Number.isFinite(sarValue)) {
      return 'SAR —';
    }

    return `SAR ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(sarValue)}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatAgeRange(ageMin, ageMax) {
  if (ageMin == null && ageMax == null) {
    return 'All ages';
  }

  if (ageMin != null && ageMax != null) {
    return `Age ${ageMin}–${ageMax}`;
  }

  if (ageMin != null) {
    return `Age ${ageMin}+`;
  }

  return `Up to age ${ageMax}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const FALLBACK_PRODUCT_IMAGE = './assets/img/logo/mama-heart-logo.png';
const CUBETTO_IMAGE_PATH = 'images/products/educational-kits-cubetto-plus-playset-01.webp';
const CUBETTO_IMAGE_VERSION = '2';

function getProductImagePath(imageMain) {
  if (!imageMain || !String(imageMain).trim()) {
    return FALLBACK_PRODUCT_IMAGE;
  }

  const normalizedPath = String(imageMain).trim();

  if (normalizedPath === CUBETTO_IMAGE_PATH) {
    return `./${normalizedPath}?v=${CUBETTO_IMAGE_VERSION}`;
  }

  return `./${normalizedPath}`;
}

function isFeaturedProduct(product) {
  return Boolean(product?.featured);
}

function formatStockStatus(stockStatus) {
  if (stockStatus === 'unknown' || stockStatus == null || stockStatus === '') {
    return '';
  }

  const readable = String(stockStatus).replaceAll('_', ' ');
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

const CATEGORY_ALL = 'all';
const ALLOWED_CATEGORIES = new Set([CATEGORY_ALL, 'Educational Kits', 'Sensory Development Kits']);

const productState = {
  allProducts: [],
  activeCategory: CATEGORY_ALL,
  activeSubcategory: '',
  activeSensory: '',
  activeSkill: '',
  searchTerm: '',
};

function getCategoryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  if (!category) return CATEGORY_ALL;
  return ALLOWED_CATEGORIES.has(category) ? category : CATEGORY_ALL;
}

function updateCategoryInUrl(category) {
  const url = new URL(window.location.href);
  if (category === CATEGORY_ALL) {
    url.searchParams.delete('category');
  } else {
    url.searchParams.set('category', category);
  }
  window.history.replaceState({}, '', url);
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function textMatch(value, query) {
  return String(value ?? '').toLowerCase().includes(query);
}

function getFilteredProducts() {
  return productState.allProducts.filter((product) => {
    if (productState.activeCategory !== CATEGORY_ALL && product.category !== productState.activeCategory) {
      return false;
    }
    return true;
  });
}

function applyFilters() {
  renderProducts(getFilteredProducts());
  updateFilterControls();
}

function updateFilterControls() {
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach((chip) => {
    const isActive = chip.dataset.category === productState.activeCategory;
    chip.classList.toggle('is-active', isActive);
    chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    chip.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  const filterCount = document.getElementById('filterCount');
  if (filterCount) {
    const count = getFilteredProducts().length;
    filterCount.textContent = `${count} product${count === 1 ? '' : 's'}`;
  }
}

function applyCategory(category) {
  productState.activeCategory = ALLOWED_CATEGORIES.has(category) ? category : CATEGORY_ALL;
  updateCategoryInUrl(productState.activeCategory);
  applyFilters();
}

function initCategoryFilters() {
  const filtersContainer = document.getElementById('productFilters');
  if (!filtersContainer) return;

  filtersContainer.addEventListener('click', (event) => {
    const target = event.target.closest('.filter-chip');
    if (!target) return;
    applyCategory(target.dataset.category || CATEGORY_ALL);
  });
}

function initAdvancedFilters() {
  const subcategorySelect = document.getElementById('subcategoryFilter');
  const sensorySelect = document.getElementById('sensoryFilter');
  const searchInput = document.getElementById('searchFilter');
  const skillsChipList = document.getElementById('skillsChipList');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');

  subcategorySelect?.addEventListener('change', (event) => {
    productState.activeSubcategory = event.target.value;
    applyFilters();
  });

  sensorySelect?.addEventListener('change', (event) => {
    productState.activeSensory = event.target.value;
    applyFilters();
  });

  searchInput?.addEventListener('input', (event) => {
    productState.searchTerm = event.target.value;
    applyFilters();
  });

  skillsChipList?.addEventListener('click', (event) => {
    const chip = event.target.closest('.skills-chip');
    if (!chip) return;

    const skill = chip.dataset.skill || '';
    productState.activeSkill = productState.activeSkill === skill ? '' : skill;
    renderSkillsChips(getUniqueValues('skills'));
    applyFilters();
  });

  clearFiltersBtn?.addEventListener('click', () => {
    clearAllFilters();
  });
}

function renderProducts(products) {
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;

  productsGrid.setAttribute('aria-busy', 'true');

  if (!products.length) {
    productsGrid.innerHTML = `
      <article class="product-card">
        <div class="product-body">
          <div class="product-name">No products in this category yet</div>
          <div class="product-desc">Please switch tabs to explore the rest of our catalog.</div>
        </div>
      </article>
    `;
    productsGrid.setAttribute('aria-busy', 'false');
    return;
  }

  const cards = products.map((product) => {
    const priceLabel = formatPrice(product.price, product.currency);
    const ageLabel = formatAgeRange(product.age_min, product.age_max);
    const imagePath = getProductImagePath(product.image_main);
    const productTag = `${product.category} · ${product.subcategory}`;
    const featuredBadge = isFeaturedProduct(product)
      ? '<div class="product-featured-badge" aria-label="Featured product">Featured</div>'
      : '';
    const stockLabel = formatStockStatus(product.stock_status);
    const stockMarkup = stockLabel
      ? `<div class="product-stock-tag">${escapeHtml(stockLabel)}</div>`
      : '<div class="product-stock-tag product-stock-tag--neutral" aria-hidden="true">&nbsp;</div>';

    return `
      <article class="product-card" data-product-id="${escapeHtml(product.id)}">
        <div class="product-img">
          <img
            src="${escapeHtml(imagePath)}"
            alt="${escapeHtml(product.name)}"
            loading="lazy"
            onerror="this.onerror=null;this.src='${FALLBACK_PRODUCT_IMAGE}';"
          >
          <div class="product-tag">${escapeHtml(productTag)}</div>
          ${featuredBadge}
        </div>
        <div class="product-body">
          <div class="product-name">${escapeHtml(product.name)}</div>
          <div class="product-desc">${escapeHtml(product.short_description)}</div>
          <div class="product-footer">
            <div>
              <div class="product-price">${escapeHtml(priceLabel)}</div>
              <div class="product-age-tag">${escapeHtml(ageLabel)}</div>
              ${stockMarkup}
            </div>
            <button class="add-btn" aria-label="Add ${escapeHtml(product.name)} to cart">+</button>
          </div>
        </div>
      </article>
    `;
  });

  productsGrid.innerHTML = cards.join('');
  productsGrid.setAttribute('aria-busy', 'false');
  initAddButtons(productsGrid);
  initScrollReveal(productsGrid.querySelectorAll('.product-card'));
}

function renderProductLoadError() {
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;

  productsGrid.setAttribute('aria-busy', 'false');
  productsGrid.innerHTML = `
    <article class="product-card">
      <div class="product-body">
        <div class="product-name">Products are temporarily unavailable</div>
        <div class="product-desc">We couldn’t load the catalog right now. Please refresh to try again.</div>
      </div>
    </article>
    <article class="product-card" aria-hidden="true">
      <div class="product-body">
        <div class="product-name">&nbsp;</div>
        <div class="product-desc">&nbsp;</div>
      </div>
    </article>
    <article class="product-card" aria-hidden="true">
      <div class="product-body">
        <div class="product-name">&nbsp;</div>
        <div class="product-desc">&nbsp;</div>
      </div>
    </article>
  `;

  initScrollReveal(productsGrid.querySelectorAll('.product-card'));
}

async function loadProducts() {
  try {
    const response = await fetch('./normalized/products.json');

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const products = await response.json();
    productState.allProducts = Array.isArray(products) ? products : [];
    applyFilters();
  } catch (error) {
    console.error('Unable to load products from normalized/products.json', error);
    renderProductLoadError();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initSmoothScroll();
  initScrollReveal();
  initDarkModeToggle();
  productState.activeCategory = getCategoryFromUrl();
  initCategoryFilters();
  initAdvancedFilters();
  updateFilterControls();
  loadProducts();
});
