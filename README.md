# Mama's Heart

A simple static landing page for **Mama's Heart**, a playful toy brand concept focused on educational products for children ages 4–6.

## Local preview

You can preview this project locally in either of these ways:

1. **Open directly in your browser**
   - Open `index.html` in your preferred browser.

2. **Run a local static server** (recommended)
   - Python 3:
     ```bash
     python3 -m http.server 8000
     ```
   - Then visit: `http://localhost:8000`

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. In your repository, open **Settings**.
3. Go to **Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
5. Select your branch (commonly `main`) and folder **`/ (root)`**.
6. Save the settings and wait for deployment to complete.

## How to update branding

When refreshing brand styling or messaging, start with these files and sections first:

1. **`assets/css/styles.css`**
   - Update `:root` brand, neutral, and semantic tokens at the top of the file.
   - Review major visual sections (`/* NAV */`, `/* HERO */`, `/* PRODUCTS */`, `/* TESTIMONIALS */`, etc.) to ensure they consume semantic tokens.
2. **`index.html`**
   - Update the `<!-- BRAND LOGO -->` block for logo name/tagline changes.
   - Update product showcase content in `<!-- PRODUCTS GRID -->`.
   - Update social proof content in `<!-- TESTIMONIALS -->`.
3. **`assets/js/main.js`**
   - If branding updates affect interactions, adjust the startup modules (`initMobileMenu`, `initSmoothScroll`, `initAddButtons`, `initScrollReveal`) and keep initialization in one startup block.
