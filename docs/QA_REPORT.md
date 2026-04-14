# QA_REPORT

Generated on: 2026-04-14

## Scope
This QA pass checked:
- raw file preservation
- canonical schema completeness
- category normalization
- image matching and renaming
- basic price integrity
- reversible source tracing

## Summary
- Products in raw dataset: 11
- Products in normalized dataset: 11
- Missing normalized records: 0
- Missing normalized main images: 0
- Duplicate IDs: 0
- Duplicate slugs: 0
- Bad numeric prices: 0
- Malformed currency values: 0
- Empty short descriptions: 0
- Empty long descriptions: 0

## Findings

### Duplicates
None found.

### Missing fields
- `age_max` is blank/null for 10 products because the source copy consistently indicated `3+` but did not provide a firm upper bound.
- `image_gallery` is empty for all products because the source package only included one image per product.
- `stock_status` is intentionally `unknown` for all products in the normalized set to avoid overclaiming current inventory from incomplete source evidence.

### Prices
- All normalized `price` values were preserved from the source SAR export.
- No negative or non-numeric prices were found.

### Images
- Every product was matched to one source image and converted to `.webp`.
- Standard naming format applied: `category-slug-01.webp`
- No unmatched product images were found.
- Notable quality issue: the raw `cubetto_plus_playset.png` asset is very small (90x77) compared with the other source images. It was preserved and converted, but likely needs replacement with a higher-resolution asset.

### Links
- Raw product URLs and image source URLs were preserved in `normalized/source_trace.*`.
- No malformed URLs were found in the raw package.
- Live validation was not completed for every commerce URL during this cleanup pass, so source URLs should be treated as preserved references rather than guaranteed runtime endpoints.

## Needs Review
1. Confirm whether adventure maps belong under `Sensory Development Kits` or should be moved to `Educational Kits`.
2. Confirm whether accessory products should inherit a shared upper age bound from the Cubetto ecosystem.
3. Confirm whether any products besides the flagship playset should be marked `featured`.
4. Replace the low-resolution Cubetto+ image if a better asset exists.
