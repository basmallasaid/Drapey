# Drapey

Single-brand clothing e-commerce store built with Next.js 15, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth (Email + Google OAuth)
- **Styling:** Tailwind CSS v4
- **Language:** JavaScript

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
2. Run the SQL files in `supabase/` in order: `schema.sql`, `rls_policies.sql`, `seed.sql`
3. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/              Next.js App Router pages and API routes
components/       Reusable UI components
lib/              Utilities, Supabase client setup, constants
providers.jsx     React context providers (Auth, Cart, Favorites)
supabase/         Database schema, RLS policies, seed data
public/           Static assets
```

## Database

The project uses these Supabase tables:
- `users` — User profiles (auto-created on signup)
- `categories` — Product categories
- `products` — Product catalog
- `product_images` — Product images
- `product_variants` — Size/color variants with stock
- `cart` / `cart_items` — Shopping cart
- `favorites` — User wishlists
- `addresses` — Saved shipping addresses
- `orders` / `order_items` — Order history
