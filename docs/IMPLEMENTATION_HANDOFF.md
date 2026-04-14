# IMPLEMENTATION_HANDOFF

## File contracts (must remain stable)

### Source of truth
- **Canonical file:** `normalized/products.json`
- `normalized/products.csv` is a convenience mirror for spreadsheet/CMS workflows.
- UI/data integrations should treat JSON as authoritative if there is a mismatch.

### Image path conventions
- Product images live under: `images/products/`
- `image_main` must be a relative path beginning with: `images/products/`
- Recommended filename pattern: `<slug>-01.<ext>`
  - Example: `images/products/educational-kits-cubetto-plus-playset-01.webp`

### Category value constraints
`category` is constrained to exactly:
- `Educational Kits`
- `Sensory Development Kits`

Any new value should be treated as schema drift and rejected until intentionally approved.

## Final file paths
- `raw/` — untouched original export
- `normalized/products.json` — primary normalized catalog (canonical)
- `normalized/products.csv` — CSV mirror of normalized catalog
- `normalized/source_trace.json` — raw-to-normalized provenance
- `normalized/source_trace.csv` — raw-to-normalized provenance in CSV
- `normalized/image_manifest.json` — normalized image inventory
- `images/products/` — renamed normalized product images
- `docs/` — schema, mapping, import, QA, and this handoff note
- `scripts/validate_products.py` — lightweight schema/content validator

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

## How UI consumes schema fields (developer notes)
- Product list/card UI should read: `name`, `short_description`, `price`, `currency`, `image_main`, `category`.
- Product detail UI should additionally read: `long_description`, `image_gallery`, `skills`, `sensory_focus`, `tags`, `age_min`, `age_max`.
- Routing should use `slug` (keep `id` as immutable internal key).
- Filtering should use `category`, `subcategory`, `skills`, `sensory_focus`, and `tags`.
- Availability indicator should map `stock_status`; value `unknown` should render neutral.
- “Featured” sections should be driven by boolean `featured` only.

## Content-only update handoff
For future updates, prefer this flow over code edits:
1. Edit `normalized/products.json`.
2. Add/update corresponding files in `images/products/`.
3. Run `python3 scripts/validate_products.py`.
4. If validation passes, ship as a content update.

This keeps schema stable and minimizes UI regressions caused by drift.

## Suggested next steps for implementation
1. Wire the catalog to `normalized/products.json`.
2. Add filter chips for the two top-level categories first.
3. Use `subcategory`, `skills`, and `tags` for secondary filters/search.
4. Add a TODO to swap the Cubetto+ hero image if a higher-resolution source appears.
