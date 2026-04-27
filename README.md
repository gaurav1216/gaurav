# Mithila Boutique — Indian Fashion Website

A static, single-page boutique site for an Indian heritage-fashion brand. Cart, INR pricing, and a checkout that runs in demo mode out-of-the-box and plugs into Stripe (or Razorpay) when you add keys.

## Files
- `index.html` — markup (storefront, cart drawer, checkout modal, success toast)
- `styles.css` — styles (responsive, mobile-first breakpoints at 960px / 560px)
- `script.js` — cart state (localStorage), drawer + modal, Stripe integration, demo mode

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

## Payments

The site ships in **demo mode** — the cart and checkout are fully functional, payment fields accept any input, and the success state plays through. No real charges are made.

### Going live with Stripe

Stripe requires a small server-side step to create a `PaymentIntent` (the browser is never allowed to do this). Open `script.js` and fill in:

```js
const STRIPE_PUBLISHABLE_KEY = 'pk_test_...';   // your Stripe publishable key
const CHECKOUT_ENDPOINT = '/api/create-payment-intent'; // your backend URL
```

The endpoint should accept `{ amount, currency, items }` and return `{ clientSecret }`. A minimal Node/Express handler:

```js
// server.js
import express from 'express';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(express.json());

app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, currency } = req.body;
  const intent = await stripe.paymentIntents.create({ amount, currency, automatic_payment_methods: { enabled: true } });
  res.json({ clientSecret: intent.client_secret });
});

app.listen(3000);
```

Or deploy as a serverless function on Vercel / Netlify / Cloudflare Workers — same shape.

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
