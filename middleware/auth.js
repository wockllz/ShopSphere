const db = require('../db/database');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    req.session.redirectUrl = req.originalUrl;
    return res.redirect('/auth/login?message=Please+log+in+to+continue');
  }
  next();
}

async function cartMiddleware(req, res, next) {
  // Attach user to res.locals
  res.locals.user = req.session.user || null;

  // Ensure cart exists in session
  if (!req.session.cart) {
    req.session.cart = {}; // { productId: quantity }
  }

  const cart = req.session.cart;
  const productIds = Object.keys(cart).filter(id => cart[id] > 0);

  let cartItems = [];
  let cartCount = 0;
  let subtotal = 0;

  if (productIds.length > 0) {
    try {
      const placeholders = productIds.map(() => '?').join(',');
      const products = await db.all(
        `SELECT * FROM products WHERE id IN (${placeholders})`,
        productIds
      );

      for (const p of products) {
        const qty = cart[p.id] || 0;
        if (qty > 0) {
          const itemTotal = p.price * qty;
          cartItems.push({
            product: p,
            quantity: qty,
            itemTotal: itemTotal
          });
          cartCount += qty;
          subtotal += itemTotal;
        }
      }
    } catch (err) {
      console.error('Error fetching cart items:', err);
    }
  }

  const tax = subtotal * 0.08;
  const shipping = subtotal > 100 || subtotal === 0 ? 0 : 5.00;
  const total = subtotal + tax + shipping;

  res.locals.cartItems = cartItems;
  res.locals.cartCount = cartCount;
  res.locals.cartSummary = {
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    shipping: shipping.toFixed(2),
    total: total.toFixed(2),
    rawSubtotal: subtotal,
    rawTotal: total
  };

  next();
}

module.exports = {
  requireAuth,
  cartMiddleware
};
