const express = require('express');
const router = express.Router();
const db = require('../db/database');

// View Shopping Cart
router.get('/cart', (req, res) => {
  res.render('cart', {
    title: 'Shopping Cart - ShopSphere'
  });
});

// Add Item to Cart
router.post('/cart/add', async (req, res) => {
  const { productId, quantity } = req.body;
  const qty = parseInt(quantity, 10) || 1;

  if (!productId) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    return res.redirect('back');
  }

  try {
    const product = await db.get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.redirect('/products');
    }

    if (!req.session.cart) {
      req.session.cart = {};
    }

    const currentQty = req.session.cart[productId] || 0;
    const newQty = Math.min(currentQty + qty, product.stock);

    req.session.cart[productId] = newQty;

    // Calculate updated cart count
    const totalCount = Object.values(req.session.cart).reduce((sum, count) => sum + count, 0);

    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({
        success: true,
        message: `Added ${product.name} to cart.`,
        cartCount: totalCount
      });
    }

    res.redirect('/cart');
  } catch (err) {
    console.error('Error adding product to cart:', err);
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.redirect('back');
  }
});

// Update Cart Quantity
router.post('/cart/update', (req, res) => {
  const { productId, quantity } = req.body;
  const qty = parseInt(quantity, 10);

  if (req.session.cart && productId) {
    if (qty > 0) {
      req.session.cart[productId] = qty;
    } else {
      delete req.session.cart[productId];
    }
  }

  if (req.xhr || req.headers.accept?.includes('json')) {
    const totalCount = Object.values(req.session.cart || {}).reduce((sum, count) => sum + count, 0);
    return res.json({ success: true, cartCount: totalCount });
  }

  res.redirect('/cart');
});

// Remove Item from Cart
router.post('/cart/remove', (req, res) => {
  const { productId } = req.body;

  if (req.session.cart && productId) {
    delete req.session.cart[productId];
  }

  if (req.xhr || req.headers.accept?.includes('json')) {
    const totalCount = Object.values(req.session.cart || {}).reduce((sum, count) => sum + count, 0);
    return res.json({ success: true, cartCount: totalCount });
  }

  res.redirect('/cart');
});

// Clear Cart
router.post('/cart/clear', (req, res) => {
  req.session.cart = {};
  res.redirect('/cart');
});

module.exports = router;
