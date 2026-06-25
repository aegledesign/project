# Aegle Platform Todos

## Before First GitHub Push

- Add project roadmap to `docs/plan.md`.
- Review `.env.example` and confirm no real secrets are committed.
- Create a local `.env.local` for development-only values.
- Run `npm install` to generate `package-lock.json` for this project.
- Run `npm run typecheck`.
- Run `npm run build`.
- Fix any TypeScript, lint, or production build failures.
- Initialize Git in this folder.
- Make the first commit.
- Create a private GitHub repository.
- Push the initial commit to GitHub.

## Production Build Path

- Replace local JSON-backed data with Prisma/PostgreSQL.
- Add real customer and admin authentication.
- Add role-based admin permissions.
- Wire Stripe checkout and webhooks.
- Add S3 or R2 upload storage for artwork files.
- Add transactional emails.
- Expand product and pricing models for decoration methods, quantity breaks, and storefront pricing.
- Add tests and CI.
