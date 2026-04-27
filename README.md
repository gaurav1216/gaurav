# Mithila Boutique — Crafts of the Mithila Region

A static, single-page boutique site for a fashion & crafts brand rooted in the **Mithila region of Bihar** — Madhubani painting, Sikki grass craft, Sujani embroidery, Bhagalpur tussar silk, Khatwa applique. Cart, INR pricing, and a checkout that runs in demo mode out-of-the-box and plugs into Stripe (or Razorpay) when you add keys.

## Files
- `index.html` — storefront (cart drawer, checkout modal, success toast)
- `admin.html` — admin dashboard (orders, subscribers, product editor)
- `styles.css` — storefront styles (responsive, breakpoints at 960px / 560px)
- `script.js` — cart, modal, Stripe + Supabase integration
- `db/schema.sql` — Supabase tables, RLS policies, admin allowlist
- `db/seed.sql` — initial product catalogue
- `supabase/functions/create-payment-intent/` — Stripe Edge Function

## Sections
1. Sticky header with cart counter
2. Hero with editorial type
3. Marquee strip
4. Featured collections (6 products) with **Add to bag**
5. Brand story
6. Lookbook grid
7. Journal
8. Visit info + newsletter
9. Footer
10. Slide-out cart drawer
11. Two-column checkout modal (form + order summary)

## Database (Supabase)

The site runs fine with no database — products are hardcoded in `index.html` and orders just show the success toast. To persist real data, wire up Supabase (free tier is more than enough for a small boutique):

1. Create a project at [supabase.com](https://supabase.com) — pick the **closest region to your customers** (Mumbai for India).
2. In the dashboard, open **SQL Editor → New query** and run `db/schema.sql`. Then run `db/seed.sql` to insert the six Mithila products.
3. Open **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL` in `script.js`
   - **anon public** key → `SUPABASE_ANON_KEY` in `script.js`

Once configured, the site will:
- Load products from the `products` table (so you can add new sarees from the Supabase dashboard without editing HTML)
- Save every checkout into the `orders` table (with items, shipping address, totals, payment status)
- Save newsletter signups into `newsletter_signups`

### What goes where

| Table | Written by | Read by |
|---|---|---|
| `products` | Admin via `admin.html` (or Supabase dashboard) | Public storefront |
| `orders` | Customer at checkout (anon insert) | Admin via `admin.html` |
| `newsletter_signups` | Newsletter form | Admin via `admin.html` |
| `admin_emails` | You, in the Supabase SQL editor | Used internally by RLS policies |

Row-Level Security is enabled on all four. Customers can place orders but can never read other people's. Admins are authenticated via Supabase Auth (email magic link) and read access is gated on the `admin_emails` allowlist.

## Admin dashboard

`admin.html` is a self-contained admin tool. Open it on the same domain as the storefront.

Setup:

1. Add yourself to the admin allowlist in the Supabase SQL editor:
   ```sql
   insert into admin_emails (email) values ('you@example.com');
   ```
2. Open `admin.html` in your browser → enter your email → click the magic link Supabase sends you.
3. You'll see:
   - **Orders** — recent orders with stats, expandable rows for items + shipping + payment ID, dropdown to update status (pending → paid → shipped → cancelled)
   - **Subscribers** — newsletter signups
   - **Products** — inline edit price and toggle in-stock / sold-out

Make sure the `SUPABASE_URL` and `SUPABASE_ANON_KEY` constants at the top of `admin.html` match the ones in `script.js`.

### Adding photos to products

The `products` table has an optional `image_url` column. Upload an image to Supabase Storage (or any CDN), paste the URL there, and it'll appear on the storefront automatically — replacing the gradient placeholder.

## Payments

The site ships in **demo mode** — the cart and checkout are fully functional, payment fields accept any input, and the success state plays through. No real charges are made.

### Going live with Stripe (via Supabase Edge Function)

Stripe requires a small server-side step to create a `PaymentIntent` (the browser is never allowed to do this). The repo includes a ready-to-deploy Edge Function at `supabase/functions/create-payment-intent/` that runs on Supabase — no separate backend needed.

**Critically, the function recomputes the order total server-side from the `products` table** — it never trusts the amount the browser sends. This prevents tampered prices.

Deploy with the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
# one-time
supabase login
supabase link --project-ref <your-project-ref>

# deploy and set the Stripe secret key
supabase functions deploy create-payment-intent
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

Then fill in `script.js`:

```js
const STRIPE_PUBLISHABLE_KEY = 'pk_test_...';
const CHECKOUT_ENDPOINT = 'https://<project>.supabase.co/functions/v1/create-payment-intent';
```

Other tunables at the top of `script.js`:

| Constant | Default | Purpose |
|---|---|---|
| `CURRENCY` / `CURRENCY_SYMBOL` | `USD` / `$` | Display + Stripe currency |
| `TAX_RATE` | `0.08` | Estimated tax shown on summary |
| `FREE_SHIPPING_THRESHOLD` | `200` | Free shipping over this subtotal |
| `SHIPPING_FEE` | `18` | Flat shipping fee otherwise |

### Razorpay (recommended for India)

Razorpay supports UPI, cards, net banking, and wallets — all in one widget. Replace the Stripe block in `script.js` with:

```js
const options = {
  key: 'rzp_test_...',
  amount: cart.total() * 100,   // paise
  currency: 'INR',
  name: 'Mithila Boutique',
  description: 'Order from Mithila Boutique',
  handler: (response) => onPaymentSuccess(response),
  prefill: { email: form.email.value, contact: form.phone?.value },
  theme: { color: '#5d4326' },
};
new Razorpay(options).open();
```

Add `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>` to `index.html`.

### PayPal / Apple Pay

The UI has tabs for PayPal and Apple Pay. To wire them up:
- **PayPal**: drop in PayPal's [Smart Buttons SDK](https://developer.paypal.com/sdk/js/) inside the `[data-panel="paypal"]` block.
- **Apple Pay**: enable the [Payment Request Button Element](https://docs.stripe.com/elements/payment-request-button) via Stripe — works automatically on supported devices once Stripe is configured.

## Customise
- Brand name, copy, products: `index.html`
- Colour palette: `:root` tokens at the top of `styles.css`
- Replace gradient placeholders with real photos: set `background-image: url(...)` on `.product-image::before`, `.story-image`, `.look-*`, `.post-*`.

## Run locally

No build step — it's plain HTML / CSS / JS. Pick one:

```bash
# Option A — npm (requires Node)
npm install
npm start
# → http://localhost:8000

# Option B — Python (no install needed)
python3 -m http.server 8000

# Option C — one-off via npx
npx serve . -l 8000
```

Then open **http://localhost:8000** in your browser. Use `Ctrl+C` to stop.

Avoid opening `index.html` directly with `file://` — Stripe.js and `localStorage` behave better over `http://`.
