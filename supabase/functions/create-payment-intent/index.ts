// Mithila Boutique — Stripe PaymentIntent edge function
//
// Deploy:
//   supabase functions deploy create-payment-intent
//   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
//
// Then in script.js set:
//   CHECKOUT_ENDPOINT = 'https://<project>.supabase.co/functions/v1/create-payment-intent'
//
// This function NEVER trusts the amount sent by the browser. It looks
// up product prices from the database, recomputes the total with the
// same shipping/tax rules as the storefront, and creates the
// PaymentIntent for that amount.

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const FREE_SHIPPING_THRESHOLD = 2500;
const SHIPPING_FEE = 150;
const TAX_RATE = 0.05;

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

interface CartItem { id: string; qty: number }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { items, email } = (await req.json()) as { items: CartItem[]; email?: string };

    if (!Array.isArray(items) || items.length === 0) {
      return json({ error: 'Cart is empty.' }, 400);
    }

    const ids = items.map((i) => i.id);
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price_inr, in_stock')
      .in('id', ids);

    if (error) return json({ error: error.message }, 500);

    let subtotal = 0;
    for (const item of items) {
      const product = products?.find((p) => p.id === item.id);
      if (!product) return json({ error: `Unknown product: ${item.id}` }, 400);
      if (!product.in_stock) return json({ error: `${product.name} is out of stock.` }, 400);
      const qty = Math.max(1, Math.min(99, Math.floor(item.qty)));
      subtotal += product.price_inr * qty;
    }

    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + shipping + tax;

    const intent = await stripe.paymentIntents.create({
      amount: total * 100,           // paise
      currency: 'inr',
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
      metadata: { items: JSON.stringify(items) },
    });

    return json({
      clientSecret: intent.client_secret,
      amount: total,
      breakdown: { subtotal, shipping, tax, total },
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
