# Consistency Audit Report

Date: 2026-04-15  
Scope: UI, behavior, content model, and normalized data artifacts.

## 1) Audit Matrix

### Dimensions
- **Language:** EN / AR
- **Theme:** Light / Dark
- **Viewport:** Mobile (<=680), Tablet (681–1024), Desktop (>1024)

### Combination Matrix
| ID | Language | Theme | Viewport |
|---|---|---|---|
| M01 | EN | Light | Mobile |
| M02 | EN | Light | Tablet |
| M03 | EN | Light | Desktop |
| M04 | EN | Dark | Mobile |
| M05 | EN | Dark | Tablet |
| M06 | EN | Dark | Desktop |
| M07 | AR | Light | Mobile |
| M08 | AR | Light | Tablet |
| M09 | AR | Light | Desktop |
| M10 | AR | Dark | Mobile |
| M11 | AR | Dark | Tablet |
| M12 | AR | Dark | Desktop |

### Sections Reviewed per Combination
- Nav/header
- Hero/top cards
- Category controls
- Products grid/cards
- Testimonials
- Footer

> Note: This repository is static and the QA pass was performed via deterministic code/data inspection and validation commands (see "Reproducibility"). Findings are mapped across all matrix combinations by selector/logic scope.

---

## 2) Reproducibility (Commands)

```bash
python3 scripts/validate_products.py
python3 - <<'PY'
import json,csv
from pathlib import Path
root=Path('.')
js=json.loads((root/'normalized/products.json').read_text())
with open(root/'normalized/products.csv',newline='',encoding='utf-8') as f:
    rows=list(csv.DictReader(f))
print('json',len(js),'csv',len(rows))
print('id_diff',sorted(set(p['id'] for p in js)^set(r['id'] for r in rows)))
PY
python3 - <<'PY'
import json
from pathlib import Path
root=Path('.')
products=json.loads((root/'normalized/products.json').read_text())
manifest=json.loads((root/'normalized/image_manifest.json').read_text())
manifest_files={m['file'] for m in manifest}
prod_files=[Path(p['image_main']).name for p in products]
print('missing_in_manifest',sorted(set(prod_files)-manifest_files))
print('tiny_images',[m['file'] for m in manifest if m['size'][0] < 200 or m['size'][1] < 200])
PY
```

---

## 3) Findings by Severity

## P0 — Broken behavior / data mismatch

### P0-01 — `image_manifest` coverage is incomplete vs products source of truth
- **Area:** Data consistency
- **Location:** `normalized/image_manifest.json` vs `normalized/products.json`
- **Matrix impact:** M01–M12 (all modes using product data)
- **Evidence:** 15 products exist, while manifest tracks 11 images; 4 referenced product images are not listed in the manifest.
- **Why this matters:** Any pipeline expecting manifest completeness for preloading, audits, or CDN checks will produce false negatives.
- **Recommended fix:** Regenerate `normalized/image_manifest.json` from `normalized/products.json` so every `image_main` is represented.

---

## P1 — Significant UX/content inconsistency

### P1-01 — URL language query has higher precedence than local persistence after manual switch
- **Area:** Behavioral consistency (language persistence + URL/query-state)
- **Location:** `assets/js/main.js` (`getPreferredLanguage`, `initLanguageToggle`, `setLanguage`)
- **Matrix impact:** Any mode entered with `?lang=...` (M01–M12)
- **Evidence:** `getPreferredLanguage()` prioritizes `lang` query over localStorage, but language toggle does not update URL. Reload can revert user-selected language.
- **Recommended fix:** Update `lang` query parameter on language toggle (or lower URL precedence after explicit user action).

### P1-02 — AR product card taxonomy is partially English
- **Area:** Content consistency (EN/AR parity)
- **Location:** `assets/js/main.js` (`productTag` uses `product.category` + localized subcategory)
- **Matrix impact:** M07–M12 (all AR modes)
- **Evidence:** Category label in product tag is always English (`Educational Kits` / `Sensory Development Kits`) in AR mode.
- **Recommended fix:** Introduce localized category mapping (e.g., `category_ar`) and render localized category in AR.

### P1-03 — Hero age messaging conflicts with broader site/content model
- **Area:** Content model consistency
- **Location:** `content/i18n/en.json`, `content/i18n/ar.json` hero title/subtitle + metadata and product age distributions
- **Matrix impact:** M01–M12
- **Evidence:** Hero title states "Aged 3+" while subtitle/meta positioning and many sections emphasize ages 4–6.
- **Recommended fix:** Align hero title, subtitle, metadata, and category framing to one canonical age positioning.

### P1-04 — Keyboard focus states are incomplete for major interactive controls
- **Area:** Visual/accessibility consistency
- **Location:** `assets/css/styles.css` (focus styles only on selected controls)
- **Matrix impact:** M01–M12
- **Evidence:** `:focus-visible` is defined for language/theme toggles, but not consistently for nav links, filter chips, CTA buttons, and footer links.
- **Recommended fix:** Add a shared, visible focus style token and apply to all interactive elements.

### P1-05 — Testimonials reference products not present in catalog model
- **Area:** Content-model coherence
- **Location:** `index.html` testimonial copy vs `normalized/products.json`
- **Matrix impact:** M01–M12
- **Evidence:** Names like "Little Artist Set" / "Little Explorer Set" do not exist in the current normalized catalog.
- **Recommended fix:** Replace with existing catalog product names or remove specific SKU naming.

---

## P2 — Visual polish / non-blockers

### P2-01 — Footer heading style selector mismatches actual heading level
- **Area:** Visual consistency
- **Location:** `assets/css/styles.css` uses `.footer-col h5`; `index.html` uses `<h3>` in footer columns
- **Matrix impact:** M01–M12
- **Evidence:** Intended footer heading typography token may not apply.
- **Recommended fix:** Update selector to `.footer-col h3` (or align markup to `h5`).

### P2-02 — One primary product image is disproportionately tiny
- **Area:** Visual quality/content completeness
- **Location:** `normalized/image_manifest.json` (`educational-kits-cubetto-plus-playset-01.webp` = 90x77)
- **Matrix impact:** M01–M12 (hero cards + product card contexts)
- **Evidence:** Asset dimensions are significantly smaller than other product images.
- **Recommended fix:** Replace with a higher-resolution source consistent with the rest of the catalog.

### P2-03 — Stock status model defaults to unknown for all products
- **Area:** Content/data completeness
- **Location:** `normalized/products.json`
- **Matrix impact:** M01–M12
- **Evidence:** `stock_status` is `unknown` throughout; UI intentionally suppresses status when unknown.
- **Recommended fix:** Populate operational stock values (`in_stock`, `low_stock`, etc.) or remove status from card layout until data is reliable.

---

## 4) Section-by-Section Consistency Notes

- **Nav/Header:** Language + theme controls exist and persist via localStorage, but query-state and focus consistency gaps remain.
- **Hero/Top cards:** Random featured logic works; age-positioning copy is not fully coherent.
- **Category controls:** Filter chips and URL category sync implemented; AR taxonomy rendering is partially untranslated.
- **Products grid/cards:** Rendering is stable with fallback image handling; stock model currently non-informative.
- **Testimonials:** Layout and translation hooks exist; product naming not aligned to current catalog model.
- **Footer:** Translation hooks are present; heading style selector mismatch affects visual hierarchy.

---

## 5) Acceptance Mapping

- ✅ Matrix-based audit completed for all 12 combinations.
- ✅ Findings include severity, location, and recommended fix.
- ✅ Reproducible commands included.

