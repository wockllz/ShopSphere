const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Homepage & Product Listing
router.get(['/', '/products'], async (req, res) => {
  try {
    const category = req.query.category || 'all';
    const search = req.query.search || '';
    const sort = req.query.sort || 'default';

    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND LOWER(category) = LOWER(?)';
      params.push(category);
    }

    if (search.trim() !== '') {
      sql += ' AND (LOWER(name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (sort === 'price-low') {
      sql += ' ORDER BY price ASC';
    } else if (sort === 'price-high') {
      sql += ' ORDER BY price DESC';
    } else if (sort === 'name') {
      sql += ' ORDER BY name ASC';
    } else {
      sql += ' ORDER BY featured DESC, id DESC';
    }

    const products = await db.all(sql, params);

    // Fetch categories for sidebar/filter navigation
    const categoriesRows = await db.all(
      'SELECT DISTINCT category FROM products ORDER BY category ASC'
    );
    const categories = categoriesRows.map(c => c.category);

    // Get featured products for hero carousel/banner
    const featuredProducts = await db.all(
      'SELECT * FROM products WHERE featured = 1 LIMIT 3'
    );

    res.render('index', {
      title: 'ShopSphere',
      products,
      categories,
      selectedCategory: category,
      searchQuery: search,
      selectedSort: sort,
      featuredProducts
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).render('index', {
      title: 'ShopSphere',
      products: [],
      categories: [],
      selectedCategory: 'all',
      searchQuery: '',
      selectedSort: 'default',
      featuredProducts: [],
      error: 'Failed to load products.'
    });
  }
});

// Single Product Details Page
router.get('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await db.get('SELECT * FROM products WHERE id = ?', [productId]);

    if (!product) {
      return res.status(404).render('index', {
        title: 'Product Not Found',
        products: [],
        categories: [],
        selectedCategory: 'all',
        searchQuery: '',
        selectedSort: 'default',
        featuredProducts: [],
        error: 'Product not found.'
      });
    }

    // Related products in the same category
    const relatedProducts = await db.all(
      'SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4',
      [product.category, product.id]
    );

    res.render('product', {
      title: `${product.name} - ShopSphere`,
      product,
      relatedProducts
    });
  } catch (err) {
    console.error('Error fetching product details:', err);
    res.status(500).redirect('/products');
  }
});

module.exports = router;
