# IMPLEMENTATION_HANDOFF

## Final file paths
- `raw/` — untouched original export
- `normalized/products.json` — primary normalized catalog
- `normalized/products.csv` — CSV mirror of normalized catalog
- `normalized/source_trace.json` — raw-to-normalized provenance
- `normalized/source_trace.csv` — raw-to-normalized provenance in CSV
- `normalized/image_manifest.json` — normalized image inventory
- `images/products/` — renamed normalized product images
- `docs/` — schema, mapping, import, QA, and this handoff note

## Assumptions made
1. Top-level categories were forced to only two values exactly as requested.
2. Adventure maps were grouped under `Sensory Development Kits` because the map format is tactile/spatial and distinct from the coding accessories.
3. Alphabet and number cards were grouped under `Educational Kits` because their primary learning use is literacy/numeracy.
4. `age_min` was set to `3` across the catalog because the source shop presents the line as suitable for ages 3+.
5. `age_max` was only set for Cubetto+ (3–6) where a tighter range was explicitly supported by source copy; others remain null.
6. `stock_status` was set to `unknown` across the normalized catalog to avoid relying on fragile storefront inventory snapshots.
7. `featured` was set to `true` only for Cubetto+ Playset as the clear flagship product.
8. Only one normalized image was created per product because only one source image per item was available in the raw package.
9. Long descriptions were normalized summaries rather than verbatim source copy.
10. No source files were edited or removed; all originals were copied into `raw/`.

## Unresolved issues
- Category choice for adventure maps may need business confirmation.
- Cubetto+ image quality is poor in the raw package.
- Gallery assets are unavailable beyond the single provided image per product.
- Stock status needs a direct commerce-source sync if the frontend will display inventory.

## How to consume data
- Prefer `normalized/products.json` in application code.
- Use `id` as the canonical primary key.
- Use `slug` for routes/URLs.
- Use `image_main` as the main card/detail image path.
- Treat `image_gallery` as optional and currently empty.
- Build filters from `category`, `subcategory`, `skills`, `sensory_focus`, and `tags`.
- If you need provenance or want to debug a mismatch, join on `id` using `normalized/source_trace.json`.

## Suggested next steps for the coding chat
1. Wire the catalog to `normalized/products.json`.
2. Add filter chips for the two top-level categories first.
3. Use `subcategory`, `skills`, and `tags` for secondary filters/search.
4. Add a TODO to swap the Cubetto+ hero image if a higher-resolution source appears.
