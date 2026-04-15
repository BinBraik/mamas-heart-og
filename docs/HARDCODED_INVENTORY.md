# Hardcoded Inventory Audit

## Scope audited
- `index.html`
- `assets/js/main.js`
- `assets/css/styles.css`

## Findings and remediation

### 1) Content hardcoding
| Location | Previous hardcoding | Change |
|---|---|---|
| `index.html` + i18n title strings | Inline `<em style="...">` formatting embedded in content strings | Replaced with semantic class `accent-emphasis` and i18n-safe HTML token. |
| `index.html` newsletter button | Inline `style="white-space:nowrap"` | Replaced with class `newsletter-subscribe`. |
| Product filter labels in HTML | Static text + category values duplicated in markup | Filter labels now generated from centralized config + i18n keys. |

### 2) Data hardcoding
| Location | Previous hardcoding | Change |
|---|---|---|
| `assets/js/main.js` | Fixed category constants (`Educational Kits`, `Sensory Development Kits`) | Moved to `content/app-config.json` under `catalog.categories`. |
| `assets/js/main.js` | Hardcoded products data path (`./normalized/products.json`) | Moved to `content/app-config.json` under `data.productsPath`. |
| `assets/js/main.js` | Hardcoded fallback image and image cache-bust path | Moved to `content/app-config.json` under `assets`. |

### 3) Styling hardcoding
| Location | Previous hardcoding | Change |
|---|---|---|
| `assets/css/styles.css` dark mode controls | Repeated raw RGBA and hex values in toggle/language switcher styles | Replaced with semantic tokens (`--theme-toggle-*`, `--language-toggle-*`) and token-driven overrides. |
| `index.html` sections | Inline style for emphasis color | Shifted to class-based styling tokenized via CSS variable. |

### 4) Behavior hardcoding
| Location | Previous hardcoding | Change |
|---|---|---|
| `assets/js/main.js` | Magic numbers for request timeout, hero card count, add-button animation | Centralized in `content/app-config.json` under `data.requestTimeoutMs` and `ui.*`. |
| `assets/js/main.js` | Language defaults embedded in constants | Centralized via `content/app-config.json` (`app.defaultLanguage`, `app.supportedLanguages`, `app.fallbackLanguage`). |

## Remaining intentional literals
- Anchor IDs (e.g., `#products`, `#cta`) remain structural, not content/data dependencies.
- Small UI glyphs (e.g., `♡`) remain configurable via `content/app-config.json` for add-button state.
