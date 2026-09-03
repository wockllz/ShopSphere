# CodeAlpha_EcommerceStore

A full-stack e-commerce store built for the **CodeAlpha Full Stack Development Internship** (Task 1: Simple E-commerce Store).

## Features

- 🛍️ **Product listings** — browse all products with images, names, and prices
- 📄 **Product details page** — view individual products with full descriptions
- 🛒 **Shopping cart** — add/remove items and adjust quantities
- 💳 **Order processing** — checkout and place orders
- 🔐 **User registration & login** — secure authentication with hashed passwords (bcrypt)
- 🗄️ **Database** — SQLite storage for products, users, cart, and orders

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Backend | Node.js + Express.js |
| Database | SQLite |
| Auth | bcrypt password hashing + session cookies |
| Views | EJS templates |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/wockllz/CodeAlpha_EcommerceStore.git
cd CodeAlpha_EcommerceStore

# 2. Install dependencies
npm install

# 3. Seed the database with sample products
npm run seed

# 4. Start the server
npm start
```

The app runs at **http://localhost:3000**.

### Demo Account

You can register your own account, or use a seeded demo account:

- **Email:** demo@example.com
- **Password:** password123

## Project Structure

```
CodeAlpha_EcommerceStore/
├── server.js            # Express app entry point
├── db/
│   ├── schema.sql       # Database schema
│   ├── seed.js          # Sample data seeder
│   └── database.js      # Database connection
├── routes/
│   ├── auth.js          # Registration / login / logout
│   ├── products.js      # Product listing & details
│   ├── cart.js          # Shopping cart
│   └── orders.js        # Checkout & order history
├── middleware/
│   └── auth.js          # Authentication middleware
├── views/               # EJS templates
├── public/              # Static CSS & JS
└── package.json
```

## How It Works

1. **Browse** — the home page lists all products from the database.
2. **Product details** — click a product to see its full details.
3. **Cart** — logged-in users can add products to their cart and adjust quantities.
4. **Checkout** — placing an order saves it to the database and clears the cart.
5. **Order history** — users can view their past orders and order details.

## Author

**Ntshuxeko Sambo** — CodeAlpha Full Stack Development Intern (Student ID: CA/DF1/260876)
