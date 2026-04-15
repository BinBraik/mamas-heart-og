# Maintainability Guide

This project now uses a small content/config contract so non-technical updates can be made safely in a few known files.

## Update copy (text)
- Edit translations in:
  - `content/i18n/en.json`
  - `content/i18n/ar.json`
- Keep EN/AR keys in parity. If you add a new key in EN, add it in AR too.
- Hero free-book promo text keys live under:
  - `hero.freeBook.title`
  - `hero.freeBook.subtitle` (optional; leave empty to hide subtitle)
  - `hero.freeBook.imageAlt`
  - `hero.freeBook.ariaLabel`

## Update hero free-book promo
- Toggle promo visibility in `content/app-config.json`:
  - `ui.enableHeroBookPromo` (`true`/`false`)
- Update promo image in `content/app-config.json`:
  - `assets.bookCoverImagePath` (supports absolute URL or local project-relative path)
- The hero promo title/subtitle are rendered from i18n keys, and image source is rendered from config, so no HTML/JS source edits are required for routine promo updates.

## Update categories
- Edit `content/app-config.json`:
  - `catalog.categories[].value` must exactly match product `category` values in `normalized/products.json`.
  - `catalog.categories[].i18nKey` must exist in both i18n dictionaries.
- Filter chips are rendered dynamically from this config; no HTML changes needed.

## Update products source
- Default source is configured in `content/app-config.json`:
  - `data.productsPath`
- Product cards and hero cards both read this same source.

## Update display defaults / fallbacks
- `content/app-config.json` controls:
  - `ui.heroCardCount`
  - `ui.addButton.*`
  - `assets.fallbackProductImage`
  - `assets.cacheBustedImages`
  - `data.requestTimeoutMs`

## Update theme tokens
- Use semantic variables in `assets/css/styles.css`.
- Prefer adding/adjusting tokens under `:root` and dark mode overrides under `html[data-theme="dark"]`.
- Avoid introducing inline styles in HTML or i18n HTML strings.

## Guardrail checks
Run before committing:

```bash
python scripts/check_hardcoded_ui_literals.py
python scripts/validate_products.py
```

The hardcoded-literals check flags category names leaking back into UI source files.
