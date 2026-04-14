# IMPORT_GUIDE

This package is intended to let a coding/implementation chat wire up the catalog quickly without re-cleaning the source data.

## Recommended source of truth
Use:

- `normalized/products.json` for app/runtime use
- `normalized/products.csv` for spreadsheet/CMS import
- `images/products/` for all normalized product images

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

## Reversibility
If implementation needs to trace back to the source package:
- use `normalized/source_trace.json`
- check `raw/` for untouched originals

## Suggested implementation conventions
- Use `id` as the primary key.
- Use `slug` for route generation or frontend keys.
- Treat `stock_status == "unknown"` as a neutral display state, not out-of-stock.
- Do not infer gallery images unless new assets are added later.
