# RIWAYA - Complete MERN E-commerce & ERP

RIWAYA is a full-stack MERN ecommerce platform for a premium Pakistani clothing brand, with a customer storefront and a staff ERP/admin panel.

Yeh project ek complete **end-to-end MERN stack application** hai jo bridal, embroidered, formal aur casual clothing kay liye design ki gayi hai. Storefront pe customers shopping kar saktay hain, aur admin panel sy aap **warehouses, stock, suppliers, purchase orders, employees, orders, payments aur finance** sab kuch manage kar saktay hain.

**Current status:** GitHub-ready, build verified, and high-severity dependency audits cleared on 2026-06-14.

---

## Table of Contents

1. [Project Ka Overview](#1-project-ka-overview)
2. [Prerequisites — Pehle Kya Install Karna Hai](#2-prerequisites)
3. [Folder Structure](#3-folder-structure)
4. [MongoDB Setup](#4-mongodb-setup)
5. [Backend Setup & Run](#5-backend-setup--run)
6. [Frontend Setup & Run](#6-frontend-setup--run)
7. [Default Credentials](#7-default-credentials)
8. [Architecture Overview](#8-architecture-overview)
9. [Roles & Permissions](#9-roles--permissions)
10. [Backend Modules](#10-backend-modules)
11. [API Endpoints Overview](#11-api-endpoints-overview)
12. [Frontend Routes](#12-frontend-routes)
13. [Core Business Flows](#13-core-business-flows)
14. [File Uploads](#14-file-uploads)
15. [Security](#15-security)
16. [Recent Audit Fixes (2026-05-17)](#16-recent-audit-fixes-2026-05-17)
17. [Test Flow — End-to-End Demo](#17-test-flow)
18. [Common Commands](#18-common-commands)
19. [Environment Variables](#19-environment-variables)
20. [Troubleshooting](#20-troubleshooting)
21. [Deployment Notes](#21-deployment-notes)
22. [Roadmap & What's Built vs Future](#22-roadmap)
23. [Quick Start Checklist](#23-quick-start-checklist)

---

## 1. Project Ka Overview

**Brand:** RIWAYA (Pakistan-based clothing — bridal, embroidered, formal, casual)

**Features:**

### A. Storefront (customers)
- Home page with featured/bestseller products
- Product catalog with filters & sort
- Product detail with variants, image gallery, stock status
- Cart + Wishlist (anonymous cart supported; merges on login)
- Checkout with shipping address + payment method
- Order tracking by order number ("My Orders" + "Track Order" appear in the navbar only when signed in)
- "My Orders" order history
- Editable profile — name, phone & change password
- Contact page (store details + message form) and a redesigned About brand-story page
- Register / Login / Logout
- Luxury gold/ivory/charcoal theme with entrance/hover animations and real-time cart/wishlist updates

### B. Admin Panel (staff-only)
- **Warehouses** — multi-warehouse, multi-floor, racks, rack categories
- **Equipment** — non-stock assets (printers, machines, fixtures) with vendor + warranty
- **Suppliers / Mills** — with NTN, GST, bank details
- **Purchase Orders** — full lifecycle (draft → placed → partial received → fully received → closed) with payments
- **Stock Items** — receive, transfer, adjust, write-off with low-stock alerts
- **Products + Categories** — frontend visibility toggle, **Featured** toggle (feeds the home "Featured Pieces"), and per-category **image upload** (feeds the home "Shop by Category")
- **Dashboard** — operations snapshot + inline **employee management** (add/edit/remove, status, salary + payroll summary)
- **Customers** — online + walk-in
- **Employees** — with departments, salary fields
- **Orders** — online + physical/POS with full status lifecycle
- **Payments** — Cash, COD, Stripe, JazzCash, EasyPaisa, Bank Transfer, Cheque (refund-guarded)
- **Finance** — revenue, expenses, profit, receivables, payables with charts
- **Reports** — sales over time, top products, inventory health, activity feed
- **3 user roles:** `super_admin`, `admin`, `customer`

**Currency & Locale:**
- Currency: **PKR** (Pakistan Rupee)
- Date format: `dd MMM yyyy`
- Provinces: Punjab, Sindh, KPK, Balochistan, Islamabad, Gilgit-Baltistan, AJK
- Tax IDs supported: NTN, GST, CNIC

---

## 2. Prerequisites

Yeh cheezein pehle aapke system pe install honi chahiye:

| Tool          | Minimum Version | Install Link                                                            |
| ------------- | --------------- | ----------------------------------------------------------------------- |
| **Node.js**   | v18.0+          | https://nodejs.org/en/download                                          |
| **MongoDB**   | v6.0+           | https://www.mongodb.com/try/download/community (ya Atlas — instructions neeche) |
| **npm**       | v9+             | Node.js ke saath aata hai                                               |
| Git           | latest          | https://git-scm.com (optional)                                          |
| Code editor   | —               | VS Code recommend hai: https://code.visualstudio.com                    |

**Check karne ke liye terminal mein run karain:**

```powershell
node --version    # v18.x ya zyada
npm --version     # v9.x ya zyada
mongod --version  # v6.x ya zyada (agar local MongoDB hai)
```

---

## 3. Folder Structure

```
Ecom-Project/
├── README.md                       ← yeh file
├── backend/                        ← Node + Express API server
│   ├── .env                        ← environment variables (already configured)
│   ├── .env.example                ← template
│   ├── package.json
│   ├── scripts/
│   │   ├── seedSuperAdmin.js       ← first super admin create karne ka script
│   │   ├── seedDemoData.js         ← demo warehouse + 6 products + initial stock
│   │   └── listRoutes.js           ← saari registered routes ki list
│   └── src/
│       ├── server.js               ← entry point
│       ├── app.js                  ← express app builder (middleware, routes)
│       ├── config/
│       │   ├── env.js              ← typed env loader
│       │   └── db.js               ← mongoose connection
│       ├── middleware/
│       │   ├── auth.middleware.js  ← JWT verify, populates req.user
│       │   ├── role.middleware.js  ← ROLES enum + authorize() helper
│       │   ├── error.middleware.js ← 404 + central error handler
│       │   └── upload.middleware.js ← Multer + Cloudinary config
│       ├── utils/                  ← ApiError, ApiResponse, asyncHandler, counter, generateToken
│       ├── routes/index.js         ← mounts all module routers under /api
│       └── modules/                ← feature-based modules
│           ├── auth/               (login, register, me, logout)
│           ├── user/               (User schema — shared)
│           ├── warehouse/          (warehouse + floor + rack + rack-category)
│           ├── equipment/          (equipment + categories)
│           ├── supplier/
│           ├── purchase-order/
│           ├── stock/              (stock-item, stock-entry, stock-movement)
│           ├── product-category/
│           ├── product/            (admin routes + public storefront routes)
│           ├── customer/
│           ├── employee/
│           ├── order/              (admin routes + customer storefront routes)
│           ├── payment/
│           ├── finance/
│           ├── cart/
│           ├── wishlist/
│           ├── reports/
│           └── upload/
└── frontend/                       ← Vite + React SPA
    ├── .env                        ← VITE_API_URL etc.
    ├── package.json
    ├── vite.config.js              ← /api proxy to backend
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx                 ← session rehydration on boot
        ├── index.css               ← Tailwind + theme variables
        ├── lib/                    ← format helpers (PKR currency, dates), utils, hooks
        ├── store/                  ← Redux store + slices (auth, cart, ui)
        ├── api/                    ← RTK Query slices (har backend module ke liye)
        ├── components/
        │   ├── ui/                 ← Button, Input, Dialog, etc.
        │   ├── storefront/         ← ProductCard, ProductImage, etc.
        │   └── admin/
        ├── layouts/
        │   ├── StorefrontLayout.jsx
        │   └── AdminLayout.jsx
        ├── routes/                 ← AppRouter + role guards
        └── pages/
            ├── storefront/         ← Home, Products, ProductDetail, Cart, Checkout,
            │                          Login, Register, Profile, MyOrders,
            │                          OrderTracking, Wishlist, About
            └── admin/              ← Dashboard, Warehouses, Stock, Products,
                                       Orders, Payments, Finance, Reports,
                                       Suppliers, PurchaseOrders, Employees,
                                       Customers, Equipment, Categories, ...
```

**Project discipline rules:**
- Har module ka apna folder (feature-based, not layer-based)
- Files mein **1500 lines se zyada nahi**
- Backend aur frontend bilkul **separate folders**
- Service layer business logic ke liye, controllers sirf HTTP handling
- Saari mutations Zod validators sy guard hain
- Role-based middleware har sensitive route pe

---

## 4. MongoDB Setup

Aapke paas **2 options** hain. Koi bhi ek choose kar lain:

### Option A: Local MongoDB (recommended for dev)

1. **Install karain:**
   - Windows: https://www.mongodb.com/try/download/community → MSI installer download karain → install
   - Mac: `brew install mongodb-community`
   - Linux: https://www.mongodb.com/docs/manual/administration/install-on-linux/

2. **Service start karain:**
   - **Windows:** MongoDB automatically start ho jaata hai installation ke baad. Verify:
     ```powershell
     net start MongoDB
     ```
   - **Mac:** `brew services start mongodb-community`
   - **Linux:** `sudo systemctl start mongod`

3. **Connection URL (default):**
   ```
   mongodb://127.0.0.1:27017/riwaya
   ```
   Yeh URL pehle se `backend/.env` mein set hai. Database `riwaya` automatically create ho jaayega jab aap pehli baar koi data save karenge.

### Option B: MongoDB Atlas (cloud, free tier)

Agar local install nahi karna, ya cloud DB chahiye:

1. https://www.mongodb.com/cloud/atlas par account banayein (free)
2. **M0 Free Cluster** create karain (512MB, sufficient for development)
3. **Database User** banayein (username + password yaad rakhain)
4. **Network Access** mein "Allow Access From Anywhere" (`0.0.0.0/0`) add karain
5. Cluster ke "Connect" → "Connect your application" → **connection string copy karain**:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/riwaya
   ```
6. `backend/.env` file open karain aur `MONGO_URI` replace karain:
   ```env
   MONGO_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/riwaya
   ```

---

## 5. Backend Setup & Run

Ek terminal khol kar:

```powershell
# 1. Backend folder mein jaayein
cd backend

# 2. Dependencies install karain (pehli baar ~30 seconds)
npm install

# 3. .env file create karain (.env.example se copy karke)
copy .env.example .env
# Phir .env open karke JWT_SECRET set karain (32+ random characters)

# 4. Seed the first super admin (zaroori hai login ke liye)
npm run seed:admin
```

**Output:**

```
✓ MongoDB connected: 127.0.0.1/riwaya
✓ Super admin created
  Name:     RIWAYA Super Admin
  Email:    superadmin@riwaya.com
  Password: Super@1234
  ⚠ Change this password after first login.
```

```powershell
# 5. (Optional) Demo data seed — warehouse, 6 products, initial stock
npm run seed:demo
```

**Output (excerpt):**
```
--- RIWAYA Demo Data Seeder ---
  ✓ Using admin: superadmin@riwaya.com
  ✓ Created warehouse: RIWAYA Lahore Flagship
  ✓ Created 4 rack categories, 4 racks
  ✓ Created 4 product categories
  ✓ Created 6 demo products (with initial stock)
--- Done! ---
```

```powershell
# 6. Backend dev server start karain
npm run dev
```

**Output:**

```
✓ MongoDB connected: 127.0.0.1/riwaya
✓ RIWAYA API running in development mode on http://localhost:5000
```

> Backend ab `http://localhost:5000` pe chal raha hai. Iss terminal ko **chalta rehne dain**. Health check ke liye browser mein khol kar dekh sakte hain:
>
> http://localhost:5000/api/health → `{ "success": true, "message": "RIWAYA API is healthy", "timestamp": "..." }`

---

## 6. Frontend Setup & Run

**Doosra terminal khol kar** (backend wala band nahi karna):

```powershell
# 1. Frontend folder mein jaayein
cd frontend

# 2. Dependencies install karain (pehli baar ~45 seconds)
npm install

# 3. Frontend dev server start karain
npm run dev
```

**Output:**

```
  VITE v5.x.x  ready in 800 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Browser mein khol lain: **http://localhost:5173**

---

## 7. Default Credentials

### Super Admin (full access — admin panel + storefront)

```
URL:      http://localhost:5173/admin/login
Email:    superadmin@riwaya.com
Password: Super@1234
```

Login karne ke baad super admin **automatically `/admin` pe redirect** ho jaata hai.

> **First login ke baad password change karain** real environment mein.

### Customer (regular shopping user)

Koi pre-seeded customer nahi hai. 2 tareeqe se ek banaya ja sakta hai:

1. **UI se register karein:** `http://localhost:5173/register` — form fill karain
2. **Quick test account:** koi bhi email like `tayyab@test.com` / `Test@1234` chal jaayega

### Admin / Staff (super_admin ke alawa)

Super admin login kar ke Employees module se admin / staff accounts bana sakta hai.

| Role | Kaisay banaye |
|------|---------------|
| `super_admin` | Sirf seed script se |
| `admin` | Super admin Employees module se invite kare |
| `customer` | Self-register `/register` se YA guest checkout pe auto-create |

---

## 8. Architecture Overview

```
                  ┌────────────────────────┐
   Browser  ──→   │  React + Vite (5173)   │
                  │  (Storefront + Admin)  │
                  └────────────┬───────────┘
                               │ HTTPS / cookies + Bearer JWT
                               ▼
                  ┌────────────────────────┐
                  │   Express API (5000)   │
                  │   /api/*  +  /uploads  │
                  └────────────┬───────────┘
                               │ Mongoose
                               ▼
                  ┌────────────────────────┐
                  │       MongoDB          │
                  │   (riwaya database)    │
                  └────────────────────────┘

                  ┌────────────────────────┐
                  │      Cloudinary        │
                  │   (product images)     │
                  └────────────────────────┘
                          ▲
                          │ Upload via Multer
                          │ (with local /uploads fallback)
                  (Express /api/uploads route)
```

**Request lifecycle on the backend:**

```
Request
  │
  ▼
Helmet → mongoSanitize → CORS → JSON/cookie parsers → Morgan → Rate limiter
  │
  ▼
/api router  ──→  module router  ──→  auth middleware → role middleware → validator (Zod)
  │
  ▼
Controller  ──→  Service (business logic)  ──→  Mongoose model
  │
  ▼
ApiResponse  (uniform { success, data, message })  OR  errorHandler (uniform error)
```

---

## 9. Roles & Permissions

Defined in [backend/src/middleware/role.middleware.js](backend/src/middleware/role.middleware.js):

```js
ROLES = { SUPER_ADMIN: 'super_admin', ADMIN: 'admin', CUSTOMER: 'customer' }
```

| Role | Can do |
|------|--------|
| **super_admin** | Sab kuch. Employees manage karta hai, role assignments, finance, saare admin modules. |
| **admin** | Day-to-day operations: products, stock, orders, customers, suppliers. Employees ya roles manage nahi kar sakta. |
| **customer** | Sirf storefront: browse, cart, wishlist, checkout, apne orders, profile edit. |

Three guard helpers exported:
- `isStaff` — admin or super_admin
- `isSuperAdmin` — super_admin only
- `isCustomer` — customer only

---

## 10. Backend Modules

Each module lives at `backend/src/modules/<name>/` and exports `model → validator → service → controller → routes`.

| # | Module | Mongo collections | Purpose |
|---|--------|-------------------|---------|
| 1 | **auth** | (uses User) | Register, login, /me, logout, JWT issuance |
| 2 | **user** | `users` | User schema (shared by auth + employee + customer) |
| 3 | **warehouse** | `warehouses` | Multi-location warehouses |
| 3a | **warehouse/floor** | `floors` | Floors inside a warehouse |
| 3b | **warehouse/rack-category** | `rackcategories` | Logical rack groupings (Bridal, Formal, …) |
| 3c | **warehouse/rack** | `racks` | Physical storage racks |
| 4 | **equipment-category** | `equipmentcategories` | Asset categorization |
| 4a | **equipment** | `equipments` | Non-stock assets (machines, fixtures) |
| 5 | **supplier** | `suppliers` | Suppliers / vendors / mills |
| 5a | **purchase-order** | `purchaseorders` | PO lifecycle (draft → placed → received → closed) |
| 6 | **stock/stock-item** | `stockitems` | SKU-level master record |
| 6a | **stock/stock-entry** | `stockentries` | Quantity of a stock-item in a specific rack |
| 6b | **stock/stock-movement** | `stockmovements` | Audit trail of every stock change |
| 7 | **product-category** | `productcategories` | Customer-facing categories |
| 7a | **product** | `products` | Storefront catalog (admin CRUD + public read) |
| 8 | **customer** | `customers` | Customer profile (linked to a `User`) |
| 9 | **employee** | `employees` | Staff records |
| 10 | **order** | `orders` | Online + physical orders (with snapshots) |
| 11 | **payment** | `payments` | Payment records (with double-refund guard) |
| 12 | **finance** | `financeentries` | Revenue, expenses, P&L |
| 13 | **cart** | `carts` | Per-customer cart |
| 14 | **wishlist** | `wishlists` | Per-customer wishlist |
| 15 | **reports** | (composite) | Dashboard summary endpoints |
| 16 | **upload** | (Cloudinary + disk) | Generic image upload endpoint |

---

## 11. API Endpoints Overview

**Total: ~120 endpoints** across the modules. All routes mounted under `/api`. See [backend/src/routes/index.js](backend/src/routes/index.js) for the master list.

### Health
- `GET /api/health` — health check

### Auth (`/api/auth`)
- `POST /register` — customer self-signup
- `POST /login` — returns JWT in httpOnly cookie + body
- `GET /me` — current user (requires auth)
- `POST /logout` — clears cookie
- `POST /create-staff` — super admin creates admin/staff
- `POST /change-password` — change own password

### Public storefront (no auth)
- `GET /api/storefront/categories` — published categories
- `GET /api/storefront/products` — list (filter, sort, paginate)
- `GET /api/storefront/products/:slug` — detail with populated variants/stock
- `GET /api/storefront/orders/track/:orderNumber` — public-ish tracking

### Customer endpoints (requires `customer` role)
- `GET|POST /api/cart` — view / add / update / remove items
- `GET|POST /api/wishlist`
- `POST /api/storefront/orders` — place order from cart
- `GET /api/storefront/orders/me` — my orders

### Admin endpoints (requires staff role)

| Resource | Base URL | Endpoints |
| ------------------ | ------------------------------ | --------- |
| Auth               | `/api/auth`                    | 7         |
| Warehouses         | `/api/warehouses`              | 6         |
| Floors             | `/api/floors`                  | 4         |
| Rack Categories    | `/api/rack-categories`         | 4         |
| Racks              | `/api/racks`                   | 4         |
| Equipment          | `/api/equipment`               | 6         |
| Equipment Cats     | `/api/equipment-categories`    | 4         |
| Suppliers          | `/api/suppliers`               | 4         |
| Purchase Orders    | `/api/purchase-orders`         | 11        |
| Stock Items        | `/api/stock-items`             | 11        |
| Stock Movements    | `/api/stock-movements`         | 1         |
| Product Categories | `/api/product-categories`      | 5         |
| Products           | `/api/products`                | 7         |
| Customers          | `/api/customers`               | 11        |
| Employees          | `/api/employees`               | 10        |
| Orders             | `/api/orders`                  | 7         |
| Payments           | `/api/payments`                | 7         |
| Finance            | `/api/finance`                 | 6         |
| Cart               | `/api/cart`                    | 7         |
| Wishlist           | `/api/wishlist`                | 6         |
| Reports            | `/api/reports`                 | 6         |
| Uploads            | `/api/uploads`                 | 2         |
| Storefront (public)| `/api/storefront/*`            | 7         |

Saari registered routes dekhne ke liye:

```powershell
cd backend
node scripts/listRoutes.js
```

### Response shape

All endpoints return one of:
```json
{ "success": true, "data": { /* payload */ }, "message": "OK" }
```
or on error:
```json
{ "success": false, "message": "...", "errors": [ ... ] }
```

---

## 12. Frontend Routes

Defined in [frontend/src/routes/AppRouter.jsx](frontend/src/routes/AppRouter.jsx).

### Storefront (public + customer)
| Path | Page | Auth |
|------|------|------|
| `/` | Home | public |
| `/about` | About | public |
| `/contact` | Contact | public |
| `/products` | Product listing | public |
| `/products/:slug` | Product detail | public |
| `/cart` | Cart | public (anonymous cart supported) |
| `/wishlist` | Wishlist | customer |
| `/checkout` | Checkout | customer |
| `/orders` | My Orders | customer |
| `/track` | Order tracking | public (needs order number) |
| `/profile` | Profile | customer |
| `/login` | Storefront login | public |
| `/register` | Storefront register | public |

### Admin
| Path | Page | Role |
|------|------|------|
| `/admin/login` | Admin login | public |
| `/admin` | Dashboard | staff |
| `/admin/warehouses` | Warehouses + floors + racks | staff |
| `/admin/stock` | Stock items | staff |
| `/admin/stock-movements` | Movement history | staff |
| `/admin/products` | Product catalog | staff |
| `/admin/categories` | Product + rack categories | staff |
| `/admin/orders` | All orders | staff |
| `/admin/orders/:id` | Order detail | staff |
| `/admin/payments` | Payments | staff |
| `/admin/finance` | Finance | staff |
| `/admin/suppliers` | Suppliers | staff |
| `/admin/purchase-orders` | POs | staff |
| `/admin/purchase-orders/:id` | PO detail | staff |
| `/admin/customers` | Customer directory | staff |
| `/admin/employees` | Employees | super_admin |
| `/admin/equipment` | Equipment | staff |
| `/admin/rack-categories` | Rack categories | staff |
| `/admin/reports` | Reports | staff |
| `/admin/guide` | Getting-started guide | staff |

---

## 13. Core Business Flows

### A. Stock Hierarchy

```
Warehouse  ──has many──▶  Floor  ──has many──▶  Rack  ──has many──▶  StockEntry  ──belongs to──▶  StockItem (SKU)
                                                                                                    │
                                                                                                    │ used as variant in
                                                                                                    ▼
                                                                                                 Product
```

- **StockItem** = a SKU (e.g. `BRD-VEL-001`) with cost, reorder level, tags.
- **StockEntry** = "X units of StockItem Y are in Rack Z." One entry per (item × rack) combination.
- **StockMovement** = audit row written on every receive / transfer / adjust / sale.

### B. Order Placement (online)

```
Customer browses  →  adds to Cart  →  Checkout (address + shipping + payment method)
   │
   ▼
POST /api/storefront/orders
   │
   ├─▶ Validate cart not empty (re-checked at submit — audit fix #8)
   ├─▶ Pre-flight stock check for every item (audit fix #4)
   ├─▶ Create Order document (with snapshots of product name/SKU/image/price)
   ├─▶ Deduct stock atomically per rack
   ├─▶ Write StockMovement rows
   ├─▶ Clear cart
   └─▶ Return order number for tracking
```

### C. Payment + Refund

- `POST /api/payments` — record a payment, mark order `paid` or `partial`.
- `POST /api/payments/:id/refund` — refund. **Guarded against double refund** (audit fix #3) — re-refunding a `refunded` payment returns 400.

### D. Purchase Order (stock replenishment)

```
Draft  →  Placed  →  Partially received  →  Fully received  →  Closed
```

Receiving a PO line adds to `StockEntry` in the configured default rack and writes a `StockMovement`. Partial payments tracked separately — PO can be received but unpaid (or vice versa).

### E. Walk-in (physical) order

- Same `/api/orders` POST but with `orderType: 'physical'`.
- Customer either picked from existing customers OR auto-created walk-in customer (phone is now optional — audit fixes #1, #2).
- No shipping; immediate cash/card payment.

### F. Order Status Lifecycle (online)

```
pending  →  confirmed  →  packed  →  shipped  →  out_for_delivery  →  delivered
                    │                                                       │
                    └────▶  cancelled                                       ▼
                                                                       returned  →  refunded
```

Stock auto-deducts when status hits `shipped`. Cancellation/return restores stock.

---

## 14. File Uploads

- **Endpoint:** `POST /api/uploads` (multipart, field `file`)
- If `CLOUDINARY_*` env vars are set → uploaded to Cloudinary, secure URL returned.
- Otherwise → saved to `backend/uploads/` and served via `GET /uploads/<filename>` (cached 7 days).
- Frontend [ProductImage.jsx](frontend/src/components/storefront/ProductImage.jsx) gracefully falls back to a branded RIWAYA placeholder if any image URL fails to load.
- Default demo products have **no images set** — they render the branded fallback. Upload real photos via Admin → Products → Edit → Images.

---

## 15. Security

What's in place:

| Layer | Mechanism |
|------|-----------|
| Headers | `helmet()` with `crossOriginResourcePolicy: 'cross-origin'` so images load across ports in dev |
| Input sanitization | `express-mongo-sanitize` strips `$` and `.` operators from req bodies/queries |
| CORS | Only `CLIENT_URL` is allowed, credentials enabled |
| Body size | 10 MB limit |
| Rate limit | 300 requests / 15 min / IP on `/api/*` |
| Auth | JWT in httpOnly cookie (primary) + `Authorization: Bearer` fallback |
| Passwords | bcryptjs hash via pre-save hook on User schema |
| Logout | Frontend removes localStorage token **before** calling `/logout` (audit fix #6) — prevents authenticated requests post-logout |
| Validation | Every write endpoint validates body with Zod before hitting the service |
| Roles | `authorize(...roles)` middleware on every protected route |

**Things to do before production:**
- Rotate `JWT_SECRET` to a real random secret.
- Enable HTTPS-only cookies (`secure: true`).
- Tighten rate limit on `/auth/login` (currently shares the 300/15min bucket).
- Add CSRF protection if you stop using SameSite cookies.
- Audit dependency advisories regularly (`npm audit`).

---

## 16. Recent Changes & Audit Fixes

### 2026-06-16 — UI overhaul, real-time UX & bug fixes

**New features & UI**
- **Luxury re-theme** — Warm Gold `#C68A3A` / Warm Ivory `#F4E8D8` / Rich Charcoal palette driven by CSS tokens (`index.css`); matte-black navbar + footer, gold-bronze button hover.
- **Animations** — entrance/scroll reveals (`components/ui/Reveal.jsx`), `hover-lift`, button press feedback, animated cart/wishlist badges. Honors `prefers-reduced-motion`.
- **Real-time cart & wishlist** — optimistic updates (`cartApi`/`wishlistApi`): the navbar count pops the instant you add; product cards show a spinner → ✓ confirmation.
- **Home "Shop by Category"** — admin uploads a per-category image (Categories form) shown on the home grid; the "Show on storefront" toggle now controls the grid.
- **Home "Featured Pieces"** — admin marks products **Featured** (Products form checkbox + ⭐ quick-toggle in the table).
- **Dashboard employee management** — add/edit/remove employees, change status, see salary + estimated monthly payroll without leaving the dashboard.
- **Checkout payment accounts** — picking Bank Transfer / JazzCash / EasyPaisa shows RIWAYA's receiving account details with copy buttons (`PAYMENT_ACCOUNTS` in `Checkout.jsx`). Update with real accounts.
- **Editable profile** — `/profile` edits name, phone, and password.
- **Contact page** (`/contact`) added; **About** redesigned with imagery. **My Orders** + **Track Order** show in the navbar only when signed in.

**Bug fixes**
1. **Customer & Employee `user` index** — removed `default: null` on the optional `user` field. A sparse-unique index treats an explicit `null` as a value, so the **2nd** walk-in customer / 2nd employee collided (`Duplicate value 'null' for field 'user'`). Field is now omitted when absent → unlimited records (no migration needed).
2. **Cart not clearing after checkout** — `order.service.js#placeOnlineOrder` now calls `cartService.clear(userId)` after the order saves (best-effort; never fails a placed order).
3. **Payments list showed "No records found"** — `baseApi` now strips blank query params. Previously `status=''`/`method=''` failed the backend's optional-enum (Zod) validation and 400'd the entire list. Fixes every admin list filter.

> Note: deployed on Vercel — these take effect after the next deploy.

### 2026-05-17 — End-to-end audit

End-to-end audit after Phase 12 — **8 real bugs caught and fixed** by two parallel exploration agents (backend + frontend):

**Backend**

1. **`customer.model.js`** — `phone` made non-required at schema level. Walk-in flow still validates phone via Zod where appropriate; online auto-create from `/auth/register` skips phone if user didn't supply it (was writing `'N/A'`).
2. **`customer.service.js#createForUser`** — only adds `phone` to payload if `user.phone` is set.
3. **`payment.service.js#refund`** — added `if (p.status === 'refunded')` guard. Double-refund now returns `400 Bad Request` instead of silently re-saving.
4. **`order.service.js#deductStockForItems`** — pre-flight loop checks every item has enough stock **before** any rack is mutated. Prevents partial deduction on failure.
5. **`product.service.js#listStorefront`** — now includes `variants` in select and populates `variants.stockItem` with `name sku totalQuantity reservedQuantity`. Fixes broken storefront quick-add-to-cart.

**Frontend**

6. **`StorefrontLayout.jsx` + `AdminLayout.jsx` (`handleLogout`)** — both `localStorage.removeItem('riwaya_token')` **before** `clearUser()`. Previously the JWT was sent on subsequent requests after "logout".
7. **`Cart.jsx`** — guards `product?.variants?.length` before `.find()` so cart still renders when variant data is missing.
8. **`Checkout.jsx#onSubmit`** — empty-cart re-check at submit time prevents race where cart was cleared between render and click.

**Why this matters:** Without #6 (logout), an attacker who hijacked a logged-out session could still hit the API. Without #4 (stock pre-flight), an order failing mid-fulfillment would leave stock counters wrong. Without #5 (variants in storefront), the entire storefront quick-buy UX was broken.

No schema migration needed — all changes are backward compatible.

---

## 17. Test Flow

End-to-end test karne ke liye yeh order follow karain:

### 1. Login as Super Admin
- Browser: `http://localhost:5173/admin/login`
- Credentials: `superadmin@riwaya.com` / `Super@1234`
- Auto-redirect to `/admin` dashboard

### 2. Warehouse Setup (agar `seed:demo` nahi chalaya)
1. **Warehouses** → "New warehouse" → fill: name, code (e.g. `WH-LHR-01`), city, area in marla → Create
2. Add Floors → Add Racks → Add Rack Categories

### 3. Stock Categories aur Items
1. **Rack Categories**: "Embroidery", "Formal", "Bridal" etc.
2. **Stock Items** → "New stock item" → name, SKU auto-generate ho jaayega, unit cost, min stock level

### 4. Suppliers (Mills)
- **Suppliers** → "New supplier" → name: "Faisal Mills", type: mill, phone, NTN, GST etc.

### 5. Purchase Order
- **Purchase Orders** → "New PO" → supplier, warehouse, item × qty @ price → Create draft
- Detail page khulay gi → "Approve" → status `placed`
- "Record receipt" → 75 of 100 received → status `partially_received`
- "Record payment" → Rs 100,000 cash → payment status `partial`
- Baki 25 receive karein → status `fully_received`
- Baki amount pay karein → payment status `paid`

### 6. Products
- **Product Categories** → add "Bridal", "Formal" etc.
- **Products** → "New product" → name, category, linked stock item, base price, sale price → status `published`, `Show on storefront` ✓
- Images upload karein (Cloudinary ya local fallback both work)

### 7. Storefront
- Logout (top-right)
- `/register` → naya customer account banayein
- `/products` → product browse karain
- Cart mein add karain → checkout karain
- Order place ho jaayega → tracking page automatically khulegi

### 8. Order Fulfillment (admin side)
- Re-login as super admin
- **Orders** → naye order pe click karain
- Status transition: Pending → Confirmed → Packed → Shipped → Delivered
- Courier details add karain ("TCS", tracking number etc.)
- Payment record karain
- Stock automatically deduct ho jaayega when status hits `shipped`

### 9. Reports & Finance
- **Dashboard** — live stats today/month
- **Finance** — revenue, expenses, profit chart
- **Reports** — sales over time, top products, activity feed

---

## 18. Common Commands

### Backend (`backend/` folder mein)

```powershell
npm install                  # install dependencies
npm run dev                  # development mode (auto-reload via nodemon)
npm start                    # production mode
npm run seed:admin           # super admin create / re-create
npm run seed:demo            # warehouse + 6 demo products + initial stock
node scripts/listRoutes.js   # all registered API endpoints dekhne ke liye
```

### Frontend (`frontend/` folder mein)

```powershell
npm install
npm run dev           # development server (localhost:5173)
npm run build         # production build (dist/ folder banata hai)
npm run preview       # production build preview karne ke liye
```

---

## 19. Environment Variables

### `backend/.env`

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGO_URI=mongodb://127.0.0.1:27017/riwaya

JWT_SECRET=change_me_to_a_long_random_string_min_32_chars
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Cloudinary (image uploads — optional for dev, falls back to /uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# First super admin seed
SUPER_ADMIN_NAME=RIWAYA Super Admin
SUPER_ADMIN_EMAIL=superadmin@riwaya.com
SUPER_ADMIN_PASSWORD=Super@1234
```

| Variable | Purpose | Required |
|----------|---------|----------|
| `PORT` | API port | yes (default 5000) |
| `NODE_ENV` | `development` / `production` | yes |
| `CLIENT_URL` | CORS allowlist for frontend | yes |
| `MONGO_URI` | MongoDB connection string | yes |
| `JWT_SECRET` | Sign JWT tokens | **yes — change in prod** |
| `JWT_EXPIRE` | Token lifetime | yes |
| `JWT_COOKIE_EXPIRE` | Cookie lifetime (days) | yes |
| `CLOUDINARY_*` | Image hosting | no (local fallback) |
| `SUPER_ADMIN_*` | Seed-time admin account | yes (first run) |

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_BRAND_NAME=RIWAYA
VITE_CURRENCY=PKR
```

**Production mein deploy karne se pehle:**

- `JWT_SECRET` ko strong random string se replace karain (32+ chars)
- `NODE_ENV=production` set karain
- `MONGO_URI` apna production cluster URL daalain
- `SUPER_ADMIN_PASSWORD` change karain
- Cloudinary credentials add karain

---

## 20. Troubleshooting

### "Cannot connect to MongoDB"
```
✗ MongoDB connection failed: connect ECONNREFUSED 127.0.0.1:27017
```
**Fix:**
- MongoDB service chal rahi hai? `net start MongoDB` (Windows), `brew services start mongodb-community` (Mac), `sudo systemctl start mongod` (Linux)
- Ya Atlas use karain (cloud option, Section 4)

### "Port 5000 already in use"
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Fix:**
- Doosri app pehle se port 5000 use kar rahi hai
- `backend/.env` mein `PORT=5001` set kar dain
- `frontend/.env` mein `VITE_API_URL=http://localhost:5001/api` update karain

### "Failed to fetch" frontend mein
- Backend running hai? `http://localhost:5000/api/health` browser mein khol kar dekh lain
- `frontend/.env` mein `VITE_API_URL` sahi hai?
- Frontend dev server restart karain (`Ctrl+C` then `npm run dev`)

### Super admin login nahi ho raha
```
Invalid email or password
```
- `npm run seed:admin` dobara run karain (idempotent — safe)
- Email aur password exact hain: `superadmin@riwaya.com` / `Super@1234`
- Browser DevTools → Network tab mein response check karain

### Login succeeds but next request 401
- Cookie not stored: ensure you're on `http://localhost:5173` (not `127.0.0.1` — cookie domain mismatch)
- Browser blocking third-party cookies → site is being treated as cross-site, switch to localhost for both ends

### "Email already in use" register karte time
- DB mein already woh email register ho chuki hai
- Different email use karain ya phir Mongo shell sy purana record delete karain:
  ```powershell
  mongosh
  use riwaya
  db.users.deleteOne({ email: "test@example.com" })
  ```

### Stock deduct nahi ho raha order pe
- Product **published** hai aur **displayOnFrontend = true** hai?
- Product ki variant kisi stock item se linked hai?
- Stock item mein `totalQuantity > 0` hai (admin mein "Receive" kar ke add karain)?

### `npm install` fail ho raha hai
- Node version check karain: `node --version` should be 18+
- `node_modules` aur `package-lock.json` delete kar ke phir `npm install`:
  ```powershell
  Remove-Item -Recurse -Force node_modules,package-lock.json
  npm install
  ```

### Frontend pe products show nahi ho rahe
- Admin panel mein product ka **status `published`** hai?
- **Show on storefront** checkbox ✓ kiya hua hai?
- Product ki category bhi `displayOnFrontend = true` honi chahiye (default true hai)

### Images not loading on storefront
- Expected if you haven't uploaded any — the branded RIWAYA placeholder shows automatically via [ProductImage.jsx](frontend/src/components/storefront/ProductImage.jsx)
- Upload via Admin → Products → Edit → Images

### "Role 'customer' is not authorized for this resource"
- You're logged in as a customer but trying to hit an admin endpoint
- Log out and log in via `/admin/login` with super admin credentials

### Seed `seed:demo` can't find super admin
- Run `npm run seed:admin` first

---

## 21. Deployment Notes — Vercel (two projects)

RIWAYA deploys as **two separate Vercel projects from one repo**: the backend
runs as a serverless function, the frontend as a static SPA. The data layer is
already cloud-based (MongoDB Atlas + Cloudinary), so nothing local is required.

```
riwaya-api.vercel.app   ← backend  (Root Directory: backend/)
riwaya.vercel.app       ← frontend (Root Directory: frontend/)
```

Deploy-relevant files already in the repo:
- `backend/api/index.js` — serverless entry (builds the Express app, awaits the cached DB connection).
- `backend/vercel.json` — rewrites every path to the function so Express does its own routing.
- `frontend/vercel.json` — SPA fallback (all routes → `index.html`).

### Step 1 — MongoDB Atlas
- Use an Atlas `mongodb+srv://…` connection string for `MONGO_URI`.
- **Network Access → Allow Access from Anywhere (`0.0.0.0/0`)** — Vercel's serverless IPs are dynamic.

### Step 2 — Deploy the backend project
1. Vercel → **Add New → Project** → import this repo.
2. **Root Directory: `backend`**. Framework Preset: **Other**.
3. Add Environment Variables (Production):

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | your Atlas `mongodb+srv://…/riwaya` string |
   | `JWT_SECRET` | a long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
   | `JWT_EXPIRE` | `7d` |
   | `JWT_COOKIE_EXPIRE` | `7` |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from Cloudinary (required in prod) |
   | `CLIENT_URL` | the frontend URL (set after Step 3, then redeploy) |
   | `SUPER_ADMIN_NAME` / `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | first admin (for seeding) |

4. Deploy. Verify `https://<backend>.vercel.app/api/health` returns `{ "success": true }`.

### Step 3 — Deploy the frontend project
1. **Add New → Project** → same repo, **Root Directory: `frontend`** (Vercel auto-detects Vite).
2. Environment Variables:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://<backend>.vercel.app/api` |
   | `VITE_BRAND_NAME` | `RIWAYA` |
   | `VITE_CURRENCY` | `PKR` |

3. Deploy. Then go back to the **backend** project, set `CLIENT_URL` to the frontend URL, and **redeploy the backend** (so CORS + cookies allow the real origin).

### Step 4 — Seed the database
Run once from your machine, pointed at Atlas (set the same `MONGO_URI`/`SUPER_ADMIN_*` in `backend/.env`):

```powershell
cd backend
npm run seed:admin    # creates the first super admin
npm run seed:demo     # optional demo warehouse + products
```

### Notes & gotchas
- **Cross-site cookies**: frontend and backend are on different domains, so auth cookies use `SameSite=None; Secure` in production (handled in `generateToken.js`). Auth also works via the Bearer token in `localStorage`, so login is robust either way.
- **`VITE_*` are build-time**: changing `VITE_API_URL` requires a frontend redeploy, not just an env edit.
- **No local uploads**: images go to Cloudinary (Vercel has no writable disk) — `CLOUDINARY_*` are required in production or the function exits on boot.
- **Rate limiting** is in-memory and resets per cold start (not shared across instances); fine for this scale.
- Every push to the repo's default branch auto-deploys both projects.

---

## 22. Roadmap

### ✓ Already Built (Phase 1 — 12)

- [x] Auth + roles (super_admin, admin, customer)
- [x] Warehouse / floor / rack / rack-category
- [x] Stock items + entries + movement audit trail
- [x] Equipment + categories
- [x] Suppliers + Purchase Orders (with partial receiving & partial payments)
- [x] Products + categories + storefront read API
- [x] Cart + Wishlist (anonymous cart supported)
- [x] Orders (online + walk-in) with snapshots
- [x] Payments + refunds (double-refund guard)
- [x] Finance summary (revenue, expenses, P&L)
- [x] Customers + Employees
- [x] Reports / dashboards
- [x] Uploads (Cloudinary + local fallback)
- [x] Post-build audit + 8 bug fixes
- [x] Order status lifecycle with stock auto-sync
- [x] Auto-numbered POs, Orders, Payments, Customers, Employees, Suppliers, Stock SKUs
- [x] Low-stock alerts

### Future Enhancements (Optional)

- [ ] Live payment gateways — Stripe webhook, JazzCash, EasyPaisa integration (model already has `transactionId`, `gateway`, `gatewayResponse` fields)
- [ ] Email notifications — order confirmation, password reset (need nodemailer + SMTP/SendGrid)
- [ ] SMS via Twilio for order tracking
- [ ] Multi-image gallery with drag-to-reorder
- [ ] Discount codes / coupons — Cart already has `couponCode` field; need coupon model + service
- [ ] Product reviews — model exists in product schema (`averageRating`, `reviewCount`); need Review module
- [ ] Code splitting — split admin bundle from storefront via `React.lazy`
- [ ] Tests — Vitest for services, Playwright for end-to-end
- [ ] PDF invoices — jsPDF already installed
- [ ] Wholesale / bulk pricing tier
- [ ] Order returns flow UI
- [ ] Multi-language storefront (English + Urdu)
- [ ] Analytics integration

---

## 23. Quick Start Checklist

```
[ ] Node.js v18+ installed
[ ] MongoDB running (local or Atlas)
[ ] git clone (ya manually folder copy)
[ ] cd backend && npm install
[ ] copy backend\.env.example backend\.env (then edit JWT_SECRET)
[ ] cd backend && npm run seed:admin
[ ] cd backend && npm run seed:demo       ← optional but recommended
[ ] cd backend && npm run dev             ← terminal 1
[ ] cd frontend && npm install
[ ] cd frontend && npm run dev            ← terminal 2
[ ] Browser: http://localhost:5173
[ ] Admin login: http://localhost:5173/admin/login
[ ] Credentials: superadmin@riwaya.com / Super@1234
[ ] Test customer flow: /register → /products → /cart → /checkout
[ ] Done!
```

---

## Project Stats

- **Total backend files:** ~120 (modules + middleware + utils + config + routes)
- **Total frontend files:** ~75 (config + components + pages + store + api)
- **REST endpoints:** ~120
- **Modules:** 17
- **Phases built:** 12 (9 backend + 3 frontend) + post-build audit
- **Audit bugs fixed:** 8 (5 backend + 3 frontend)

---

## Tech Stack Reference

### Backend

| Layer            | Technology                                   |
| ---------------- | -------------------------------------------- |
| Runtime          | Node.js (ESM modules)                        |
| Framework        | Express.js 4                                 |
| Database         | MongoDB + Mongoose 7                         |
| Auth             | JWT (cookies + Bearer) + bcryptjs            |
| Validation       | Zod 3                                        |
| Security         | helmet, express-mongo-sanitize, rate-limit   |
| File uploads     | Multer + Cloudinary (with local fallback)    |
| Logging          | Morgan (dev mode)                            |

### Frontend

| Layer        | Technology                                       |
| ------------ | ------------------------------------------------ |
| Build tool   | Vite 5                                           |
| Framework    | React 18                                         |
| Styling      | Tailwind CSS 3 (shadcn-style theme via CSS vars) |
| State        | Redux Toolkit + RTK Query                        |
| Routing      | react-router-dom v6                              |
| Forms        | react-hook-form + Zod resolver                   |
| Charts       | Recharts                                         |
| Icons        | lucide-react                                     |
| Notifications| sonner (toast)                                   |
| Dates        | date-fns                                         |
| PDF          | jsPDF + jspdf-autotable                          |

---

## License

Internal project. © RIWAYA.

---

## Quick Reference Card

```
Backend:   http://localhost:5000      (npm run dev from /backend)
Frontend:  http://localhost:5173      (npm run dev from /frontend)
Health:    http://localhost:5000/api/health
Admin:     http://localhost:5173/admin/login
Login:     superadmin@riwaya.com / Super@1234

Seed admin: npm run seed:admin       (from /backend)
Seed demo:  npm run seed:demo        (from /backend)
List routes: node scripts/listRoutes.js  (from /backend)
```

For module-specific questions, start at the relevant `backend/src/modules/<name>/routes.js` and follow the controller → service → model chain.

---

**Brand:** RIWAYA — Crafted in heritage, worn with pride.
**Tech:** MERN stack (MongoDB + Express + React + Node)
**Locale:** Pakistan (PKR currency, NTN/GST/CNIC, JazzCash/EasyPaisa)

**Happy building! Agar koi problem aaye to Troubleshooting (Section 20) dekhain ya issue raise karain.**
