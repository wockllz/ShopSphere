// Client-side JavaScript for CodeAlpha E-Commerce Store

document.addEventListener('DOMContentLoaded', () => {
  initAddToCartForms();
});

/**
 * Handle Add to Cart form submissions via AJAX for smooth user experience
 */
function initAddToCartForms() {
  const addToCartForms = document.querySelectorAll('.add-to-cart-form');

  addToCartForms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = new URLSearchParams(formData);

      try {
        const response = await fetch('/cart/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: data
        });

        const result = await response.json();

        if (result.success) {
          // Update cart badge in navbar
          const badge = document.getElementById('cart-badge');
          if (badge) {
            badge.textContent = result.cartCount;
            badge.classList.add('badge-pop');
            setTimeout(() => badge.classList.remove('badge-pop'), 300);
          }

          // Show Toast Notification
          showToast(result.message || 'Item added to your cart!', 'success');
        } else {
          showToast(result.message || 'Failed to add item to cart', 'error');
        }
      } catch (err) {
        console.error('Add to cart AJAX error:', err);
        // Fallback: submit standard form if JS fetch fails
        form.submit();
      }
    });
  });
}

/**
 * Display toast notification
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconClass = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';

  toast.innerHTML = `
    <i class="${iconClass}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
