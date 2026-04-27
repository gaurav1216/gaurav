-- Seed the products table with the current Mithila catalogue.
-- Safe to run multiple times — uses ON CONFLICT to upsert.

insert into products (id, name, maker, price_inr, shape, category, display_order) values
  ('p-madhubani-saree',    'Madhubani-painted Tussar Saree',    'Ranti village · Madhubani',     8500, 'madhubani-saree',    'saree',    1),
  ('p-bhagalpur-dupatta',  'Bhagalpur Tussar Dupatta',          'Champa Silk · Bhagalpur',       3200, 'bhagalpur-dupatta',  'dupatta',  2),
  ('p-sikki-potli',        'Sikki Grass Potli',                 'Raiyam Cluster · Madhubani',    1400, 'sikki-potli',        'craft',    3),
  ('p-sujani-stole',       'Sujani Embroidered Stole',          'Bhusura Women''s Co-op',        4500, 'sujani-stole',       'dupatta',  4),
  ('p-mithila-painting',   'Mithila Painting · Handmade Paper', 'Jitwarpur · Madhubani',         2800, 'mithila-painting',   'painting', 5),
  ('p-khatwa-cushion',     'Khatwa Applique Cushion Cover',     'Patna Khatwa Collective',       1200, 'khatwa-cushion',     'craft',    6)
on conflict (id) do update set
  name          = excluded.name,
  maker         = excluded.maker,
  price_inr     = excluded.price_inr,
  shape         = excluded.shape,
  category      = excluded.category,
  display_order = excluded.display_order;
