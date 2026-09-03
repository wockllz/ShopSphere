const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// Checkout Page
router.get('/checkout', requireAuth, (req, res) => {
  const cartItems = res.locals.cartItems || [];

  if (cartItems.length === 0) {
    return res.redirect('/cart');
  }

  res.render('checkout', {
    title: 'Checkout - CodeAlpha Store',
    error: null
  });
});

// Process Order Checkout
router.post('/orders/checkout', requireAuth, async (req, res) => {
  const { shipping_name, shipping_address, shipping_city, shipping_zip, payment_method } = req.body;
  const cartItems = res.locals.cartItems || [];
  const cartSummary = res.locals.cartSummary;

  if (cartItems.length === 0) {
    return res.redirect('/cart');
  }

  if (!shipping_name || !shipping_address || !shipping_city || !shipping_zip || !payment_method) {
    return res.render('checkout', {
      title: 'Checkout - CodeAlpha Store',
      error: 'Please fill in all shipping and payment fields.'
    });
  }

  try {
    // Start transaction / place order
    const orderResult = await db.run(
      `INSERT INTO orders (user_id, total_amount, status, shipping_name, shipping_address, shipping_city, shipping_zip, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.session.user.id,
        cartSummary.rawTotal,
        'Completed',
        shipping_name.trim(),
        shipping_address.trim(),
        shipping_city.trim(),
        shipping_zip.trim(),
        payment_method
      ]
    );

    const orderId = orderResult.lastID;

    // Insert order items and deduct product stock
    for (const item of cartItems) {
      await db.run(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product.id, item.quantity, item.product.price]
      );

      // Reduce stock
      await db.run(
        `UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?`,
        [item.quantity, item.product.id]
      );
    }

    // Clear session cart
    req.session.cart = {};

    res.redirect(`/orders/${orderId}?success=1`);
  } catch (err) {
    console.error('Error placing order:', err);
    res.render('checkout', {
      title: 'Checkout - CodeAlpha Store',
      error: 'An error occurred while placing your order. Please try again.'
    });
  }
});

// User Orders List
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const orders = await db.all(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [req.session.user.id]
    );

    // Fetch order items count for each order
    for (const order of orders) {
      const countResult = await db.get(
        `SELECT SUM(quantity) as total_items FROM order_items WHERE order_id = ?`,
        [order.id]
      );
      order.total_items = countResult.total_items || 0;
    }

    res.render('orders', {
      title: 'My Orders - CodeAlpha Store',
      orders
    });
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).render('orders', {
      title: 'My Orders - CodeAlpha Store',
      orders: [],
      error: 'Failed to retrieve orders.'
    });
  }
});

// View Specific Order Details / Confirmation
router.get('/orders/:id', requireAuth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const isSuccess = req.query.success === '1';

    const order = await db.get(
      `SELECT * FROM orders WHERE id = ? AND user_id = ?`,
      [orderId, req.session.user.id]
    );

    if (!order) {
      return res.status(404).render('orders', {
        title: 'Order Not Found',
        orders: [],
        error: 'Order not found.'
      });
    }

    const items = await db.all(
      `SELECT oi.*, p.name, p.image_url, p.category 
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    res.render('order_detail', {
      title: `Order #${order.id} - CodeAlpha Store`,
      order,
      items,
      isSuccess
    });
  } catch (err) {
    console.error('Error fetching order details:', err);
    res.redirect('/orders');
  }
});

module.exports = router;
