// Reveal-on-scroll
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document
  .querySelectorAll('.section-head, .product-card, .story-text, .story-image, .look, .post, .visit-info, .newsletter')
  .forEach((el) => {
    el.classList.add('reveal');
    io.observe(el);
  });

// Mobile menu
const menuToggle = document.getElementById('menuToggle');
const header = document.querySelector('.site-header');
menuToggle?.addEventListener('click', () => {
  header.classList.toggle('nav-open');
});
document.querySelectorAll('.nav-links a').forEach((a) =>
  a.addEventListener('click', () => header.classList.remove('nav-open'))
);

// Newsletter signup
const form = document.getElementById('signup');
const note = document.getElementById('formNote');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    note.textContent = 'Please enter a valid email.';
    return;
  }
  note.textContent = 'Thank you — check your inbox to confirm.';
  form.reset();
});

// Cart count demo (clicks on product cards add to cart)
const cartCount = document.querySelector('.cart-count');
let count = 0;
document.querySelectorAll('.product-card').forEach((card) => {
  card.addEventListener('click', () => {
    count += 1;
    cartCount.textContent = count;
    cartCount.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }],
      { duration: 280, easing: 'ease-out' }
    );
  });
});

// Subtle parallax on hero
const heroMedia = document.querySelector('.hero-media');
if (heroMedia && window.matchMedia('(min-width: 768px)').matches) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < 800) heroMedia.style.transform = `translateY(${y * 0.15}px)`;
  }, { passive: true });
}
