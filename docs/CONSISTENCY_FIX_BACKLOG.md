# Consistency Fix Backlog

Date: 2026-04-15

Prioritization policy:
- **P0**: broken behavior/data mismatch
- **P1**: significant UX inconsistency
- **P2**: visual polish/non-blockers

---

## P0 (Do first)

### Data Pipelines
1. **Regenerate image manifest from current catalog**
   - **Issue:** `normalized/image_manifest.json` does not include all `image_main` files referenced in `normalized/products.json`.
   - **Action:** Add/repair manifest generation step so every product image is represented.
   - **Done when:** Count and filename set in manifest fully match product image references.

---

## P1 (High value UX/content alignment)

### Behavior: Language/URL State
1. **Persist explicit language switches to query-state**
   - **Issue:** User switch can be overridden on reload if stale `?lang=` is present.
   - **Action:** On language toggle, update URL query (`lang=en|ar`) using `replaceState`.
   - **Done when:** Switching language and reloading keeps the chosen language consistently.

### Content: EN/AR Parity
2. **Localize category labels in product card tags**
   - **Issue:** AR mode product tags show English category names.
   - **Action:** Add category localization mapping or `category_ar` field and use locale-aware rendering.
   - **Done when:** AR card tags are fully Arabic while preserving correct category mapping.

3. **Unify age positioning across hero/meta/content model**
   - **Issue:** Messaging alternates between "3+" and "4–6".
   - **Action:** Define canonical age range in content strategy and update hero/title/meta/i18n strings accordingly.
   - **Done when:** All top-level marketing copy reflects one coherent age scope.

4. **Align testimonial product references to actual catalog**
   - **Issue:** Testimonials mention product names absent from normalized catalog.
   - **Action:** Replace names with existing SKUs or neutralize references.
   - **Done when:** All testimonial product references map to current products or remain generic.

### Accessibility / Interaction States
5. **Standardize focus-visible states across interactive controls**
   - **Issue:** Focus indication is incomplete for links/buttons/chips.
   - **Action:** Define shared focus style and apply to nav links, CTA buttons, filter chips, footer links, and action buttons.
   - **Done when:** Keyboard navigation provides consistent visible focus in all themes/languages/viewports.

---

## P2 (Polish + quality)

### UI Visuals
1. **Fix footer heading selector mismatch**
   - **Issue:** CSS targets `.footer-col h5` while markup uses `h3`.
   - **Action:** Update CSS selector or heading level.
   - **Done when:** Footer column titles match intended typography.

2. **Replace low-resolution Cubetto image**
   - **Issue:** `educational-kits-cubetto-plus-playset-01.webp` is 90x77.
   - **Action:** Export and commit higher-resolution asset comparable to rest of catalog images.
   - **Done when:** Asset meets baseline dimensions and card rendering is visually consistent.

### Data Completeness
3. **Operationalize stock statuses**
   - **Issue:** All products set to `unknown`, resulting in non-informative UI.
   - **Action:** Backfill stock data integration and establish update cadence.
   - **Done when:** Most products carry meaningful status (`in_stock`, `low_stock`, etc.).

---

## Suggested Execution Order
1. P0 manifest parity fix.
2. P1 language URL persistence.
3. P1 AR category localization.
4. P1 age-messaging + testimonial alignment.
5. P1 focus-visible rollout.
6. P2 visual/data polish items.

