# Digital Product Store - Server (Backend)

A robust RESTful API server for the Digital Product E-Store built with Node.js, Express.js, TypeScript, and Prisma ORM. This backend provides all the necessary endpoints for product management, order processing, and Stripe payment integration.

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Core Features](#-core-features)
- [Data Models](#-data-models)
- [API Endpoints](#-api-endpoints)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Stripe Integration](#-stripe-integration)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)

## 🎯 Project Overview

The Digital Product Store backend is a RESTful API server that provides:

- **Product Management**: CRUD operations for products
- **Category Management**: CRUD operations for categories
- **Order Processing**: Create orders, process payments, manage order status
- **Stripe Integration**: Secure payment processing with Payment Intents
- **Admin Authentication**: API key-based admin authentication
- **Webhook Handling**: Stripe webhook processing for payment events

## 🛠️ Tech Stack

### Core Technologies

- **Node.js** - JavaScript runtime environment
- **Express.js 5.1** - Web application framework
  - RESTful API design
  - Middleware support
  - Route handlers
  - Error handling

- **TypeScript 5.8** - Type-safe development
  - Full type coverage
  - Type-safe database queries
  - Compile-time error checking

### Database & ORM

- **Prisma 6.9** - Next-generation ORM
  - Type-safe database client
  - Migration management
  - Database schema definition
  - Query builder

- **PostgreSQL** - Relational database
  - ACID compliance
  - Foreign key constraints
  - Transaction support
  - Robust data integrity

### Payment Processing

- **Stripe** - Payment gateway
  - Payment Intents API
  - Webhook handling
  - Test mode support
  - Secure payment processing

### Validation & Security

- **Zod 4.1** - Schema validation
  - Request body validation
  - Type inference from schemas
  - Error handling

- **CORS** - Cross-Origin Resource Sharing
  - Configurable allowed origins
  - Preflight request handling
  - Credentials support

### Additional Libraries

- **Morgan** - HTTP request logger
  - Development logging
  - Request/response tracking

- **Nodemailer** - Email service (optional)
  - Order confirmation emails
  - Status update notifications

- **dotenv** - Environment variable management

## ✨ Core Features

### 3.1 Product Management

- **Get All Products**: List all products with optional filtering
- **Get Product by ID**: Retrieve single product details
- **Create Product**: Add new products (admin only)
- **Update Stock**: Update product stock levels (admin only)
- **Category Association**: Link products to categories

### 3.2 Category Management

- **Get All Categories**: List all categories
- **Get Category by ID**: Retrieve single category
- **Create Category**: Add new categories (admin only)
- **Update Category**: Modify category information (admin only)
- **Auto Slug Generation**: Automatic slug generation from category name

### 3.3 Order Processing

- **Create Order**: Create new orders with items
- **Get Order History**: Retrieve orders by customer email
- **Get Order by ID**: Retrieve single order details
- **Get All Orders**: Admin endpoint to view all orders with filters
- **Update Order Status**: Change order status (admin only)
- **Automatic Stock Management**: Stock decrements when order is paid

### 3.4 Stripe Payment Integration

- **Payment Intent Creation**: Create Stripe payment intents
- **Webhook Handling**: Process Stripe webhook events
- **Payment Status Updates**: Automatic order status updates
- **Test Mode Support**: Full test mode integration

### 3.5 Admin Features

- **API Key Authentication**: Secure admin endpoints
- **Product Management**: Full CRUD for products
- **Category Management**: Full CRUD for categories
- **Order Management**: View and update orders
- **Status Updates**: Manual order status management

## 📊 Data Models

### 4.1 Product

```typescript
{
  id: string (UUID)
  name: string
  description: string | null
  price: number (Float)
  imageUrl: string | null
  stock: number (Int, default: 0)
  categoryId: string (UUID) | null
  createdAt: DateTime
  updatedAt: DateTime
  category: Category | null (relation)
  orderItems: OrderItem[] (relation)
}
```

**Relations**:
- Belongs to `Category` (optional)
- Has many `OrderItem`

### 4.2 Category

```typescript
{
  id: string (UUID)
  name: string
  slug: string (unique)
  createdAt: DateTime
  updatedAt: DateTime
  products: Product[] (relation)
}
```

**Relations**:
- Has many `Product`

### 4.3 Order

```typescript
{
  id: string (UUID)
  customerEmail: string
  totalAmount: number (Float)
  status: OrderStatus (enum: PENDING | PAID | FAILED | CANCELLED)
  stripePaymentIntentId: string | null
  createdAt: DateTime
  updatedAt: DateTime
  items: OrderItem[] (relation)
}
```

**Relations**:
- Has many `OrderItem`

### 4.4 OrderItem

```typescript
{
  id: string (UUID)
  orderId: string (UUID, FK)
  productId: string (UUID, FK)
  price: number (Float)
  quantity: number (Int, default: 1)
  order: Order (relation)
  product: Product (relation)
}
```

**Relations**:
- Belongs to `Order`
- Belongs to `Product`

## 🔌 API Endpoints

### Base URL

```
http://localhost:5000/api
```

### Products API

#### 5.1 GET /api/products

Get all products with optional filtering.

**Query Parameters**:
- `categoryId` (optional): Filter by category UUID
- `search` (optional): Search products by name

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "name": "Product Name",
    "description": "Description",
    "price": 29.99,
    "imageUrl": "https://example.com/image.jpg",
    "stock": 100,
    "categoryId": "category-uuid",
    "category": {
      "id": "category-uuid",
      "name": "Category Name",
      "slug": "category-slug"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### 5.2 GET /api/products/:id

Get a single product by ID.

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Product Name",
  "description": "Description",
  "price": 29.99,
  "imageUrl": "https://example.com/image.jpg",
  "stock": 100,
  "categoryId": "category-uuid",
  "category": { ... },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `400`: Invalid product ID format
- `404`: Product not found

#### 5.3 POST /api/products (Admin Only)

Create a new product.

**Headers**:
```
Content-Type: application/json
x-api-key: your_api_key (optional, currently disabled)
```

**Request Body**:
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 29.99,
  "imageUrl": "https://example.com/image.jpg",
  "stock": 100,
  "categoryId": "category-uuid"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "Product Name",
  "description": "Product description",
  "price": 29.99,
  "imageUrl": "https://example.com/image.jpg",
  "stock": 100,
  "categoryId": "category-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Categories API

#### 5.4 GET /api/categories

Get all categories.

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "name": "Category Name",
    "slug": "category-slug",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### 5.5 POST /api/categories (Admin Only)

Create a new category.

**Headers**:
```
Content-Type: application/json
x-api-key: your_api_key (optional, currently disabled)
```

**Request Body**:
```json
{
  "name": "Category Name",
  "slug": "category-slug"  // Optional, auto-generated if empty
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "Category Name",
  "slug": "category-slug",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Note**: If `slug` is not provided or empty, it will be auto-generated from the category name.

### Orders API

#### 5.6 POST /api/orders

Create a new order.

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ],
  "customerEmail": "customer@example.com"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "customerEmail": "customer@example.com",
  "totalAmount": 59.98,
  "status": "PENDING",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "price": 29.99,
      "quantity": 2,
      "product": {
        "id": "uuid",
        "name": "Product Name",
        "imageUrl": "https://example.com/image.jpg"
      }
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### 5.7 POST /api/orders/:id/payment

Create a Stripe payment intent for an order.

**Response** (200 OK):
```json
{
  "clientSecret": "pi_..._secret_..."
}
```

**Error Responses**:
- `404`: Order not found
- `400`: Order already paid or invalid status

#### 5.8 PUT /api/orders/:id/status (Admin Only)

Update order status.

**Headers**:
```
Content-Type: application/json
x-api-key: your_api_key (optional, currently disabled)
```

**Request Body**:
```json
{
  "status": "PAID"
}
```

**Valid Status Values**:
- `PENDING`
- `PAID`
- `FAILED`
- `CANCELLED`

**Response** (200 OK):
```json
{
  "id": "uuid",
  "status": "PAID",
  ...
}
```

**Note**: When status changes to `PAID`, stock is automatically decremented for all items in the order.

### Additional Endpoints

#### GET /api/orders/history?email=...

Get order history by customer email.

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "customerEmail": "customer@example.com",
    "totalAmount": 99.99,
    "status": "PAID",
    "items": [...],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /api/orders (Admin Only)

Get all orders with optional filtering.

**Query Parameters**:
- `email` (optional): Filter by customer email
- `status` (optional): Filter by order status
- `limit` (optional): Limit number of results
- `offset` (optional): Offset for pagination

#### GET /api/orders/:id

Get order by ID.

#### POST /api/webhooks/stripe

Stripe webhook endpoint for payment events.

## 📦 Installation & Setup

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- PostgreSQL database (or Prisma Postgres account)

### Step 1: Install Dependencies

```bash
cd server
npm install
```

This will install all required packages including:
- Express.js
- Prisma
- Stripe
- TypeScript
- And other dependencies

### Step 2: Environment Configuration

Create a `.env` file in the `server` directory:

```bash
cp env.example .env
```

Or create manually:

```bash
touch .env
```

### Step 3: Configure Environment Variables

Edit the `.env` file with your configuration (see Environment Variables section below).

### Step 4: Database Setup

See [Database Setup](#-database-setup) section for detailed instructions.

Quick setup:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### Step 5: Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

You should see:
```
🚀 Server ready at: http://localhost:5000
```

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/dbname` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PORT` | Server port number | `5000` | `5000` |
| `NODE_ENV` | Environment mode | `development` | `production` |
| `ADMIN_API_KEY` | Admin API key | - | `your-secure-key` |
| `EMAIL_HOST` | SMTP server host | - | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP server port | - | `587` |
| `EMAIL_USER` | SMTP username | - | `your-email@gmail.com` |
| `EMAIL_PASS` | SMTP password | - | `your-app-password` |
| `EMAIL_FROM` | Sender email address | - | `noreply@yourstore.com` |

### Environment Variable Details

#### DATABASE_URL

- **Purpose**: PostgreSQL database connection string
- **Format**: `postgresql://user:password@host:port/database?schema=public`
- **Example**: `postgresql://postgres:password@localhost:5432/digital_product_store?schema=public`

#### STRIPE_SECRET_KEY

- **Purpose**: Stripe secret key for server-side operations
- **Source**: Stripe Dashboard → Developers → API keys
- **Format**: Starts with `sk_test_` (test) or `sk_live_` (production)
- **Security**: Never expose in client code

#### STRIPE_WEBHOOK_SECRET

- **Purpose**: Webhook signing secret for verifying Stripe webhooks
- **Source**: Stripe Dashboard → Webhooks → Endpoint → Signing secret
- **Format**: Starts with `whsec_`
- **Security**: Keep secret, used to verify webhook authenticity

#### CLIENT_URL

- **Purpose**: Frontend URL for CORS configuration
- **Format**: Full URL including protocol
- **Example**: `http://localhost:3000` (development) or `https://yourdomain.com` (production)

#### ADMIN_API_KEY

- **Purpose**: API key for admin authentication
- **Security**: Use strong, randomly generated keys
- **Usage**: Include in request headers: `x-api-key: your_key`
- **Note**: Currently disabled for development (see `server/src/middleware/auth.ts`)

## 🗄️ Database Setup

### Option 1: Prisma Postgres (Recommended for Quick Start)

1. **Create a Prisma account** at [prisma.io](https://www.prisma.io/)

2. **Create a new database**:
   ```bash
   npx prisma init --db
   ```

3. **Follow the prompts** to create your database

4. **Copy the connection string** to your `.env` file

5. **Run migrations**:
   ```bash
   npx prisma migrate dev
   ```

### Option 2: Local PostgreSQL

1. **Install PostgreSQL** on your machine

2. **Create a database**:
   ```sql
   CREATE DATABASE digital_product_store;
   ```

3. **Update `.env` file**:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/digital_product_store?schema=public"
   ```

4. **Run migrations**:
   ```bash
   npx prisma migrate dev
   ```

### Database Migrations

**Create a new migration**:
```bash
npx prisma migrate dev --name migration_name
```

**Apply migrations in production**:
```bash
npx prisma migrate deploy
```

**View database in Prisma Studio**:
```bash
npx prisma studio
```

**Reset database** (⚠️ deletes all data):
```bash
npx prisma migrate reset
```

## 💳 Stripe Integration

### Setup

1. **Create a Stripe Account** at [stripe.com](https://stripe.com)

2. **Get API Keys**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Copy your **Secret key** (starts with `sk_test_`)
   - Add to `.env` as `STRIPE_SECRET_KEY`

3. **Configure Webhooks**:
   - Go to [Webhooks](https://dashboard.stripe.com/test/webhooks)
   - Click "Add endpoint"
   - Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook signing secret (starts with `whsec_`)
   - Add to `.env` as `STRIPE_WEBHOOK_SECRET`

### Test Cards

Use these test card numbers for testing:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Visa - Success |
| `4000 0000 0000 0002` | Visa - Card declined |
| `4000 0025 0000 3155` | Visa - Requires authentication |

**Test Details**:
- **Expiry Date**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

### Payment Flow

1. **Customer creates order** via `POST /api/orders`
2. **Payment intent is created** via `POST /api/orders/:id/payment`
3. **Customer confirms payment** on frontend
4. **Stripe processes payment**
5. **Webhook updates order status** (if configured)
6. **Stock is decremented** when order status changes to PAID

## 🚀 Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production server
npm start

# Database commands
npx prisma generate          # Generate Prisma Client
npx prisma migrate dev       # Create and apply migration
npx prisma migrate deploy    # Apply migrations (production)
npx prisma studio            # Open Prisma Studio GUI
npx prisma db seed           # Seed database
```

### Development Server

The development server runs on `http://localhost:5000` by default.

Features:
- Hot reload with `ts-node-dev`
- TypeScript compilation
- Morgan request logging
- Error handling

### Code Structure

```
server/
├── src/
│   ├── config/        # Configuration files
│   ├── controllers/   # Route controllers
│   ├── middleware/    # Express middleware
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── utils/         # Utility functions
│   └── index.ts       # Entry point
└── prisma/
    ├── schema.prisma  # Database schema
    └── migrations/    # Migration files
```

## 📁 Project Structure

```
server/
│
├── src/                          # Source Code
│   ├── config/                   # Configuration Files
│   │   ├── cors.ts               # CORS configuration
│   │   ├── env.ts                # Environment variable validation
│   │   ├── prisma.ts             # Prisma client instance
│   │   └── stripe.ts             # Stripe client instance
│   │
│   ├── controllers/              # Route Controllers
│   │   ├── categoryController.ts # Category CRUD operations
│   │   ├── orderController.ts    # Order management
│   │   ├── productController.ts  # Product CRUD operations
│   │   └── webhookController.ts  # Stripe webhook handler
│   │
│   ├── middleware/               # Express Middleware
│   │   └── auth.ts               # Admin authentication middleware
│   │
│   ├── routes/                   # API Routes
│   │   ├── categories/           # Category routes
│   │   │   └── index.ts
│   │   ├── orders/               # Order routes
│   │   │   └── index.ts
│   │   ├── products/             # Product routes
│   │   │   └── index.ts
│   │   └── index.ts              # Main router
│   │
│   ├── services/                 # Business Logic Services
│   │   └── emailService.ts       # Email sending service
│   │
│   ├── utils/                    # Utility Functions
│   │   ├── errors.ts             # Error handling utilities
│   │   └── validation.ts        # Zod validation schemas
│   │
│   └── index.ts                  # Express app entry point
│
├── prisma/                       # Prisma ORM
│   ├── migrations/               # Database migrations
│   │   └── [timestamp]_[name]/  # Migration files
│   ├── schema.prisma             # Database schema definition
│   └── seed.ts                   # Database seeding script
│
├── .env                          # Environment variables (gitignored)
├── env.example                   # Environment variables example
├── package.json                  # Dependencies and scripts
└── tsconfig.json                 # TypeScript configuration
```

## 🚢 Deployment

### Prerequisites

Before deploying, ensure you have:
- ✅ Git repository with your code
- ✅ Production database (PostgreSQL)
- ✅ Stripe account with production keys
- ✅ Environment variables ready

### Option A: Railway (Recommended)

Railway is recommended for its simplicity and built-in PostgreSQL support.

#### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project

#### Step 2: Deploy from GitHub
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository
4. Select the **`server`** folder as the root directory (or set Root Directory to `server`)

#### Step 3: Add PostgreSQL Database
1. In your Railway project, click **"New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a database
4. Copy the `DATABASE_URL` from the database service variables

#### Step 4: Configure Environment Variables
In Railway project settings → Variables, add:

```env
DATABASE_URL=<from_postgres_service>
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-client-domain.vercel.app
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_API_KEY=<generate_strong_random_string>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@yourstore.com
```

#### Step 5: Configure Build Settings
In Railway project settings → Deploy:

- **Build Command**: `npm install && npx prisma generate`
- **Start Command**: `npx prisma migrate deploy && npx ts-node src/index.ts`

**Note**: For production, you may want to add build scripts to `package.json`:
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "postinstall": "prisma generate"
  }
}
```

Then use: `npx prisma migrate deploy && npm start`

#### Step 6: Deploy
Railway will automatically deploy on every push to your main branch.

### Option B: Render

Render provides free tier hosting with PostgreSQL support.

#### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

#### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `digital-product-store-api`
   - **Environment**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npx prisma migrate deploy && npx ts-node src/index.ts`

#### Step 3: Add PostgreSQL Database
1. Click **"New +"** → **"PostgreSQL"**
2. Create a new PostgreSQL database
3. Copy the **Internal Database URL**

#### Step 4: Set Environment Variables
In Web Service → Environment, add all required variables (same as Railway).

#### Step 5: Deploy
Render will automatically deploy on every push.

### Option C: Heroku

#### Step 1: Install Heroku CLI
```bash
# macOS
brew install heroku/brew/heroku

# Windows
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

#### Step 2: Login and Create App
```bash
heroku login
cd server
heroku create your-app-name
```

#### Step 3: Add PostgreSQL
```bash
heroku addons:create heroku-postgresql:mini
```

#### Step 4: Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set CLIENT_URL=https://your-client-domain.vercel.app
heroku config:set STRIPE_SECRET_KEY=sk_live_...
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...
heroku config:set ADMIN_API_KEY=<your_strong_key>
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER=your-email@gmail.com
heroku config:set SMTP_PASSWORD=your_app_password
heroku config:set SMTP_FROM=noreply@yourstore.com
```

#### Step 5: Deploy
```bash
git push heroku main
```

#### Step 6: Run Migrations
```bash
heroku run npx prisma migrate deploy
```

### Option D: Manual Deployment (VPS/Server)

#### Step 1: Prepare Server
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib
```

#### Step 2: Clone Repository
```bash
git clone https://github.com/yourusername/digital-product-store.git
cd digital-product-store/server
```

#### Step 3: Install Dependencies
```bash
npm install
```

#### Step 4: Configure Environment
```bash
cp env.example .env
# Edit .env with your production values
```

#### Step 5: Setup Database
```bash
# Create database
sudo -u postgres psql
CREATE DATABASE digital_product_store;
\q

# Run migrations
npx prisma migrate deploy
```

#### Step 6: Build and Start
```bash
# Build TypeScript (if you add build script)
npm run build

# Or run directly with ts-node
npx ts-node src/index.ts
```

#### Step 7: Use PM2 for Process Management
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/index.ts --interpreter ts-node --name "digital-store-api"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Changing Database URL

If you need to change your database URL after deployment:

1. **Update Environment Variable**:
   - Railway: Project → Variables → Update `DATABASE_URL`
   - Render: Web Service → Environment → Update `DATABASE_URL`
   - Heroku: `heroku config:set DATABASE_URL=new_url`

2. **Run Migrations**:
   ```bash
   # Railway/Render: Use their CLI or run in shell
   npx prisma migrate deploy
   
   # Heroku
   heroku run npx prisma migrate deploy
   ```

3. **Restart Application**:
   - Railway/Render: Redeploy or restart service
   - Heroku: `heroku restart`

### Post-Deployment Checklist

- [ ] Server is running and accessible
- [ ] Database migrations applied successfully
- [ ] Environment variables configured correctly
- [ ] API endpoints responding (test `/api`)
- [ ] CORS configured for production client URL
- [ ] Stripe webhook endpoint configured
- [ ] Test payment flow end-to-end
- [ ] Admin panel accessible
- [ ] Email service configured (if using)

### Stripe Webhook Configuration

After deploying your server:

1. **Get Your Server URL**:
   - Railway: `https://your-app.railway.app`
   - Render: `https://your-app.onrender.com`
   - Heroku: `https://your-app.herokuapp.com`

2. **Configure Webhook in Stripe**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
   - Click **"Add endpoint"**
   - Endpoint URL: `https://your-server-url/api/webhooks/stripe`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Copy the **Signing secret** (`whsec_...`)
   - Add to your server environment variables as `STRIPE_WEBHOOK_SECRET`

3. **Test Webhook**:
   - Use Stripe CLI: `stripe listen --forward-to https://your-server-url/api/webhooks/stripe`
   - Or test from Stripe Dashboard → Webhooks → Send test webhook

### Troubleshooting Deployment

#### Build Fails
- Check Node.js version (requires 18+)
- Verify all dependencies in `package.json`
- Check build logs for specific errors

#### Database Connection Errors
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/dbname`
- Check database is accessible from deployment platform
- Verify firewall/network settings

#### CORS Errors
- Ensure `CLIENT_URL` matches your frontend domain exactly
- Check CORS configuration in `src/config/cors.ts`
- Verify no trailing slashes in URLs

#### Prisma Client Not Generated
- Ensure `npx prisma generate` runs during build
- Check Prisma schema is valid: `npx prisma validate`

#### Application Won't Start
- Check environment variables are set
- Verify PORT is available (or use platform's PORT env var)
- Review application logs for errors

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Verify database credentials
- Check firewall settings

#### CORS Errors

- Verify `CLIENT_URL` matches frontend URL
- Check CORS configuration in `src/config/cors.ts`
- Ensure frontend URL is in allowed origins

#### Port Already in Use

- Change `PORT` in `.env`
- Kill existing process on port 5000

#### Prisma Client Not Generated

```bash
npx prisma generate
```

#### Stripe Webhook Errors

- Verify webhook secret is correct
- Check webhook endpoint URL
- Verify webhook events are selected in Stripe dashboard

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Note**: This is the backend server application. Make sure the database is set up and environment variables are configured before starting.
