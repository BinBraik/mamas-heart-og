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
  if (typeof IntersectionObserver !== 'function') {
    elements.forEach((element) => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });
    return;
  }

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
      toggle.setAttribute('aria-label', translate('themeToggle.switchToLight'));
      return;
    }

    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    if (icon) icon.textContent = '☀️';
    toggle.setAttribute('aria-label', translate('themeToggle.switchToDark'));
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

const DEFAULT_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = new Set(['en', 'ar']);
const FALLBACK_LANGUAGE = 'en';

const languageState = {
  current: DEFAULT_LANGUAGE,
  dictionaries: {},
};

const INTERPOLATION_TOKEN_REGEX = /\{(\w+)\}/g;

function deepGet(source, path) {
  if (!source) return undefined;
  return path.split('.').reduce((value, segment) => {
    if (value == null || typeof value !== 'object') {
      return undefined;
    }
    return value[segment];
  }, source);
}

function interpolate(template, replacements = {}) {
  return String(template).replace(INTERPOLATION_TOKEN_REGEX, (_, token) => (
    replacements[token] == null ? '' : String(replacements[token])
  ));
}

function translate(key, replacements = {}) {
  const activeDictionary = languageState.dictionaries[languageState.current];
  const fallbackDictionary = languageState.dictionaries[FALLBACK_LANGUAGE];
  const activeValue = deepGet(activeDictionary, key);
  const fallbackValue = deepGet(fallbackDictionary, key);
  const resolved = typeof activeValue === 'string' ? activeValue : fallbackValue;
  if (typeof resolved !== 'string') {
    return key;
  }
  return interpolate(resolved, replacements);
}

function applyStaticTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = translate(element.dataset.i18n);
  });

  root.querySelectorAll('[data-i18n-html]').forEach((element) => {
    element.innerHTML = translate(element.dataset.i18nHtml);
  });

  root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.setAttribute('placeholder', translate(element.dataset.i18nPlaceholder));
  });

  root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', translate(element.dataset.i18nAriaLabel));
  });

  document.title = translate('meta.title');
  const metaDescription = document.getElementById('metaDescription');
  if (metaDescription) {
    metaDescription.setAttribute('content', translate('meta.description'));
  }
  const metaOgTitle = document.getElementById('metaOgTitle');
  if (metaOgTitle) {
    metaOgTitle.setAttribute('content', translate('meta.ogTitle'));
  }
  const metaOgDescription = document.getElementById('metaOgDescription');
  if (metaOgDescription) {
    metaOgDescription.setAttribute('content', translate('meta.ogDescription'));
  }
}

async function loadDictionaries() {
  const dictionaryEntries = await Promise.all([...SUPPORTED_LANGUAGES].map(async (language) => {
    const response = await fetch(`./content/i18n/${language}.json`);
    if (!response.ok) {
      throw new Error(`Unable to load dictionary for ${language}: ${response.status}`);
    }
    const dictionary = await response.json();
    return [language, dictionary];
  }));

  languageState.dictionaries = Object.fromEntries(dictionaryEntries);
}

function getLanguageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const language = params.get('lang');
  if (!SUPPORTED_LANGUAGES.has(language)) {
    return null;
  }
  return language;
}

function getPreferredLanguage() {
  const languageFromQuery = getLanguageFromUrl();
  if (languageFromQuery) {
    return languageFromQuery;
  }

  const savedLanguage = localStorage.getItem('language');
  if (SUPPORTED_LANGUAGES.has(savedLanguage)) {
    return savedLanguage;
  }

  return DEFAULT_LANGUAGE;
}

function setLanguage(language) {
  languageState.current = SUPPORTED_LANGUAGES.has(language) ? language : DEFAULT_LANGUAGE;
  if (languageState.current === 'ar') {
    document.documentElement.setAttribute('lang', 'ar');
    document.documentElement.setAttribute('dir', 'rtl');
  } else {
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.setAttribute('dir', 'ltr');
  }
  localStorage.setItem('language', languageState.current);
  updateLanguageToggleState();
  applyStaticTranslations();
}

function updateLanguageToggleState() {
  const languageButtons = document.querySelectorAll('.language-option');
  languageButtons.forEach((button) => {
    const isActive = button.dataset.lang === languageState.current;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function initLanguageToggle() {
  const languageToggle = document.getElementById('languageToggle');
  if (!languageToggle) {
    return;
  }

  languageToggle.addEventListener('click', (event) => {
    const target = event.target.closest('.language-option');
    if (!target) {
      return;
    }
    const selectedLanguage = target.dataset.lang;
    if (selectedLanguage === languageState.current) {
      return;
    }
    setLanguage(selectedLanguage);
    applyFilters();
  });
}

function formatPrice(price, currency) {
  const locale = languageState.current === 'ar' ? 'ar-SA' : 'en-US';
  if (currency === 'SAR') {
    const sarValue = Number(price);
    if (!Number.isFinite(sarValue)) {
      return 'SAR —';
    }

    return `SAR ${new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(sarValue)}`;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatAgeRange(ageMin, ageMax) {
  if (ageMin == null && ageMax == null) {
    return translate('products.age.all');
  }

  if (ageMin != null && ageMax != null) {
    return translate('products.age.range', { min: ageMin, max: ageMax });
  }

  if (ageMin != null) {
    return translate('products.age.min', { min: ageMin });
  }

  return translate('products.age.max', { max: ageMax });
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

function getLocalizedProductField(product, fieldName) {
  if (!product || typeof product !== 'object') {
    return '';
  }

  if (languageState.current === 'ar') {
    const arabicValue = product[`${fieldName}_ar`];
    if (typeof arabicValue === 'string' && arabicValue.trim()) {
      return arabicValue;
    }
  }

  const fallbackValue = product[fieldName];
  if (typeof fallbackValue === 'string') {
    return fallbackValue;
  }

  return '';
}

function formatStockStatus(stockStatus) {
  if (stockStatus === 'unknown' || stockStatus == null || stockStatus === '') {
    return '';
  }

  const statusKey = `products.stockStatus.${stockStatus}`;
  const localizedStatus = translate(statusKey);
  if (localizedStatus !== statusKey) {
    return localizedStatus;
  }

  const readable = String(stockStatus).replaceAll('_', ' ');
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

const CATEGORY_ALL = 'all';
const ALLOWED_CATEGORIES = new Set([CATEGORY_ALL, 'Educational Kits', 'Sensory Development Kits']);

const productState = {
  allProducts: [],
  activeCategory: CATEGORY_ALL,
  featuredHeroProducts: [],
};

const HERO_CARD_COUNT = 4;

function getRandomDistinctProducts(products, count) {
  const pool = Array.isArray(products) ? [...products] : [];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[swapIndex]] = [pool[swapIndex], pool[i]];
  }
  return pool.slice(0, Math.max(0, count));
}

function renderHeroProducts(products) {
  const heroContainer = document.getElementById('heroProductCards');
  if (!heroContainer) return;

  heroContainer.setAttribute('aria-busy', 'true');

  if (!products.length) {
    heroContainer.innerHTML = `
      <article class="toy-card">
        <div class="toy-card-name">${translate('products.featured.loadingTitle')}</div>
        <div class="toy-card-age">${translate('products.featured.loadingDescription')}</div>
        <div class="toy-card-price">♡</div>
      </article>
    `;
    heroContainer.setAttribute('aria-busy', 'false');
    return;
  }

  heroContainer.innerHTML = products.map((product) => {
    const imagePath = getProductImagePath(product.image_main);
    const ageLabel = formatAgeRange(product.age_min, product.age_max);
    const priceLabel = formatPrice(product.price, product.currency);
    const localizedName = getLocalizedProductField(product, 'name');

    return `
      <article class="toy-card" data-product-id="${escapeHtml(product.id)}">
        <img
          class="toy-thumb"
          src="${escapeHtml(imagePath)}"
          alt="${escapeHtml(localizedName)}"
          loading="lazy"
          onerror="this.onerror=null;this.src='${FALLBACK_PRODUCT_IMAGE}';"
        >
        <div class="toy-card-name">${escapeHtml(localizedName)}</div>
        <div class="toy-card-age">${escapeHtml(ageLabel)}</div>
        <div class="toy-card-price">${escapeHtml(priceLabel)}</div>
      </article>
    `;
  }).join('');

  heroContainer.setAttribute('aria-busy', 'false');
}

function renderHeroProductsFallback() {
  renderHeroProducts([]);
}

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

function getFilteredProducts() {
  return productState.allProducts.filter((product) => {
    if (productState.activeCategory !== CATEGORY_ALL && product.category !== productState.activeCategory) {
      return false;
    }
    return true;
  });
}

function applyFilters() {
  renderHeroProducts(productState.featuredHeroProducts);
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
    const countKey = count === 1 ? 'products.count.one' : 'products.count.other';
    filterCount.textContent = translate(countKey, { count });
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

function renderProducts(products) {
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;

  productsGrid.setAttribute('aria-busy', 'true');

  if (!products.length) {
    productsGrid.innerHTML = `
      <article class="product-card">
        <div class="product-body">
          <div class="product-name">${translate('products.empty.title')}</div>
          <div class="product-desc">${translate('products.empty.description')}</div>
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
    const localizedName = getLocalizedProductField(product, 'name');
    const localizedSubcategory = getLocalizedProductField(product, 'subcategory');
    const localizedShortDescription = getLocalizedProductField(product, 'short_description');
    const productTag = `${product.category} · ${localizedSubcategory || product.subcategory}`;
    const featuredBadge = isFeaturedProduct(product)
      ? `<div class="product-featured-badge" aria-label="${translate('products.featured.label')}">${translate('products.featured.badge')}</div>`
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
            alt="${escapeHtml(localizedName)}"
            loading="lazy"
            onerror="this.onerror=null;this.src='${FALLBACK_PRODUCT_IMAGE}';"
          >
          <div class="product-tag">${escapeHtml(productTag)}</div>
          ${featuredBadge}
        </div>
        <div class="product-body">
          <div class="product-name">${escapeHtml(localizedName)}</div>
          <div class="product-desc">${escapeHtml(localizedShortDescription)}</div>
          <div class="product-footer">
            <div>
              <div class="product-price">${escapeHtml(priceLabel)}</div>
              <div class="product-age-tag">${escapeHtml(ageLabel)}</div>
              ${stockMarkup}
            </div>
            <button class="add-btn" aria-label="${escapeHtml(translate('products.addToCartAria', { name: localizedName }))}">+</button>
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
        <div class="product-name">${translate('products.loadError.title')}</div>
        <div class="product-desc">${translate('products.loadError.description')}</div>
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
  const abortController = new AbortController();
  const requestTimeoutMs = 8000;
  const timeout = setTimeout(() => {
    abortController.abort('Product request timed out');
  }, requestTimeoutMs);

  try {
    const response = await fetch('./normalized/products.json', { signal: abortController.signal });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const products = await response.json();
    productState.allProducts = Array.isArray(products) ? products : [];
    productState.featuredHeroProducts = getRandomDistinctProducts(productState.allProducts, HERO_CARD_COUNT);
    renderHeroProducts(productState.featuredHeroProducts);
    applyFilters();
  } catch (error) {
    console.error('Unable to load products from normalized/products.json', error);
    productState.featuredHeroProducts = [];
    renderHeroProductsFallback();
    renderProductLoadError();
  } finally {
    clearTimeout(timeout);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadDictionaries();
  } catch (error) {
    console.error('Unable to load translation dictionaries', error);
    languageState.dictionaries = {
      en: {},
      ar: {},
    };
  }

  setLanguage(getPreferredLanguage());
  initMobileMenu();
  initSmoothScroll();
  initDarkModeToggle();
  initLanguageToggle();
  productState.activeCategory = getCategoryFromUrl();
  initCategoryFilters();
  updateFilterControls();
  loadProducts();
  initScrollReveal();
});
