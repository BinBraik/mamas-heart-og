const DEFAULT_CONFIG = {
  app: {
    defaultLanguage: 'en',
    fallbackLanguage: 'en',
    supportedLanguages: ['en', 'ar'],
  },
  theme: {
    defaultTheme: 'light',
  },
  data: {
    productsPath: './normalized/products.json',
    requestTimeoutMs: 8000,
  },
  assets: {
    fallbackProductImage: './assets/img/logo/mama-heart-logo.png',
    bookCoverImagePath: './images/BookCover.png',
    cacheBustedImages: {},
  },
  ui: {
    heroPromoRotator: {
      rotationIntervalMs: 6000,
      enableControls: true,
    },
    addButton: {
      defaultSymbol: '+',
      activeSymbol: '♡',
      activeDurationMs: 1200,
    },
    heroPromos: [
      {
        id: 'bookPromo',
        titleKey: 'hero.promos.book.title',
        subtitleKey: 'hero.promos.book.subtitle',
        ctaKey: 'hero.promos.book.cta',
        ctaHref: '#products',
        accentClass: 'hero-promo-slide--book',
        images: [
          {
            path: './images/BookCover.png',
            altKey: 'hero.promos.book.images.coverAlt',
          },
        ],
      },
      {
        id: 'packagingPromo',
        titleKey: 'hero.promos.packaging.title',
        subtitleKey: 'hero.promos.packaging.subtitle',
        ctaKey: 'hero.promos.packaging.cta',
        ctaHref: '#cta',
        accentClass: 'hero-promo-slide--packaging',
        images: [
          {
            path: './images/Packaging1.png',
            altKey: 'hero.promos.packaging.images.primaryAlt',
          },
          {
            path: './images/Packaging2.png',
            altKey: 'hero.promos.packaging.images.secondaryAlt',
          },
          {
            path: './images/Packaging3.png',
            altKey: 'hero.promos.packaging.images.tertiaryAlt',
          },
        ],
      },
    ],
  },
  catalog: {
    allCategory: {
      queryValue: 'all',
      i18nKey: 'products.filters.all',
    },
    categories: [],
  },
};

const appState = {
  config: DEFAULT_CONFIG,
};

const languageState = {
  current: DEFAULT_CONFIG.app.defaultLanguage,
  dictionaries: {},
};

const productState = {
  allProducts: [],
  activeCategory: DEFAULT_CONFIG.catalog.allCategory.queryValue,
};

const heroPromoState = {
  currentIndex: 0,
  timerId: null,
  hasInitialized: false,
  intervalMs: DEFAULT_CONFIG.ui.heroPromoRotator.rotationIntervalMs,
  isPaused: false,
  isReducedMotion: false,
  reducedMotionQuery: null,
  controlsInitialized: false,
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
  const fallbackLanguage = appState.config.app.fallbackLanguage;
  const activeDictionary = languageState.dictionaries[languageState.current];
  const fallbackDictionary = languageState.dictionaries[fallbackLanguage];
  const activeValue = deepGet(activeDictionary, key);
  const fallbackValue = deepGet(fallbackDictionary, key);
  const resolved = typeof activeValue === 'string' ? activeValue : fallbackValue;
  if (typeof resolved !== 'string') {
    return key;
  }
  return interpolate(resolved, replacements);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getAllCategoryQueryValue() {
  return appState.config.catalog.allCategory.queryValue;
}

function getSupportedCategories() {
  const allCategory = getAllCategoryQueryValue();
  const configuredCategories = appState.config.catalog.categories.map((entry) => entry.value);
  return new Set([allCategory, ...configuredCategories]);
}

function getCategoryLabel(categoryValue) {
  const allCategory = appState.config.catalog.allCategory;
  if (categoryValue === allCategory.queryValue) {
    return translate(allCategory.i18nKey);
  }

  const configured = appState.config.catalog.categories.find((entry) => entry.value === categoryValue);
  return configured ? translate(configured.i18nKey) : categoryValue;
}

function getFallbackProductImage() {
  return appState.config.assets.fallbackProductImage;
}

function getProductImagePath(imageMain) {
  if (!imageMain || !String(imageMain).trim()) {
    return getFallbackProductImage();
  }

  const normalizedPath = String(imageMain).trim();
  const version = appState.config.assets.cacheBustedImages[normalizedPath];
  if (version) {
    return `./${normalizedPath}?v=${encodeURIComponent(version)}`;
  }

  return `./${normalizedPath}`;
}

function getBookCoverImagePath() {
  const configuredPath = appState.config.assets.bookCoverImagePath;
  if (typeof configuredPath !== 'string' || !configuredPath.trim()) {
    return '';
  }

  const trimmedPath = configuredPath.trim();
  const hasProtocol = /^[a-z]+:\/\//i.test(trimmedPath);
  if (hasProtocol || trimmedPath.startsWith('./') || trimmedPath.startsWith('/')) {
    return trimmedPath;
  }

  return `./${trimmedPath}`;
}

function getConfigImagePath(pathValue) {
  if (typeof pathValue !== 'string') {
    return '';
  }

  const trimmedPath = pathValue.trim();
  if (!trimmedPath) {
    return '';
  }

  const hasProtocol = /^[a-z]+:\/\//i.test(trimmedPath);
  if (hasProtocol || trimmedPath.startsWith('./') || trimmedPath.startsWith('/')) {
    return trimmedPath;
  }

  return `./${trimmedPath}`;
}

function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!hamburger || !mobileMenu) {
    return;
  }

  const originalBodyOverflow = document.body.style.overflow;

  const setMenuOpen = (isOpen) => {
    hamburger.classList.toggle('open', isOpen);
    mobileMenu.classList.toggle('open', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return;
    }

    document.body.style.overflow = originalBodyOverflow;
  };

  setMenuOpen(false);

  hamburger.addEventListener('click', () => {
    setMenuOpen(!mobileMenu.classList.contains('open'));
  });

  mobileMenu.querySelectorAll('a, button').forEach((action) => {
    action.addEventListener('click', () => {
      setMenuOpen(false);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileMenu.classList.contains('open')) {
      setMenuOpen(false);
      hamburger.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 680 && mobileMenu.classList.contains('open')) {
      setMenuOpen(false);
    }
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
  const addButtonConfig = appState.config.ui.addButton;

  root.querySelectorAll('.add-btn').forEach((button) => {
    button.addEventListener('click', function addButtonAnimation() {
      this.textContent = addButtonConfig.activeSymbol;
      this.style.background = 'var(--brand-rose)';
      setTimeout(() => {
        this.textContent = addButtonConfig.defaultSymbol;
        this.style.background = 'var(--brand-primary)';
      }, addButtonConfig.activeDurationMs);
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
    localStorage.setItem('theme', appState.config.theme.defaultTheme);
    if (icon) icon.textContent = '☀️';
    toggle.setAttribute('aria-label', translate('themeToggle.switchToDark'));
  };

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    setToggleState(true);
  } else {
    setToggleState(false);
  }

  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setToggleState(!isDark);
  });
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

  root.querySelectorAll('[data-i18n-alt]').forEach((element) => {
    element.setAttribute('alt', translate(element.dataset.i18nAlt));
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

  renderHeroPromoRotator();
}

function renderHeroPromoRotator() {
  const promoContainer = document.getElementById('heroPromoRotator');
  if (!promoContainer) {
    return;
  }

  const bookSlide = document.getElementById('heroPromoSlideBook');
  const packagingSlide = document.getElementById('heroPromoSlidePackaging');
  const heroPromos = Array.isArray(appState.config.ui.heroPromos)
    ? appState.config.ui.heroPromos
    : DEFAULT_CONFIG.ui.heroPromos;
  const bookPromoConfig = heroPromos.find((promo) => promo.id === 'bookPromo');
  const packagingPromoConfig = heroPromos.find((promo) => promo.id === 'packagingPromo');
  const promoSlides = [
    { id: 'bookPromo', element: bookSlide, config: bookPromoConfig },
    { id: 'packagingPromo', element: packagingSlide, config: packagingPromoConfig },
  ].filter((slide) => slide.element && slide.config);

  if (!promoSlides.length) {
    return;
  }

  const configuredInterval = Number(appState.config.ui?.heroPromoRotator?.rotationIntervalMs);
  heroPromoState.intervalMs = Number.isFinite(configuredInterval) && configuredInterval >= 1000
    ? configuredInterval
    : DEFAULT_CONFIG.ui.heroPromoRotator.rotationIntervalMs;

  if (!heroPromoState.hasInitialized) {
    heroPromoState.currentIndex = appState.config.ui.enableHeroBookPromo === false ? 1 : 0;
    heroPromoState.hasInitialized = true;
  }
  heroPromoState.currentIndex = Math.min(heroPromoState.currentIndex, promoSlides.length - 1);

  if (bookSlide) {
    const bookTitle = bookSlide.querySelector('.hero-promo-title');
    if (bookTitle && bookPromoConfig?.titleKey) {
      bookTitle.textContent = translate(bookPromoConfig.titleKey);
    }

    const bookSubtitle = bookSlide.querySelector('.hero-promo-subtitle');
    if (bookSubtitle && bookPromoConfig?.subtitleKey) {
      const subtitle = translate(bookPromoConfig.subtitleKey);
      const hasSubtitle = subtitle !== bookPromoConfig.subtitleKey && subtitle.trim().length > 0;
      bookSubtitle.hidden = !hasSubtitle;
      bookSubtitle.textContent = hasSubtitle ? subtitle : '';
    }

    const bookCta = bookSlide.querySelector('.hero-promo-cta');
    if (bookCta) {
      if (bookPromoConfig?.ctaKey) {
        bookCta.textContent = translate(bookPromoConfig.ctaKey);
      }
      if (bookPromoConfig?.ctaHref) {
        bookCta.setAttribute('href', bookPromoConfig.ctaHref);
      }
    }

    const configuredAccentClass = bookPromoConfig?.accentClass;
    if (configuredAccentClass && !bookSlide.classList.contains(configuredAccentClass)) {
      bookSlide.classList.add(configuredAccentClass);
    }
  }

  if (packagingSlide) {
    const packagingTitle = packagingSlide.querySelector('.hero-promo-title');
    if (packagingTitle && packagingPromoConfig?.titleKey) {
      packagingTitle.textContent = translate(packagingPromoConfig.titleKey);
    }

    const packagingSubtitle = packagingSlide.querySelector('.hero-promo-subtitle');
    if (packagingSubtitle && packagingPromoConfig?.subtitleKey) {
      const subtitle = translate(packagingPromoConfig.subtitleKey);
      const hasSubtitle = subtitle !== packagingPromoConfig.subtitleKey && subtitle.trim().length > 0;
      packagingSubtitle.hidden = !hasSubtitle;
      packagingSubtitle.textContent = hasSubtitle ? subtitle : '';
    }

    const packagingCta = packagingSlide.querySelector('.hero-promo-cta');
    if (packagingCta) {
      if (packagingPromoConfig?.ctaKey) {
        packagingCta.textContent = translate(packagingPromoConfig.ctaKey);
      }
      if (packagingPromoConfig?.ctaHref) {
        packagingCta.setAttribute('href', packagingPromoConfig.ctaHref);
      }
    }

    const packagingAccentClass = packagingPromoConfig?.accentClass;
    if (packagingAccentClass && !packagingSlide.classList.contains(packagingAccentClass)) {
      packagingSlide.classList.add(packagingAccentClass);
    }

    const mediaGroup = packagingSlide.querySelector('.hero-promo-media-group');
    if (mediaGroup) {
      mediaGroup.replaceChildren();
      const configuredImages = Array.isArray(packagingPromoConfig?.images) ? packagingPromoConfig.images : [];
      configuredImages.forEach((imageConfig) => {
        const image = document.createElement('img');
        image.className = 'hero-promo-image hero-promo-image--packaging';
        image.loading = 'lazy';
        image.src = getConfigImagePath(imageConfig.path);
        image.alt = imageConfig.altKey ? translate(imageConfig.altKey) : '';
        mediaGroup.append(image);
      });
    }
  }

  const promoImage = document.getElementById('heroBookPromoImage');
  if (promoImage) {
    const primaryBookImage = Array.isArray(bookPromoConfig?.images) ? bookPromoConfig.images[0] : null;
    const configuredBookImagePath = getConfigImagePath(primaryBookImage?.path);
    const fallbackBookImagePath = getBookCoverImagePath();
    promoImage.setAttribute('src', configuredBookImagePath || fallbackBookImagePath);
    if (primaryBookImage?.altKey) {
      promoImage.setAttribute('alt', translate(primaryBookImage.altKey));
    }
  }

  initHeroPromoRotator(promoContainer, promoSlides);
}

function applyHeroPromoSlideState(promoContainer, promoSlides) {
  promoSlides.forEach((slide, index) => {
    const isActive = index === heroPromoState.currentIndex;
    slide.element.classList.toggle('hero-promo-slide--active', isActive);
    slide.element.classList.toggle('hero-promo-slide--inactive', !isActive);
    slide.element.setAttribute('data-slide-state', isActive ? 'active' : 'inactive');
    slide.element.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  });

  promoContainer.querySelectorAll('.hero-promo-dot').forEach((dotButton) => {
    const dotIndex = Number(dotButton.dataset.index);
    const isActive = dotIndex === heroPromoState.currentIndex;
    dotButton.classList.toggle('is-active', isActive);
    dotButton.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function goToHeroPromoSlide(nextIndex, promoContainer, promoSlides, { restartTimer = true } = {}) {
  const totalSlides = promoSlides.length;
  if (!totalSlides) {
    return;
  }

  heroPromoState.currentIndex = ((nextIndex % totalSlides) + totalSlides) % totalSlides;
  applyHeroPromoSlideState(promoContainer, promoSlides);

  if (restartTimer) {
    startHeroPromoRotation(promoContainer, promoSlides);
  }
}

function showNextHeroPromoSlide(promoContainer, promoSlides) {
  goToHeroPromoSlide(heroPromoState.currentIndex + 1, promoContainer, promoSlides, { restartTimer: false });
}

function stopHeroPromoRotation() {
  if (heroPromoState.timerId) {
    window.clearInterval(heroPromoState.timerId);
    heroPromoState.timerId = null;
  }
}

function startHeroPromoRotation(promoContainer, promoSlides) {
  stopHeroPromoRotation();

  const shouldAutoRotate = promoSlides.length > 1 && !heroPromoState.isReducedMotion && !heroPromoState.isPaused;
  if (!shouldAutoRotate) {
    return;
  }

  heroPromoState.timerId = window.setInterval(() => {
    showNextHeroPromoSlide(promoContainer, promoSlides);
  }, heroPromoState.intervalMs);
}

function setHeroPromoPaused(isPaused, promoContainer, promoSlides) {
  heroPromoState.isPaused = isPaused;
  if (isPaused) {
    stopHeroPromoRotation();
    return;
  }

  startHeroPromoRotation(promoContainer, promoSlides);
}

function initHeroPromoControls(promoContainer, promoSlides) {
  const controlsConfigEnabled = appState.config.ui?.heroPromoRotator?.enableControls !== false;
  let controls = promoContainer.querySelector('.hero-promo-controls');

  if (!controlsConfigEnabled) {
    controls?.remove();
    return;
  }

  if (!controls) {
    controls = document.createElement('div');
    controls.className = 'hero-promo-controls';
    controls.innerHTML = `
      <button type="button" class="hero-promo-control hero-promo-control--prev" data-action="prev" aria-label="Previous promo">‹</button>
      <div class="hero-promo-dots" role="group" aria-label="Promo slide controls"></div>
      <button type="button" class="hero-promo-control hero-promo-control--next" data-action="next" aria-label="Next promo">›</button>
    `;
    promoContainer.append(controls);
  }

  const dotsContainer = controls.querySelector('.hero-promo-dots');
  if (dotsContainer) {
    dotsContainer.innerHTML = promoSlides.map((slide, index) => {
      const label = slide.config?.titleKey ? translate(slide.config.titleKey) : `Slide ${index + 1}`;
      return `
        <button
          type="button"
          class="hero-promo-dot"
          data-index="${index}"
          aria-label="${escapeHtml(label)}"
          aria-pressed="false"
        ></button>
      `;
    }).join('');
  }

  if (!heroPromoState.controlsInitialized) {
    controls.addEventListener('click', (event) => {
      const control = event.target.closest('button');
      if (!control) {
        return;
      }

      if (control.dataset.action === 'prev') {
        goToHeroPromoSlide(heroPromoState.currentIndex - 1, promoContainer, promoSlides);
        return;
      }

      if (control.dataset.action === 'next') {
        goToHeroPromoSlide(heroPromoState.currentIndex + 1, promoContainer, promoSlides);
        return;
      }

      if (control.classList.contains('hero-promo-dot')) {
        const nextIndex = Number(control.dataset.index);
        if (Number.isFinite(nextIndex)) {
          goToHeroPromoSlide(nextIndex, promoContainer, promoSlides);
        }
      }
    });
    heroPromoState.controlsInitialized = true;
  }
}

function initHeroPromoMotionPreference(promoContainer, promoSlides) {
  if (!heroPromoState.reducedMotionQuery) {
    heroPromoState.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  }

  const updateMotionPreference = () => {
    heroPromoState.isReducedMotion = heroPromoState.reducedMotionQuery.matches;
    promoContainer.setAttribute('data-reduced-motion', heroPromoState.isReducedMotion ? 'true' : 'false');
    startHeroPromoRotation(promoContainer, promoSlides);
  };

  if (!promoContainer.dataset.motionPreferenceBound) {
    heroPromoState.reducedMotionQuery.addEventListener('change', updateMotionPreference);
    promoContainer.dataset.motionPreferenceBound = 'true';
  }

  updateMotionPreference();
}

function initHeroPromoRotator(promoContainer, promoSlides) {
  initHeroPromoControls(promoContainer, promoSlides);
  initHeroPromoMotionPreference(promoContainer, promoSlides);

  if (!promoContainer.dataset.rotationHooksBound) {
    promoContainer.addEventListener('mouseenter', () => {
      setHeroPromoPaused(true, promoContainer, promoSlides);
    });
    promoContainer.addEventListener('mouseleave', () => {
      setHeroPromoPaused(false, promoContainer, promoSlides);
    });
    promoContainer.addEventListener('focusin', () => {
      setHeroPromoPaused(true, promoContainer, promoSlides);
    });
    promoContainer.addEventListener('focusout', (event) => {
      if (promoContainer.contains(event.relatedTarget)) {
        return;
      }
      setHeroPromoPaused(false, promoContainer, promoSlides);
    });
    document.addEventListener('visibilitychange', () => {
      const isDocumentHidden = document.hidden;
      setHeroPromoPaused(isDocumentHidden, promoContainer, promoSlides);
    });

    promoContainer.dataset.rotationHooksBound = 'true';
  }

  applyHeroPromoSlideState(promoContainer, promoSlides);
  startHeroPromoRotation(promoContainer, promoSlides);
}

async function loadConfig() {
  try {
    const response = await fetch('./content/app-config.json');
    if (!response.ok) {
      throw new Error(`Unable to load app-config.json: ${response.status}`);
    }

    const loadedConfig = await response.json();
    appState.config = {
      ...DEFAULT_CONFIG,
      ...loadedConfig,
      app: {
        ...DEFAULT_CONFIG.app,
        ...loadedConfig.app,
      },
      theme: {
        ...DEFAULT_CONFIG.theme,
        ...loadedConfig.theme,
      },
      data: {
        ...DEFAULT_CONFIG.data,
        ...loadedConfig.data,
      },
      assets: {
        ...DEFAULT_CONFIG.assets,
        ...loadedConfig.assets,
        cacheBustedImages: {
          ...DEFAULT_CONFIG.assets.cacheBustedImages,
          ...(loadedConfig.assets?.cacheBustedImages || {}),
        },
      },
      ui: {
        ...DEFAULT_CONFIG.ui,
        ...loadedConfig.ui,
        heroPromoRotator: {
          ...DEFAULT_CONFIG.ui.heroPromoRotator,
          ...(loadedConfig.ui?.heroPromoRotator || {}),
        },
        addButton: {
          ...DEFAULT_CONFIG.ui.addButton,
          ...(loadedConfig.ui?.addButton || {}),
        },
        heroPromos: Array.isArray(loadedConfig.ui?.heroPromos)
          ? loadedConfig.ui.heroPromos
          : DEFAULT_CONFIG.ui.heroPromos,
      },
      catalog: {
        ...DEFAULT_CONFIG.catalog,
        ...loadedConfig.catalog,
        allCategory: {
          ...DEFAULT_CONFIG.catalog.allCategory,
          ...(loadedConfig.catalog?.allCategory || {}),
        },
        categories: Array.isArray(loadedConfig.catalog?.categories)
          ? loadedConfig.catalog.categories
          : DEFAULT_CONFIG.catalog.categories,
      },
    };
  } catch (error) {
    console.error('Unable to load content/app-config.json, using defaults', error);
    appState.config = DEFAULT_CONFIG;
  }

  languageState.current = appState.config.app.defaultLanguage;
  productState.activeCategory = getAllCategoryQueryValue();
}

async function loadDictionaries() {
  const dictionaryEntries = await Promise.all(appState.config.app.supportedLanguages.map(async (language) => {
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
  const supported = new Set(appState.config.app.supportedLanguages);
  if (!supported.has(language)) {
    return null;
  }
  return language;
}

function getPreferredLanguage() {
  const supported = new Set(appState.config.app.supportedLanguages);
  const languageFromQuery = getLanguageFromUrl();
  if (languageFromQuery) {
    return languageFromQuery;
  }

  const savedLanguage = localStorage.getItem('language');
  if (supported.has(savedLanguage)) {
    return savedLanguage;
  }

  return appState.config.app.defaultLanguage;
}

function setLanguage(language) {
  const supported = new Set(appState.config.app.supportedLanguages);
  languageState.current = supported.has(language) ? language : appState.config.app.defaultLanguage;
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
  renderCategoryFilterChips();
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
  return typeof fallbackValue === 'string' ? fallbackValue : '';
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

function renderCategoryFilterChips() {
  const filtersContainer = document.getElementById('productFilters');
  if (!filtersContainer) return;

  const allCategory = appState.config.catalog.allCategory;
  const categories = [
    {
      queryValue: allCategory.queryValue,
      label: getCategoryLabel(allCategory.queryValue),
    },
    ...appState.config.catalog.categories.map((entry) => ({
      queryValue: entry.value,
      label: getCategoryLabel(entry.value),
    })),
  ];

  filtersContainer.innerHTML = categories.map((category) => {
    const isActive = category.queryValue === productState.activeCategory;
    return `
      <button
        class="filter-chip${isActive ? ' is-active' : ''}"
        type="button"
        role="tab"
        data-category="${escapeHtml(category.queryValue)}"
        aria-selected="${isActive ? 'true' : 'false'}"
        aria-pressed="${isActive ? 'true' : 'false'}"
      >${escapeHtml(category.label)}</button>
    `;
  }).join('');
}

function getCategoryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  if (!category) return getAllCategoryQueryValue();
  return getSupportedCategories().has(category) ? category : getAllCategoryQueryValue();
}

function updateCategoryInUrl(category) {
  const url = new URL(window.location.href);
  if (category === getAllCategoryQueryValue()) {
    url.searchParams.delete('category');
  } else {
    url.searchParams.set('category', category);
  }

  window.history.replaceState({}, '', url);
}

function getFilteredProducts() {
  return productState.allProducts.filter((product) => {
    if (productState.activeCategory !== getAllCategoryQueryValue() && product.category !== productState.activeCategory) {
      return false;
    }
    return true;
  });
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

function applyFilters() {
  renderProducts(getFilteredProducts());
  updateFilterControls();
}

function applyCategory(category) {
  productState.activeCategory = getSupportedCategories().has(category)
    ? category
    : getAllCategoryQueryValue();
  updateCategoryInUrl(productState.activeCategory);
  applyFilters();
}

function initCategoryFilters() {
  const filtersContainer = document.getElementById('productFilters');
  if (!filtersContainer) return;

  filtersContainer.addEventListener('click', (event) => {
    const target = event.target.closest('.filter-chip');
    if (!target) return;

    applyCategory(target.dataset.category || getAllCategoryQueryValue());
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
    const localizedCategory = getCategoryLabel(product.category);
    const productTag = `${localizedCategory} · ${localizedSubcategory || product.subcategory}`;
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
            onerror="this.onerror=null;this.src='${getFallbackProductImage()}';"
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
            <button class="add-btn" aria-label="${escapeHtml(translate('products.addToCartAria', { name: localizedName }))}">${escapeHtml(appState.config.ui.addButton.defaultSymbol)}</button>
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
  const requestTimeoutMs = appState.config.data.requestTimeoutMs;
  const timeout = setTimeout(() => {
    abortController.abort('Product request timed out');
  }, requestTimeoutMs);

  try {
    const response = await fetch(appState.config.data.productsPath, { signal: abortController.signal });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const products = await response.json();
    productState.allProducts = Array.isArray(products) ? products : [];
    applyFilters();
  } catch (error) {
    console.error(`Unable to load products from ${appState.config.data.productsPath}`, error);
    renderProductLoadError();
  } finally {
    clearTimeout(timeout);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();

  try {
    await loadDictionaries();
  } catch (error) {
    console.error('Unable to load translation dictionaries', error);
    languageState.dictionaries = Object.fromEntries(appState.config.app.supportedLanguages.map((language) => [language, {}]));
  }

  setLanguage(getPreferredLanguage());
  initMobileMenu();
  initSmoothScroll();
  initDarkModeToggle();
  initLanguageToggle();
  productState.activeCategory = getCategoryFromUrl();
  renderCategoryFilterChips();
  initCategoryFilters();
  updateFilterControls();
  loadProducts();
  initScrollReveal();
});
