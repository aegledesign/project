# AEGLE CUSTOM PLATFORM - BUILD PATH

## Plan Review

The master development plan is directionally strong, but it is too broad to build phase-by-phase as written. Several later features depend on decisions that must be made much earlier, especially product data modeling, pricing, artwork storage, order lifecycle, and permissions.

The biggest risk areas are:

- Design Studio complexity: Fabric.js is good for canvas editing, but print-ready output, proof generation, SVG/PDF handling, font licensing, and production file export need early architecture.
- Product pricing: Custom apparel pricing is not simple ecommerce pricing. The platform needs quantity breaks, decoration methods, locations, setup fees, rush fees, store-specific pricing, fundraiser margins, and corporate budgets.
- Stores and group ordering: Corporate stores, team stores, and fundraising stores should share one flexible Storefront model with different modes.
- Admin backend scope: "Fully editable admin" can balloon. Start with operational admin: products, orders, users, storefronts, designs, and production.
- Shipping integrations: UPS, FedEx, and USPS should likely be abstracted behind one shipping provider layer, possibly using EasyPost, Shippo, or ShipStation instead of direct carrier integrations.
- AI features: These should be deferred until the core platform has real design and order data.

## Recommended Build Path

### Stage 0: Product Definition

Before writing much code, define the operational rules.

Deliverables:

- Product types: apparel, promo products, digital proof-only, quote-only
- Decoration methods: screen print, embroidery, DTG, DTF, sublimation, engraving, etc.
- Pricing rules: base price, quantity tiers, decoration cost, setup fees, margins
- Order types: normal checkout, quote request, group order, corporate store order, fundraiser order
- User roles and permission matrix
- Production workflow states
- Design file requirements for production

This prevents rebuilding the database later.

### Stage 1: Technical Foundation

Build the app shell and deployment foundation.

Core stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- NextAuth/Auth.js
- Stripe
- S3-compatible storage
- Resend
- Sentry
- PostHog
- Vercel

Deliverables:

- Production build passes
- CI checks TypeScript, linting, formatting, tests
- Environment validation
- Database migrations
- Seed data
- Basic layout system
- Admin route shell
- Customer route shell

### Stage 2: Core Data Model

Build the database around real business objects.

Primary models:

- User
- Role
- Permission
- CustomerProfile
- StaffProfile
- Product
- ProductVariant
- ProductColor
- ProductSize
- Category
- DecorationMethod
- PricingRule
- Design
- DesignAsset
- Cart
- CartItem
- Order
- OrderItem
- Payment
- Shipment
- Storefront
- StorefrontProduct
- ProductionJob
- AuditLog

Important recommendation: use one flexible Storefront model with a type field:

```ts
CORPORATE
FUNDRAISER
TEAM
PUBLIC
PRIVATE
```

This avoids duplicating corporate store, fundraiser store, and team store logic.

### Stage 3: Authentication And Admin Base

Build the control layer early.

Deliverables:

- Customer signup/login
- Staff/admin login
- Email verification
- Password reset
- Role-based route protection
- Admin dashboard shell
- User management
- Permission checks
- Audit logging foundation

Avoid overbuilding social login at first unless it is a hard requirement.

### Stage 4: Product Catalog And Admin Product Management

Build the product engine before checkout or design studio.

Customer-facing:

- Category browsing
- Search
- Filters
- Product detail page
- Variant/color/size selection
- Quantity pricing preview

Admin-facing:

- Create/edit/archive products
- Manage variants
- Manage images
- Manage pricing tiers
- Assign decoration methods
- Bulk import/export later, not first

Deliverable:

- A customer can browse products and configure a basic product selection.

### Stage 5: Cart, Pricing, And Checkout MVP

Build money flow before advanced customization.

Deliverables:

- Cart
- Size breakdowns
- Quantity updates
- Guest checkout
- Customer checkout
- Stripe Checkout or Payment Element
- Order creation
- Payment records
- Basic confirmation emails
- Admin order view

Important: the pricing engine should be its own service/module, not scattered across UI components.

### Stage 6: Design Studio MVP

Start narrow. Do not attempt every file type and advanced tool immediately.

MVP features:

- Launch studio from product page
- Product mockup canvas
- Upload PNG/JPG/SVG
- Add text
- Move/resize/rotate
- Basic layers
- Save/load design
- Attach design to cart item
- Export preview image
- Store Fabric.js JSON
- Store uploaded assets in S3

Defer:

- PDF/AI/EPS import
- Curved text
- Vector conversion
- Advanced print quality checks
- Production-grade art normalization

Deliverable:

- Customer can design a product, save it, and purchase it.

### Stage 7: Order Management And Production Workflow

Once orders exist, build the internal workflow.

Deliverables:

- Order status history
- Artwork approval status
- Proof upload/generation
- Customer proof approval
- Production job creation
- Staff assignment
- Manufacturing stages
- Internal notes
- Customer-facing order status page

Recommended production states:

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

### Stage 8: Storefront System

Now build corporate, fundraiser, and team stores on top of the core catalog/order system.

Shared features:

- Storefront landing page
- Store-specific product selection
- Store-specific pricing
- Store branding
- Open/close dates
- Access control
- Reporting

Corporate-specific:

- Employee access
- Budgets
- Restricted products
- Optional approval flow

Fundraiser-specific:

- Margin/revenue tracking
- Donation reporting
- Public storefronts

Team/group-specific:

- Campaign close date
- Participant ordering
- Bulk production summary

### Stage 9: Group Ordering

Build this after storefronts because group ordering is essentially a campaign-based storefront plus aggregation.

Deliverables:

- Create campaign
- Invite participants
- Participant checkout
- Size aggregation
- Campaign deadline
- Auto-close
- Admin production summary
- Optional organizer dashboard

### Stage 10: Shipping

Recommended approach: use a shipping abstraction.

Options:

- EasyPost
- Shippo
- ShipStation
- Direct UPS/FedEx/USPS only if required

Deliverables:

- Shipping address validation
- Live rates
- Label creation
- Tracking number storage
- Tracking emails
- Shipment status updates

### Stage 11: CMS And Marketing Admin

Add editable content after the commerce engine works.

Deliverables:

- Homepage editor
- Banner editor
- FAQ editor
- Blog editor
- Storefront content blocks

Keep this separate from operational admin.

### Stage 12: Analytics And Reporting

Build reporting from actual platform events.

Deliverables:

- Revenue dashboard
- Order counts
- Product performance
- Storefront performance
- Fundraiser payouts
- Customer lifetime value
- Production queue metrics
- Conversion tracking with PostHog

### Stage 13: Security, Compliance, And Operations

Some security work starts from day one, but this stage hardens the system.

Deliverables:

- Rate limiting
- Audit logs
- Admin action history
- Sentry alerts
- Database backups
- Secure file access
- Signed S3 URLs
- Stripe webhook verification
- Privacy controls
- Data export/delete workflows

PCI note: use Stripe-hosted/payment-element flows so the platform does not directly handle raw card data.

### Stage 14: AI Features

Only add AI after the core data and workflows are stable.

Highest-value AI features first:

- Print quality warnings
- Background removal
- Low-resolution detection
- Quote assistant
- Product recommendation assistant

Vector conversion and AI artwork cleanup are useful but technically harder and should come later.

## Suggested MVP Scope

The first production MVP should include:

- Customer accounts
- Admin login
- Product catalog
- Product admin
- Cart
- Stripe checkout
- Basic design studio
- Saved designs
- Order admin
- Production statuses
- Basic email notifications
- S3 file storage
- Vercel deployment

Do not include in MVP:

- Corporate stores
- Fundraising stores
- Group ordering
- AI tools
- Full CMS
- Direct carrier integrations
- PDF/AI/EPS import
- Advanced analytics

## Build Order Summary

1. Define business rules and pricing logic
2. Build technical foundation
3. Build database schema
4. Build auth and permissions
5. Build product catalog/admin
6. Build cart and checkout
7. Build design studio MVP
8. Build order and production workflow
9. Build storefront engine
10. Build corporate/fundraiser/team stores
11. Build group ordering
12. Add shipping integrations
13. Add CMS
14. Add analytics
15. Add AI features
16. Harden security and compliance continuously

The key architectural decision is to treat this as a custom commerce and production workflow platform, not just a Shopify-style storefront. The database, pricing engine, design storage, and production workflow should be designed first, because every later feature depends on them.
