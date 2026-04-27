/* ─────────────────────────────────────────────────────────
   Mithila Boutique — front-end
   Cart + payment checkout (with demo mode fallback)
   ───────────────────────────────────────────────────────── */

// To enable real card payments via Stripe:
//   1. Set STRIPE_PUBLISHABLE_KEY to your live/test key (pk_...)
//   2. Set CHECKOUT_ENDPOINT to a backend URL that creates a PaymentIntent
//      and returns its client_secret. (Stripe never lets the browser
//      create PaymentIntents — a tiny serverless function is required.)
//
// For India-only stores you can also use Razorpay or PayU — see README.
//
// Without a key, the site runs in DEMO mode: the form works end-to-end
// and shows a success state, but no charge is made.
const STRIPE_PUBLISHABLE_KEY = ''; // e.g. 'pk_test_...'
const CHECKOUT_ENDPOINT = '';      // e.g. '/api/create-payment-intent'
const CURRENCY = 'INR';
const CURRENCY_SYMBOL = '₹';
const TAX_RATE = 0.05; // GST on apparel < ₹1000 is 5%, ≥ ₹1000 is 12%. Keep simple.
const FREE_SHIPPING_THRESHOLD = 2500;
const SHIPPING_FEE = 150;

// ─────────── Supabase (database) ───────────
// To use a real database (recommended):
//   1. Create a project at https://supabase.com
//   2. Run db/schema.sql then db/seed.sql in the SQL editor
//   3. Paste your project URL and anon key below
// Without these set, the site falls back to the hardcoded products
// in index.html and orders simply show the success toast.
const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';

const sb = (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const fmt = (n) => `${CURRENCY_SYMBOL}${Math.round(n).toLocaleString('en-IN')}`;

/* ─────────── Reveal-on-scroll ─────────── */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }),
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.section-head, .product-card, .story-text, .story-image, .look, .post, .visit-info, .newsletter')
  .forEach((el) => { el.classList.add('reveal'); io.observe(el); });

/* ─────────── Mobile menu ─────────── */
const header = document.querySelector('.site-header');
document.getElementById('menuToggle')?.addEventListener('click', () => header.classList.toggle('nav-open'));
document.querySelectorAll('.nav-links a').forEach((a) =>
  a.addEventListener('click', () => header.classList.remove('nav-open'))
);

/* ─────────── Newsletter ─────────── */
const signup = document.getElementById('signup');
const formNote = document.getElementById('formNote');
signup?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) { formNote.textContent = 'Please enter a valid email.'; return; }

  if (sb) {
    const { error } = await sb.from('newsletter_signups').insert({ email });
    if (error && !/duplicate|unique/i.test(error.message)) {
      formNote.textContent = 'Could not subscribe right now. Please try again.';
      return;
    }
  }
  formNote.textContent = 'Thank you — check your inbox to confirm.';
  signup.reset();
});

/* ─────────── Hero parallax ─────────── */
const heroMedia = document.querySelector('.hero-media');
if (heroMedia && window.matchMedia('(min-width: 768px)').matches) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < 800) heroMedia.style.transform = `translateY(${y * 0.15}px)`;
  }, { passive: true });
}

/* ─────────────────────────────────────────────────────────
   CART
   ───────────────────────────────────────────────────────── */
const CART_KEY = 'mithila_cart_v1';

const cart = {
  items: JSON.parse(localStorage.getItem(CART_KEY) || '[]'),
  save() { localStorage.setItem(CART_KEY, JSON.stringify(this.items)); },
  add(product) {
    const existing = this.items.find((i) => i.id === product.id);
    if (existing) existing.qty += 1;
    else this.items.push({ ...product, qty: 1 });
    this.save(); render();
  },
  remove(id) { this.items = this.items.filter((i) => i.id !== id); this.save(); render(); },
  setQty(id, qty) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, qty);
    this.save(); render();
  },
  count() { return this.items.reduce((s, i) => s + i.qty, 0); },
  subtotal() { return this.items.reduce((s, i) => s + i.price * i.qty, 0); },
  shipping() { return this.subtotal() >= FREE_SHIPPING_THRESHOLD || this.items.length === 0 ? 0 : SHIPPING_FEE; },
  tax() { return Math.round(this.subtotal() * TAX_RATE * 100) / 100; },
  total() { return this.subtotal() + this.shipping() + this.tax(); },
  clear() { this.items = []; this.save(); render(); },
};

/* ─────────── DOM refs ─────────── */
const cartBtn = document.getElementById('cartBtn');
const cartDrawer = document.getElementById('cartDrawer');
const closeCart = document.getElementById('closeCart');
const overlay = document.getElementById('overlay');
const cartItemsEl = document.getElementById('cartItems');
const cartFoot = document.getElementById('cartFoot');
const cartCountEl = document.getElementById('cartCount');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const modal = document.getElementById('checkoutModal');
const closeCheckout = document.getElementById('closeCheckout');
const summaryItems = document.getElementById('summaryItems');
const sumSubtotal = document.getElementById('sumSubtotal');
const sumShipping = document.getElementById('sumShipping');
const sumTax = document.getElementById('sumTax');
const sumTotal = document.getElementById('sumTotal');
const payTotalEl = document.getElementById('payTotal');
const checkoutForm = document.getElementById('checkoutForm');
const payBtn = document.getElementById('payBtn');
const toast = document.getElementById('toast');

/* ─────────── Add to bag (delegated, works for DB-loaded products) ─────────── */
document.getElementById('productGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('.add-btn');
  if (!btn) return;
  e.stopPropagation();
  const card = btn.closest('.product-card');
  if (!card) return;
  cart.add({
    id: card.dataset.id,
    name: card.dataset.name,
    price: Number(card.dataset.price),
  });
  openDrawer();
  pulse(cartCountEl);
});

/* ─────────── Load products from Supabase (if configured) ─────────── */
async function loadProductsFromDB() {
  if (!sb) return;
  const { data, error } = await sb
    .from('products')
    .select('id, name, maker, price_inr, shape, image_url')
    .eq('in_stock', true)
    .order('display_order', { ascending: true });

  if (error) { console.warn('Supabase products fetch failed:', error.message); return; }
  if (!data?.length) return;

  document.getElementById('productGrid').innerHTML = data.map((p) => `
    <article class="product-card" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-price="${p.price_inr}">
      <div class="product-image" data-shape="${p.shape}" ${p.image_url ? `style="background-image:url('${p.image_url}'); background-size:cover; background-position:center;"` : ''}>
        <button class="add-btn" type="button">Add to bag</button>
      </div>
      <div class="product-meta">
        <h3>${escapeHtml(p.name)}</h3>
        <p class="maker">${escapeHtml(p.maker)}</p>
        <p class="price">₹${p.price_inr.toLocaleString('en-IN')}</p>
      </div>
    </article>
  `).join('');
}

function pulse(el) {
  el.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }],
    { duration: 280, easing: 'ease-out' }
  );
}

/* ─────────── Drawer ─────────── */
function openDrawer() {
  cartDrawer.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  cartDrawer.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('show');
  if (!modal.classList.contains('open')) document.body.style.overflow = '';
}
cartBtn.addEventListener('click', openDrawer);
closeCart.addEventListener('click', closeDrawer);
overlay.addEventListener('click', () => { closeDrawer(); closeModal(); });

/* ─────────── Render cart ─────────── */
function render() {
  cartCountEl.textContent = cart.count();
  cartSubtotalEl.textContent = fmt(cart.subtotal());

  if (cart.items.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart-empty">Your bag is empty.</p>';
    cartFoot.hidden = true;
    return;
  }
  cartFoot.hidden = false;

  cartItemsEl.innerHTML = cart.items.map((i) => `
    <div class="cart-item">
      <div class="cart-thumb" data-shape="${i.id}"></div>
      <div class="cart-info">
        <h4>${escapeHtml(i.name)}</h4>
        <p class="item-price">${fmt(i.price)}</p>
        <div class="qty">
          <button data-action="dec" data-id="${i.id}" aria-label="Decrease">−</button>
          <span>${i.qty}</span>
          <button data-action="inc" data-id="${i.id}" aria-label="Increase">+</button>
        </div>
      </div>
      <div>
        <div class="cart-line-total">${fmt(i.price * i.qty)}</div>
        <button class="cart-remove" data-action="remove" data-id="${i.id}">Remove</button>
      </div>
    </div>
  `).join('');
}

cartItemsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  const item = cart.items.find((i) => i.id === id);
  if (action === 'inc') cart.setQty(id, item.qty + 1);
  else if (action === 'dec') cart.setQty(id, item.qty - 1);
  else if (action === 'remove') cart.remove(id);
});

function escapeHtml(s) { return s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ─────────── Checkout modal ─────────── */
checkoutBtn.addEventListener('click', () => {
  if (cart.items.length === 0) return;
  closeDrawer();
  openModal();
});

function openModal() {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  fillSummary();
  mountPayment();
}
function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
closeCheckout.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeDrawer(); closeModal(); }
});

function fillSummary() {
  summaryItems.innerHTML = cart.items.map((i) => `
    <li class="sum-item">
      <div class="sum-thumb cart-thumb" data-shape="${i.id}"></div>
      <div>
        <div class="sum-name">${escapeHtml(i.name)}</div>
        <div class="sum-qty">Qty ${i.qty}</div>
      </div>
      <div class="sum-price">${fmt(i.price * i.qty)}</div>
    </li>
  `).join('');
  sumSubtotal.textContent = fmt(cart.subtotal());
  sumShipping.textContent = cart.shipping() === 0 ? 'Free' : fmt(cart.shipping());
  sumTax.textContent = fmt(cart.tax());
  sumTotal.textContent = fmt(cart.total());
  payTotalEl.textContent = fmt(cart.total());
}

/* ─────────── Payment method tabs ─────────── */
let activeMethod = 'card';
document.querySelectorAll('.pay-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.pay-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    activeMethod = tab.dataset.method;
    document.querySelectorAll('.pay-panel').forEach((p) => {
      p.hidden = p.dataset.panel !== activeMethod;
    });
  });
});

/* ─────────── Stripe / demo card mount ─────────── */
let stripe = null;
let cardElement = null;
const cardMount = document.getElementById('card-element');
const cardErrors = document.getElementById('card-errors');

function mountPayment() {
  if (cardMount.dataset.mounted) return;
  cardMount.dataset.mounted = '1';

  if (STRIPE_PUBLISHABLE_KEY && window.Stripe) {
    stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
    const elements = stripe.elements();
    cardElement = elements.create('card', {
      style: {
        base: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '15px', color: '#1f1d1a',
          '::placeholder': { color: '#a8a39a' },
        },
        invalid: { color: '#b54646' },
      },
    });
    cardElement.mount(cardMount);
    cardElement.on('change', (e) => {
      cardErrors.textContent = e.error ? e.error.message : '';
    });
  } else {
    // Demo card form (no Stripe key configured)
    cardMount.innerHTML = `
      <div class="demo-card">
        <span class="demo-tag">Demo mode · use any values</span>
        <input id="d-num" placeholder="Card number  4242 4242 4242 4242" autocomplete="cc-number" inputmode="numeric" />
        <div class="row">
          <input id="d-exp" placeholder="MM / YY" autocomplete="cc-exp" inputmode="numeric" />
          <input id="d-cvc" placeholder="CVC" autocomplete="cc-csc" inputmode="numeric" />
        </div>
      </div>
    `;
  }
}

/* ─────────── Submit ─────────── */
checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;
  setLoading(true);

  const formData = new FormData(checkoutForm);
  let paymentId = null;

  try {
    if (activeMethod === 'card' && stripe && cardElement && CHECKOUT_ENDPOINT) {
      // Real Stripe path
      const res = await fetch(CHECKOUT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(cart.total() * 100),
          currency: CURRENCY.toLowerCase(),
          items: cart.items,
        }),
      });
      const { clientSecret, error } = await res.json();
      if (error) throw new Error(error);

      const confirmed = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${formData.get('firstName')} ${formData.get('lastName')}`,
            email: formData.get('email'),
            address: {
              line1: formData.get('address'),
              city: formData.get('city'),
              postal_code: formData.get('postal'),
              country: formData.get('country'),
            },
          },
        },
      });
      if (confirmed.error) throw new Error(confirmed.error.message);
      paymentId = confirmed.paymentIntent?.id || null;
    } else {
      await new Promise((r) => setTimeout(r, 1200));
    }

    await saveOrder(formData, paymentId);
    onPaymentSuccess();
  } catch (err) {
    cardErrors.textContent = err.message || 'Something went wrong. Please try again.';
    setLoading(false);
  }
});

async function saveOrder(formData, paymentId) {
  if (!sb) return;
  const { error } = await sb.from('orders').insert({
    email: formData.get('email'),
    first_name: formData.get('firstName'),
    last_name: formData.get('lastName'),
    address: formData.get('address'),
    city: formData.get('city'),
    postal: formData.get('postal'),
    country: formData.get('country'),
    items: cart.items,
    subtotal_inr: cart.subtotal(),
    shipping_inr: cart.shipping(),
    tax_inr: cart.tax(),
    total_inr: cart.total(),
    payment_method: paymentId ? activeMethod : 'demo',
    payment_id: paymentId,
    status: paymentId ? 'paid' : 'pending',
  });
  if (error) console.warn('Order save failed:', error.message);
}

function validateForm() {
  let valid = true;
  checkoutForm.querySelectorAll('[required]').forEach((field) => {
    if (!field.value.trim()) { field.style.borderColor = '#b54646'; valid = false; }
    else field.style.borderColor = '';
  });
  const email = checkoutForm.querySelector('[name="email"]').value.trim();
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    checkoutForm.querySelector('[name="email"]').style.borderColor = '#b54646';
    valid = false;
  }
  if (!valid) cardErrors.textContent = 'Please complete all required fields.';
  else cardErrors.textContent = '';
  return valid;
}

function setLoading(on) {
  payBtn.disabled = on;
  payBtn.querySelector('.spinner').hidden = !on;
  payBtn.querySelector('.pay-label').style.opacity = on ? 0.7 : 1;
}

function onPaymentSuccess() {
  closeModal();
  cart.clear();
  toast.hidden = false;
  setLoading(false);
  checkoutForm.reset();
}
document.getElementById('toastClose').addEventListener('click', () => { toast.hidden = true; });

/* ─────────── Initial render ─────────── */
render();
loadProductsFromDB();
