# Maison Élise — Boutique Website

A static, single-page boutique website. No build step — open `index.html` in a browser, or serve the folder with any static server.

## Files
- `index.html` — markup
- `styles.css` — styles (responsive, mobile-first breakpoints at 960px / 560px)
- `script.js` — reveal-on-scroll, mobile menu, newsletter form, cart-count demo, hero parallax

## Sections
1. Sticky header with cart
2. Hero with editorial type
3. Marquee strip
4. Featured collections (6 products)
5. Brand story
6. Lookbook grid
7. Journal (3 posts)
8. Visit info + newsletter signup
9. Footer

## Customise
- Brand name, copy, prices: `index.html`
- Colour palette: `:root` tokens at the top of `styles.css`
- Replace gradient placeholders with real photography by setting `background-image: url(...)` on `.product-image::before`, `.story-image`, `.look-*`, `.post-*`.

## Run locally
```bash
python3 -m http.server 8000
# then open http://localhost:8000
```
