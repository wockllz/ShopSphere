const bcrypt = require('bcryptjs');
const db = require('./database');

async function seed() {
  console.log('🌱 Initializing database schema...');
  await db.initDb();

  console.log('Checking existing data...');
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  const productCount = await db.get('SELECT COUNT(*) as count FROM products');

  if (userCount.count === 0) {
    console.log('Seeding initial users...');
    const hashedDemoPassword = await bcrypt.hash('password123', 10);
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);

    await db.run(
      `INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)`,
      ['demouser', 'demo@example.com', hashedDemoPassword, 'Alex Morgan', 'user']
    );

    await db.run(
      `INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)`,
      ['admin', 'admin@example.com', hashedAdminPassword, 'System Admin', 'admin']
    );
    console.log('✅ Demo users created:');
    console.log('   - User: demo@example.com / password123');
    console.log('   - Admin: admin@example.com / admin123');
  }

  if (productCount.count === 0) {
    console.log('Seeding initial products...');
    const products = [
      {
        name: 'Wireless Noise-Canceling Headphones',
        description: 'Immerse yourself in rich, dynamic audio with active noise cancellation, 30-hour battery life, and comfortable memory-foam earcups. Perfect for travel, work, or casual listening.',
        price: 199.99,
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        stock: 15,
        featured: 1
      },
      {
        name: 'Smart Fitness & Health Tracker Watch',
        description: 'Track your daily activities, heart rate, sleep quality, and workouts with precision. Water-resistant up to 50m with a vibrant AMOLED display and 7-day battery.',
        price: 129.50,
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        stock: 25,
        featured: 1
      },
      {
        name: 'Ergonomic Premium Gaming & Desk Chair',
        description: 'Designed for ultimate all-day comfort with high-density foam padding, adjustable lumbar support, 4D armrests, and a sturdy steel frame.',
        price: 249.00,
        category: 'Home & Living',
        image_url: 'https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?auto=format&fit=crop&w=800&q=80',
        stock: 8,
        featured: 1
      },
      {
        name: 'Minimalist Genuine Leather Backpack',
        description: 'Crafted from full-grain leather, featuring a padded 15-inch laptop sleeve, water-resistant exterior, and organized interior pockets for work and travel.',
        price: 89.99,
        category: 'Accessories',
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
        stock: 20,
        featured: 1
      },
      {
        name: 'Ultra-HD 4K Action Camera',
        description: 'Capture stunning 4K video at 60fps and 20MP photos in any environment. Includes waterproof case up to 30m, electronic image stabilization, and dual screens.',
        price: 99.95,
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
        stock: 12,
        featured: 0
      },
      {
        name: 'Classic Vintage Denim Jacket',
        description: 'Timeless style crafted from 100% heavy-weight cotton denim. Features button closure, chest pockets, and an adjustable waist tab for a custom fit.',
        price: 64.99,
        category: 'Fashion',
        image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
        stock: 30,
        featured: 0
      },
      {
        name: 'Waterproof Portable Bluetooth Speaker',
        description: 'Deliver rich 360-degree sound with deep bass. Features IPX7 waterproof rating, custom light modes, and up to 15 hours of continuous playtime.',
        price: 49.99,
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
        stock: 18,
        featured: 0
      },
      {
        name: 'Mechanical RGB Mechanical Keyboard',
        description: 'Tactile mechanical switches with per-key RGB backlighting, aircraft-grade aluminum frame, detachable USB-C cable, and programmable macro keys.',
        price: 84.50,
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
        stock: 14,
        featured: 1
      },
      {
        name: 'Organic Cotton Unisex Hoodie',
        description: 'Ultra-soft fleece interior with a relaxed fit, kangaroo front pocket, and double-lined hood. Made ethically from 100% organic combed cotton.',
        price: 54.99,
        category: 'Fashion',
        image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        stock: 22,
        featured: 0
      }
    ];

    for (const p of products) {
      await db.run(
        `INSERT INTO products (name, description, price, category, image_url, stock, featured)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.name, p.description, p.price, p.category, p.image_url, p.stock, p.featured]
      );
    }
    console.log(`✅ Seeded ${products.length} products successfully.`);
  }

  console.log('🎉 Database seeding complete.');
}

if (require.main === module) {
  seed().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}

module.exports = seed;
