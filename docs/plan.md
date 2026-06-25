# Aegle Custom Platform - Production Build Plan

## Current State

This repository is a working Next.js prototype for a custom apparel and promotional products platform. It already includes:

- Public storefront routes
- Product catalog
- Product detail/configuration flow
- Browser design studio
- Cart and mock checkout
- Group orders page
- Admin dashboard
- Admin product editor
- Admin order editor
- Admin content editor
- Local JSON-backed APIs
- Initial Prisma schema
- Stripe dependency and integration stubs

The next build phase is not a greenfield build. It is a conversion from a file-backed prototype into a production platform.

## Product Direction

The platform should be treated as a custom commerce and production workflow system, not a standard ecommerce storefront.

Core business capabilities:

- Product customization
- Customer design submission
- Online design studio
- Cart and checkout
- Quote requests
- Group ordering
- Corporate storefronts
- Fundraising storefronts
- Customer accounts
- Staff/admin accounts
- Artwork approval
- Production workflow
- Stripe payments
- Shipping and tracking
- Reporting

## Architecture Principles

- Keep customer-facing commerce, design, and production workflow connected through shared order data.
- Keep pricing logic in a dedicated pricing service/module, not scattered through UI components.
- Use one flexible `Storefront` model for corporate stores, fundraiser stores, team stores, and private campaigns.
- Store design source data separately from production-ready proof/export files.
- Use Stripe-hosted or Stripe Payment Element flows so the app never handles raw card data.
- Use signed URLs for uploaded artwork and production files.
- Treat admin actions as auditable production operations.

## Immediate Priorities

### 1. Stabilize The Repository

Goal: make the current app reproducible and safe to deploy.

Tasks:

- Generate a project-local `package-lock.json`.
- Confirm `npm install` completes cleanly.
- Run `npm run typecheck`.
- Run `npm run build`.
- Fix all TypeScript and production build failures.
- Add a real lint command if `next lint` is not supported by the installed Next.js version.
- Add CI for install, typecheck, and build.
- Confirm `.env.example` has every required environment variable and no real secrets.

Definition of done:

- A fresh clone can install dependencies and build without manual fixes.

### 2. Environment And Deployment Setup

Goal: prepare the app for Vercel deployment.

Tasks:

- Define required env vars in `.env.example`.
- Add environment validation with Zod.
- Create Vercel project.
- Configure preview and production environments.
- Add Sentry DSN placeholder.
- Add PostHog key placeholder.
- Add Stripe test keys placeholders.
- Add database URL placeholder.
- Add storage bucket placeholders.

Definition of done:

- Vercel can build the app from GitHub using non-production placeholder services or test credentials.

### 3. Replace JSON Storage With Database Storage

Goal: move from `data/*.json` to PostgreSQL through Prisma.

Current local storage:

- `data/products.json`
- `data/orders.json`
- `data/content.json`
- `lib/dataStore.ts`

Initial production models:

- `User`
- `Product`
- `ProductVariant`
- `Category`
- `Design`
- `DesignAsset`
- `Cart`
- `CartItem`
- `Order`
- `OrderItem`
- `Payment`
- `Shipment`
- `SiteContent`
- `Storefront`
- `ProductionJob`
- `AuditLog`

Tasks:

- Expand `prisma/schema.prisma` beyond the current simple models.
- Add database client helper in `lib/db.ts`.
- Create migrations.
- Convert product APIs to Prisma.
- Convert order APIs to Prisma.
- Convert content APIs to Prisma.
- Keep seed data equivalent to current JSON data.
- Remove write dependency on `data/*.json` after database routes are stable.

Definition of done:

- Products, orders, and content are read/written through PostgreSQL in development and production.

### 4. Authentication And Permissions

Goal: replace open admin access with authenticated staff/admin access.

Recommended stack:

- Auth.js/NextAuth
- Prisma adapter
- Email/password or magic link for staff
- Optional customer social login later

Roles:

- Customer
- Staff
- Designer
- Production Manager
- Admin
- Super Admin

Tasks:

- Add user/session models.
- Add admin login.
- Protect `/admin` routes.
- Protect admin API writes.
- Add role checks for product, order, content, and production actions.
- Add audit logging for admin mutations.
- Add password reset or magic-link login.

Definition of done:

- Anonymous users cannot access admin pages or mutate admin APIs.

### 5. Product And Pricing Engine

Goal: model real custom apparel pricing.

Current product data supports:

- Colors
- Sizes
- Print locations
- Base price
- Price breaks
- Tags

Production pricing needs:

- Product variants
- Decoration methods
- Print/embroidery locations
- Quantity tiers
- Setup fees
- Rush fees
- Storefront-specific margins
- Fundraiser margin allocation
- Corporate budget rules

Tasks:

- Create a pricing module with typed inputs and outputs.
- Add unit tests for price breaks and size breakdowns.
- Add decoration method support.
- Add pricing preview on product pages.
- Add admin pricing controls.

Definition of done:

- Cart, checkout, and admin order views all use the same pricing engine.

### 6. Cart And Stripe Checkout

Goal: replace mock checkout with real checkout.

Tasks:

- Persist carts for logged-in users.
- Keep anonymous cart support.
- Create Stripe checkout sessions or Payment Element intents.
- Add Stripe webhook route.
- Verify webhook signatures.
- Create orders only from trusted server-side cart/pricing data.
- Store payment status.
- Add order confirmation page.
- Send confirmation email.

Definition of done:

- A customer can complete a Stripe test payment and produce a paid order in the admin queue.

### 7. Design Studio MVP Hardening

Goal: make the current design studio usable for production intake.

MVP file support:

- PNG
- JPG
- SVG

Defer:

- AI
- EPS
- editable PDF import
- vector conversion
- curved text
- advanced prepress automation

Tasks:

- Store Fabric JSON in the database.
- Store preview image separately.
- Upload artwork assets to S3/R2.
- Validate upload file type and size.
- Attach designs to cart items.
- Attach purchased designs to order items.
- Add admin artwork review screen.
- Add proof status fields.

Definition of done:

- A design can move from product page to cart to order to admin artwork review.

### 8. Production Workflow

Goal: turn paid orders into trackable production jobs.

Recommended order states:

```ts
PENDING_PAYMENT
PAID
ARTWORK_REVIEW
PROOF_SENT
APPROVED
IN_PRODUCTION
PRINTED
PACKED
SHIPPED
DELIVERED
CANCELLED
REFUNDED
```

Tasks:

- Add order status history.
- Add production jobs.
- Add assigned staff.
- Add customer proof approval.
- Add internal notes.
- Add customer-visible order status.
- Add production dashboard filters.

Definition of done:

- Staff can move an order from paid to shipped with a complete status trail.

### 9. Storefront Engine

Goal: support corporate, fundraiser, team, private, and public storefronts with one system.

Recommended storefront types:

```ts
CORPORATE
FUNDRAISER
TEAM
PUBLIC
PRIVATE
```

Shared capabilities:

- Store branding
- Product restrictions
- Store-specific pricing
- Open/close dates
- Access control
- Store reporting

Corporate additions:

- Employee ordering
- Budget controls
- Optional manager approval

Fundraiser additions:

- Revenue tracking
- Donation reporting
- Payout reporting

Team/group additions:

- Campaign deadlines
- Size aggregation
- Bulk production summaries

Definition of done:

- A storefront can be created in admin, assigned products, opened publicly or privately, and tracked separately in reporting.

### 10. Shipping

Goal: support reliable rates, labels, and tracking without direct carrier complexity at first.

Recommended providers:

- Shippo
- EasyPost
- ShipStation

Tasks:

- Add address validation.
- Add shipping rate abstraction.
- Add selected shipping method to checkout.
- Store tracking numbers.
- Send shipping emails.
- Add shipment events.

Definition of done:

- Staff can add shipment details and customers can see tracking status.

### 11. CMS And Content Management

Goal: keep marketing content editable without blocking commerce work.

Current content:

- `data/content.json`
- `/admin/content`
- `/api/content`

Tasks:

- Move content to Prisma.
- Add content block types.
- Add homepage sections.
- Add banners.
- Add FAQ entries.
- Add artwork help content.

Definition of done:

- Admin can edit key storefront content without changing code.

### 12. Analytics And Reporting

Goal: expose operational and revenue data.

Metrics:

- Revenue
- Orders
- Quote requests
- Conversion rate
- Top products
- Storefront performance
- Fundraiser totals
- Production queue status
- Customer lifetime value

Tasks:

- Add event tracking.
- Add PostHog.
- Add admin reports.
- Add CSV exports.

Definition of done:

- Admin can answer what sold, what is pending, what is late, and which storefronts are performing.

### 13. Security And Compliance

Goal: harden the app before live orders.

Tasks:

- Rate-limit sensitive endpoints.
- Validate all API inputs with Zod.
- Verify Stripe webhooks.
- Use signed upload/download URLs.
- Add audit logs.
- Add Sentry monitoring.
- Add backup plan.
- Add privacy controls.
- Add data deletion/export path.

Definition of done:

- The app is safe enough to process real customer accounts, artwork, and payments.

### 14. AI Features

Defer until the core platform is working with real order/design data.

Potential features:

- Artwork quality checks
- Background removal
- Low-resolution warnings
- Product recommendations
- Quote assistant
- Vector conversion

Definition of done:

- AI features improve existing workflows without becoming required for checkout or production.

## MVP Release Scope

The first production MVP should include:

- Customer-facing product catalog
- Product detail configuration
- Cart
- Stripe test/live checkout
- Basic customer order confirmation
- Admin login
- Product admin
- Order admin
- Basic design studio
- Saved design data
- Artwork review status
- Production status tracking
- Email notifications
- S3/R2 artwork storage
- PostgreSQL database
- Vercel deployment

Explicitly out of MVP:

- AI tools
- Direct UPS/FedEx/USPS integrations
- Advanced PDF/AI/EPS import
- Full corporate budget system
- Full fundraiser payout automation
- Advanced analytics
- Complex CMS page builder

## Next Sprint

Sprint objective: make the repository buildable, reproducible, and ready for database/auth work.

Tasks:

- Finish dependency installation and commit `package-lock.json`.
- Run `npm run typecheck`.
- Run `npm run build`.
- Fix build and type errors.
- Add `lib/env.ts` for environment validation.
- Expand `.env.example`.
- Add `lib/db.ts`.
- Expand `prisma/schema.prisma` for MVP entities.
- Add seed script coverage for products, content, and sample orders.
- Open a follow-up branch for JSON-to-Prisma conversion.

Exit criteria:

- `main` builds cleanly.
- GitHub contains a reproducible baseline.
- The next branch can focus only on persistence and auth.

## Build Order Summary

1. Stabilize repository and CI.
2. Configure environment and deployment.
3. Replace JSON storage with Prisma/PostgreSQL.
4. Add authentication and admin permissions.
5. Build production pricing engine.
6. Wire cart and Stripe checkout.
7. Harden design studio storage and artwork review.
8. Add production workflow.
9. Add storefront engine.
10. Add shipping abstraction.
11. Move CMS content to database.
12. Add analytics and reporting.
13. Harden security and compliance.
14. Add AI features after real workflow data exists.
