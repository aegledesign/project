# Aegle Custom Platform — Full Custom Products Website

This is a full-featured, original CustomInk-style platform for Aegle Design. It is not a clone of CustomInk branding or proprietary content.

## Included

- Public storefront with hero, categories, product catalog, quote builder, artwork services, group orders, and help pages
- Product detail pages with color, size, quantity, print-location, price-break, and design-starting flow
- Browser design studio with text, logo upload, colors, artwork layers, proof preview, and saved JSON payload
- Cart, quote request, mock checkout, and order confirmation flow
- Editable admin backend for products, categories, orders, design approvals, quote requests, content blocks, and settings
- File-backed API routes for local development, with Prisma schema for production database migration
- Stripe integration stubs and production checklist

## Run locally

```bash
cd ~/Downloads/aegle-custom-platform-full
npm install --cache /tmp/npm-cache
npm run dev
```

Open `http://localhost:3000`.

## Admin backend

Open `http://localhost:3000/admin`.

Default local admin password is set through `.env.local`:

```bash
ADMIN_PASSWORD="change-this-password"
```

Local development stores editable data in `data/*.json`. Production should use the Prisma schema and database routes.

## Recommended Codex prompt

```text
Turn this full custom-product platform into a production deployment. Replace file-backed data with Prisma/PostgreSQL, wire Stripe checkout and webhooks, add authentication, add image upload storage, and harden admin permissions. Keep all existing pages and UI flows working.
```

## Main routes

- `/` storefront
- `/catalog` product catalog
- `/products/[slug]` product detail
- `/design/[slug]` design studio
- `/cart` cart
- `/checkout` mock checkout / quote request
- `/group-orders` group ordering workflow
- `/admin` backend dashboard
- `/admin/products` editable products
- `/admin/orders` order management
- `/admin/content` editable site copy/settings

## Production checklist

1. Replace local JSON data with PostgreSQL using Prisma.
2. Add real authentication for customers and admins.
3. Wire Stripe Checkout sessions and webhook fulfillment.
4. Add S3/R2 upload storage for artwork files.
5. Add transactional emails for quote, proof, checkout, and production updates.
6. Add production vendor SKU mapping and print pricing rules.
7. Add file validation and artwork safety checks.
8. Add automated tests and CI.
