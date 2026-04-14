# IMPORT_GUIDE

This package is designed so future catalog updates can be shipped via **data file changes** (not app code edits) when the schema contract is respected.

## Recommended source of truth
Use:

- `normalized/products.json` for app/runtime use (**canonical**) 
- `normalized/products.csv` for spreadsheet/CMS import
- `images/products/` for all normalized product images

## Exact update flow (content-only)
Follow these steps in order for every content update:

1. **Edit canonical data**
   - Update product rows in `normalized/products.json`.
   - If needed, mirror those changes to `normalized/products.csv` for spreadsheet workflows.
2. **Add images**
   - Put product images in `images/products/`.
   - Set `image_main` to a relative path like `images/products/<slug>-01.webp`.
3. **Verify schema fields**
   - Run `python3 scripts/validate_products.py`.
   - Fix any missing required fields, invalid categories, empty descriptions, slug issues, or broken image paths.

## Lightweight validation
Use the validator script before committing any content change:

- Command: `python3 scripts/validate_products.py`
- Checks:
  - required fields exist
  - key text fields are not empty
  - `category` is one of the allowed values
  - `image_main` follows path convention and points to an existing file
  - `slug` formatting sanity check

## Basic consume pattern

### JSON-first
1. Read `normalized/products.json`.
2. Render catalog cards from:
   - `name`
   - `category`
   - `subcategory`
   - `price`
   - `currency`
   - `image_main`
   - `short_description`
3. Use `skills`, `sensory_focus`, and `tags` for filters/search facets.
4. Treat `image_gallery` as optional.

### CSV-first
When importing from CSV:
- split `skills`, `sensory_focus`, and `tags` on `|`
- parse `image_gallery` as JSON
- keep `price` numeric
- keep `featured` boolean
- allow blank `age_max`

## Path assumptions
All paths are relative to the package root.

Examples:
- `normalized/products.json`
- `images/products/educational-kits-cubetto-plus-playset-01.webp`

## Content QA checklist (non-technical editors)
Before handing off updates, verify:

- [ ] Every product has a valid image file and `image_main` path resolves.
- [ ] `slug` values are lowercase and hyphenated (no spaces/underscores).
- [ ] `short_description` and `long_description` are not empty.
- [ ] `category` is only one of:
  - `Educational Kits`
  - `Sensory Development Kits`
- [ ] `python3 scripts/validate_products.py` passes with no errors.

## Reversibility
If implementation needs to trace back to the source package:
- use `normalized/source_trace.json`
- check `raw/` for untouched originals

## Suggested implementation conventions
- Use `id` as the primary key.
- Use `slug` for route generation or frontend keys.
- Treat `stock_status == "unknown"` as a neutral display state, not out-of-stock.
- Do not infer gallery images unless new assets are added later.

## Translation key naming convention
UI copy is stored in `content/i18n/<lang>.json` and should follow these rules:

- Use lower camelCase segments joined by dots: `<area>.<subArea>.<label>`.
  - Example: `products.filters.educationalKits`.
- Group keys by page area first (`nav`, `hero`, `products`, etc.) to keep lookups predictable.
- Prefer reusable placeholders for runtime values instead of string concatenation.
  - Example: `"products.addToCartAria": "Add {name} to cart"`.
- Always add new keys to `content/i18n/en.json` first (source of truth), then mirror in other locales.
- Arabic may ship partial coverage; rendering logic must fall back to English when an Arabic key is missing.
