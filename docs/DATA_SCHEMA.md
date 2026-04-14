# DATA_SCHEMA

This package contains a reversible normalization pass for the Primo Toys catalog.

## Canonical product files
- `normalized/products.json`
- `normalized/products.csv`

## Canonical schema

| Field | Type in JSON | Type in CSV | Required | Notes |
|---|---|---|---|---|
| `id` | string | string | yes | Stable product identifier generated from canonical slug. |
| `name` | string | string | yes | Clean product name without vendor prefix noise. |
| `slug` | string | string | yes | URL-safe canonical slug. |
| `category` | string | string | yes | Forced to one of: `Educational Kits`, `Sensory Development Kits`. |
| `subcategory` | string | string | yes | Preserves product grouping lost during top-level normalization. |
| `age_min` | integer/null | integer/null | yes | Minimum recommended age when available. |
| `age_max` | integer/null | integer/null | yes | Maximum recommended age when explicitly supported; otherwise blank/null. |
| `skills` | array[string] | pipe-delimited string | yes | Example CSV value: `coding basics|sequencing|problem solving`. |
| `sensory_focus` | array[string] | pipe-delimited string | yes | Example CSV value: `tactile|visual`. |
| `short_description` | string | string | yes | Compact storefront-friendly summary. |
| `long_description` | string | string | yes | Expanded summary assembled from source product copy and pack details. |
| `price` | number | number | yes | SAR value from the source package. |
| `currency` | string | string | yes | Always `SAR` in normalized files. |
| `image_main` | string | string | yes | Relative path to renamed normalized image. |
| `image_gallery` | array[string] | JSON array string | yes | Empty list when no gallery assets were available. |
| `stock_status` | string | string | yes | Defaulted conservatively to `unknown` in this pass. |
| `featured` | boolean | boolean | yes | Curated flag. Only the flagship playset was marked featured. |
| `tags` | array[string] | pipe-delimited string | yes | Freeform helper taxonomy for search/filtering. |

## File format notes

### JSON
`products.json` preserves arrays and booleans in native form.

### CSV
To keep the CSV easy to import into common CMS/ecommerce tooling:
- `skills`, `sensory_focus`, and `tags` use pipe delimiters.
- `image_gallery` is stored as a JSON array string, currently `[]` for every product.

## Supplemental trace files
- `normalized/source_trace.json`
- `normalized/source_trace.csv`
- `normalized/image_manifest.json`

These preserve raw-to-normalized mappings so changes remain reversible.
