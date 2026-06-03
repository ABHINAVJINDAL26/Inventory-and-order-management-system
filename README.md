# 🧪 AasaMedChem — Inventory & Order Management System

> Next.js + Neon PostgreSQL + Vercel | Role-based access | Unit conversion | INR pricing

---

## 📌 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [System Design](#system-design)
4. [Folder Structure](#folder-structure)
5. [Database Schema](#database-schema)
6. [Unit Storage & Conversion Strategy](#unit-storage--conversion-strategy)
7. [Price & Quantity Storage](#price--quantity-storage)
8. [Authentication & Roles](#authentication--roles)
9. [Features by Role](#features-by-role)
10. [Quotation / Order Flow](#quotation--order-flow)
11. [Environment Variables Setup](#environment-variables-setup)
12. [Local Setup & Running](#local-setup--running)
13. [Neon PostgreSQL Setup](#neon-postgresql-setup)
14. [Vercel Deployment](#vercel-deployment)
15. [Test Credentials](#test-credentials)
16. [Git Workflow](#git-workflow)
17. [Key Design Decisions](#key-design-decisions)

---

## Project Overview

Ye ek **Inventory aur Order Management System** hai jo chemical/medical supply companies ke liye banaya gaya hai. Isme do roles hain — **Admin** aur **Seller** — aur ye system products ko multiple units (g, kg, L, mL, items) mein manage karta hai, unit conversion ke saath sahi pricing calculate karta hai, aur quotations/orders track karta hai.

**Core capabilities:**
- Products create/update/delete karna with flexible units
- Seller by kisi bhi supported unit mein order place kar sakta hai
- System automatically unit conversion karke sahi price calculate karta hai
- Admin saare incoming quotations dekh sakta hai with full breakdown
- Saari prices INR mein display hoti hain

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + Backend | Next.js 14 (App Router) |
| Database | Neon PostgreSQL (serverless) |
| ORM | Drizzle ORM (ya Prisma — apni choice) |
| Authentication | NextAuth.js (credentials provider) |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Language | TypeScript |

---

## System Design

```
Browser (Client)
      │
      ▼
Next.js App Router (Vercel)
  ├── /app/(auth)/login         → Login page
  ├── /app/admin/...            → Admin panel (protected)
  ├── /app/seller/...           → Seller panel (protected)
  └── /app/api/...              → API routes (REST endpoints)
            │
            ▼
      Neon PostgreSQL
   (serverless PostgreSQL)
```

**Request flow:**
1. User browser se request aati hai
2. Next.js App Router handle karta hai — server components ya API routes ke through
3. API routes Neon PostgreSQL se connect karte hain (connection pooling ke saath)
4. Data wapas client ko JSON mein milta hai
5. Frontend INR display aur unit labels render karta hai

---

## Folder Structure

```
aasa-medchem/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx             # Login page
│   ├── admin/
│   │   ├── layout.tsx               # Admin layout (role check)
│   │   ├── page.tsx                 # Admin dashboard
│   │   ├── products/
│   │   │   ├── page.tsx             # Product list
│   │   │   └── [id]/page.tsx        # Edit/delete product
│   │   └── orders/
│   │       └── page.tsx             # View all quotations/orders
│   ├── seller/
│   │   ├── layout.tsx               # Seller layout (role check)
│   │   ├── page.tsx                 # Browse products
│   │   └── orders/
│   │       └── page.tsx             # My orders
│   └── api/
│       ├── auth/[...nextauth]/      # NextAuth handler
│       ├── products/                # CRUD endpoints
│       └── orders/                  # Order endpoints
├── components/
│   ├── ProductCard.tsx
│   ├── OrderForm.tsx
│   ├── UnitSelector.tsx
│   └── PriceDisplay.tsx
├── lib/
│   ├── db.ts                        # Neon DB connection
│   ├── auth.ts                      # NextAuth config
│   ├── unitConversion.ts            # Conversion logic
│   └── priceCalculator.ts           # Price calculation
├── drizzle/ (ya prisma/)
│   └── schema.ts                    # DB schema
├── .env.local                       # Local env vars (gitignored)
├── .env.example                     # Template (committed)
└── README.md
```

---

## Database Schema

### Table: `users`

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,          -- bcrypt hashed
  role        TEXT NOT NULL           -- 'admin' | 'seller'
              CHECK (role IN ('admin', 'seller')),
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

### Table: `products`

```sql
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  sku             TEXT UNIQUE,                   -- optional SKU code
  description     TEXT,
  category        TEXT,

  -- Base unit is the internal storage unit
  base_unit       TEXT NOT NULL                  -- 'g' | 'kg' | 'mL' | 'L' | 'unit'
                  CHECK (base_unit IN ('g', 'kg', 'mL', 'L', 'unit')),

  -- Quantity stored in base_unit
  stock_quantity  NUMERIC(20, 6) NOT NULL DEFAULT 0,

  -- Price per 1 base_unit, stored in paise (INR × 100) as INTEGER
  price_per_base_unit_paise  BIGINT NOT NULL,

  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

**PostgreSQL type choices explained:**

| Field | Type | Reason |
|-------|------|--------|
| `stock_quantity` | `NUMERIC(20,6)` | High precision for fractional grams/mL; no floating-point rounding errors |
| `price_per_base_unit_paise` | `BIGINT` | Store price as paise (integer) to avoid decimal issues; max ~92 crore INR per unit |

---

### Table: `orders`

```sql
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           UUID NOT NULL REFERENCES users(id),
  status              TEXT DEFAULT 'pending'
                      CHECK (status IN ('pending', 'confirmed', 'rejected', 'fulfilled')),
  total_paise         BIGINT NOT NULL,           -- total price in paise
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
```

---

### Table: `order_items`

```sql
CREATE TABLE order_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id           UUID NOT NULL REFERENCES products(id),

  -- Ordered in whichever unit seller chose
  ordered_unit         TEXT NOT NULL,            -- e.g. 'kg', 'g', 'L', 'mL', 'unit'
  ordered_quantity     NUMERIC(20, 6) NOT NULL,

  -- Converted to base unit at time of order (for admin verification)
  base_unit            TEXT NOT NULL,
  base_quantity        NUMERIC(20, 6) NOT NULL,

  -- Price snapshot at time of order (in paise)
  unit_price_paise     BIGINT NOT NULL,          -- price per 1 base_unit at order time
  line_total_paise     BIGINT NOT NULL           -- base_quantity × unit_price_paise
);
```

---

## Unit Storage & Conversion Strategy

### Internal (Base) Units

Har product ka ek **base unit** hota hai jisme quantity database mein store hoti hai:

| Dimension | Base Unit | Reason |
|-----------|-----------|--------|
| Weight | `g` (grams) | Smallest common weight unit |
| Volume | `mL` (millilitres) | Smallest common volume unit |
| Count | `unit` | Already atomic |

> **Important:** `kg` aur `L` ko base unit banana possible tha, lekin `g` aur `mL` choose kiye gaye taaki saari conversions multiply-only hon (divide nahi karna padta chhote se bade mein).

### Conversion Factors (`lib/unitConversion.ts`)

```typescript
// Conversion factors: "1 X = ? base_unit"
export const CONVERSION_TO_BASE: Record<string, Record<string, number>> = {
  weight: {
    g: 1,
    kg: 1000,
  },
  volume: {
    mL: 1,
    L: 1000,
  },
  count: {
    unit: 1,
  },
};

// Which base unit does each ordered unit belong to?
export const UNIT_DIMENSION: Record<string, string> = {
  g: 'weight', kg: 'weight',
  mL: 'volume', L: 'volume',
  unit: 'count',
};

// Convert any quantity to base unit
export function toBaseUnit(quantity: number, fromUnit: string): number {
  const dim = UNIT_DIMENSION[fromUnit];
  const factor = CONVERSION_TO_BASE[dim][fromUnit];
  return quantity * factor;
}

// Price calculation: ordered_quantity in any unit → price in paise
export function calculateLineTotalPaise(
  orderedQty: number,
  orderedUnit: string,
  pricePerBaseUnitPaise: number
): number {
  const baseQty = toBaseUnit(orderedQty, orderedUnit);
  return Math.round(baseQty * pricePerBaseUnitPaise);
}
```

### Where Conversions Happen

| Location | What happens |
|----------|-------------|
| **API route: POST /api/orders** | `ordered_quantity` ko base unit mein convert kiya jata hai, `line_total_paise` calculate hota hai |
| **Frontend: OrderForm.tsx** | Live price preview dikhata hai jab user quantity ya unit change kare |
| **Admin orders view** | Dono units dikhaye jaate hain — ordered unit AND base unit quantity — for verification |
| **Display layer** | `paise / 100` karke INR dikhaya jaata hai (e.g., 150000 paise = ₹1,500.00) |

---

## Price & Quantity Storage

### Prices — Paise Strategy

Saari prices **paise** (INR × 100) mein store ki jaati hain BIGINT column mein.

**Kyun?**
- Floating point se ₹1.10 + ₹2.20 = ₹3.2999... jaisi galtiyan hoti hain
- Integer arithmetic 100% accurate hai
- `BIGINT` mein ₹92,233,720,368,547 tak store ho sakta hai — koi bhi chemical product ke liye kaafi hai

**Display mein conversion:**
```typescript
// Paise → INR for display
export function formatINR(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(paise / 100);
}
// Example: formatINR(150000) → "₹1,500.00"
```

### Quantities — NUMERIC(20,6)

- `NUMERIC(20,6)` — exact precision, koi floating point error nahi
- 6 decimal places: 0.000001 gram tak measure ho sakta hai (pharmaceutical use case)
- 20 digits total: bahut bade quantities bhi handle ho jaate hain

### Rounding Rules

- Intermediate calculations mein rounding nahi
- Sirf final `line_total_paise` compute karte waqt `Math.round()` use hota hai
- Display mein 2 decimal places (paise level)

---

## Authentication & Roles

**NextAuth.js** use hoga with Credentials provider.

```typescript
// lib/auth.ts (simplified)
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email)
        });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role;
      return session;
    }
  },
  pages: { signIn: '/login' }
};
```

**Route protection** — middleware se:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = getToken({ req: request });
  const path = request.nextUrl.pathname;

  if (path.startsWith('/admin') && token?.role !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (path.startsWith('/seller') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

---

## Features by Role

### 👑 Admin Panel (`/admin`)

| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/admin` | Summary stats — total products, pending orders |
| Product List | `/admin/products` | Saare products with stock |
| Add Product | `/admin/products/new` | Form: name, SKU, category, base unit, stock, price |
| Edit Product | `/admin/products/[id]` | Update any field |
| Delete Product | `/admin/products/[id]` | Soft delete (is_active = false) |
| Orders View | `/admin/orders` | Saare quotations with breakdown |
| Order Detail | `/admin/orders/[id]` | Per-item: ordered qty, base qty, price |

### 🛒 Seller Panel (`/seller`)

| Feature | Route | Description |
|---------|-------|-------------|
| Browse Products | `/seller` | Search, filter by category/unit |
| Place Order | `/seller` (modal/form) | Select product, choose unit, enter qty, see live price |
| My Orders | `/seller/orders` | Order history with status |

---

## Quotation / Order Flow

### Seller ka flow:

```
1. /seller page pe jaao
2. Products search/filter karo (name, category, unit)
3. Kisi product pe "Order" click karo
4. OrderForm mein:
   a. Unit select karo (jo bhi supported ho us product ke liye)
   b. Quantity daalo
   c. Live price preview dikhega (unit conversion + INR)
5. "Place Order" button dabao
6. API: POST /api/orders
   → ordered_unit se base_unit mein convert
   → line_total_paise calculate
   → DB mein save
7. Confirmation dikhega
```

### Admin ka flow:

```
1. /admin/orders pe jaao
2. Saare orders pending/confirmed/rejected filter se dekho
3. Kisi order pe click karo → full breakdown:
   - Product name, SKU
   - Seller ne kya unit/qty enter ki
   - Base unit mein converted qty
   - Price per base unit (at time of order)
   - Line total in INR
4. Status update karo (Confirm / Reject / Fulfil)
```

---

## Environment Variables Setup

`.env.local` file banao (kabhi bhi commit mat karo):

```env
# Neon PostgreSQL
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# NextAuth
NEXTAUTH_SECRET=your-random-secret-here   # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000         # Vercel pe production URL daalo
```

`.env.example` file commit karo (without actual values):

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

---

## Local Setup & Running

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm
- Neon account (free tier kaafi hai)

### Steps

```bash
# 1. Repo clone karo
git clone https://github.com/your-username/aasa-medchem.git
cd aasa-medchem

# 2. Dependencies install karo
npm install

# 3. .env.local banao
cp .env.example .env.local
# .env.local mein apna DATABASE_URL aur NEXTAUTH_SECRET daalo

# 4. Database migrate karo
npm run db:push        # Drizzle use karne par
# ya
npx prisma migrate dev  # Prisma use karne par

# 5. Seed data (optional — test users banane ke liye)
npm run db:seed

# 6. Dev server chalao
npm run dev
# → http://localhost:3000
```

---

## Neon PostgreSQL Setup

1. [neon.tech](https://neon.tech) pe jaao → free account banao
2. New project banao → Database name: `aasa_medchem`
3. Connection string copy karo → `.env.local` mein `DATABASE_URL` mein paste karo
4. Connection string mein `?sslmode=require` zaroor hona chahiye

```typescript
// lib/db.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

---

## Vercel Deployment

```bash
# 1. Vercel CLI install karo
npm install -g vercel

# 2. Login karo
vercel login

# 3. Deploy karo
vercel --prod
```

**Ya GitHub se auto-deploy:**
1. GitHub pe push karo
2. vercel.com → "New Project" → repo connect karo
3. Environment variables add karo:
   - `DATABASE_URL` — Neon connection string
   - `NEXTAUTH_SECRET` — random secret
   - `NEXTAUTH_URL` — `https://your-app.vercel.app`
4. Deploy!

**Re-deploy:**
```bash
vercel --prod   # manual
# ya GitHub main branch pe push karo → auto deploy
```

---

## Test Credentials

Seed script in credentials create karta hai:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@aasa.dev` | `Admin@123` |
| Seller | `seller@aasa.dev` | `Seller@123` |

> Inhe production mein change karna — ye sirf testing ke liye hain.

**Seed script example** (`scripts/seed.ts`):

```typescript
import bcrypt from 'bcryptjs';
import { db } from '../lib/db';
import { users } from '../drizzle/schema';

async function seed() {
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const sellerHash = await bcrypt.hash('Seller@123', 10);

  await db.insert(users).values([
    { name: 'Admin User', email: 'admin@aasa.dev', password: adminHash, role: 'admin' },
    { name: 'Test Seller', email: 'seller@aasa.dev', password: sellerHash, role: 'seller' },
  ]);

  console.log('✅ Seeded successfully');
}

seed();
```

---

## Git Workflow

Meaningful, incremental commits karo — ek bada "final" commit bilkul nahi:

```
feat: initialize Next.js project with TypeScript and Tailwind
feat: add Neon DB connection and Drizzle schema
feat: implement NextAuth with role-based sessions
feat: add admin product CRUD API routes
feat: build admin product list and create form UI
feat: add unit conversion utility (g/kg, mL/L)
feat: build seller product browse page with search
feat: implement order placement with live price preview
feat: add admin orders view with full unit breakdown
fix: correct price calculation for L → mL conversion
docs: add README with schema and conversion strategy
```

**Branch strategy (simple):**
```
main → production (Vercel deploys from here)
feat/products → feature branches merge karo
feat/orders
```

---

## Key Design Decisions

### 1. Base unit `g` and `mL` instead of `kg` and `L`
Conversion always multiply karo, kabhi divide nahi — integer arithmetic zyada safe hai.

### 2. Prices in paise (integer), not rupees (float)
Floating point se ₹3.30 kabhi kabhi ₹3.2999999 ban jaata hai — paise mein integer use karke ye problem bilkul nahi.

### 3. Price snapshot in `order_items`
Order place hone ke baad product ka price change ho sakta hai, isliye `unit_price_paise` order ke time pe snapshot kiya gaya hai `order_items` mein.

### 4. Soft delete for products
`is_active = false` karo instead of actual delete — past orders ka reference preserve rehta hai.

### 5. `NUMERIC(20,6)` for quantities
PostgreSQL ka `NUMERIC` exact hai (not floating point), 6 decimal places pharmaceutical precision ke liye kaafi hai.

---

*Built for AasaMedChem Hackathon Assignment — designed with clarity, correctness, and maintainability in mind.*
