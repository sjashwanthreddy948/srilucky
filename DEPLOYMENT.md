# Production deployment

Deploy this repository to the Vercel project `srilucky` in `jashwanthreddysingireddy948-2467s-projects`. Node.js 24 is configured in `package.json`. `vercel.json` serves the built site from Vercel's CDN and routes the API to `api/index.mjs`.

## Persistent database

Connect a Turso database to the project's **Production** environment using Vercel Storage/Marketplace. The free Starter plan and Mumbai (`bom1`) region suit this single-store app. Configure `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` through the integration, never in source code. Vercel must not use local SQLite for appointments. Missing database configuration returns 503 and disables booking rather than pretending to save a request.

Use a separate database for Preview if preview booking/admin access is required; do not share production customer records with preview deployments. Development continues to use the existing local database when no Turso URL is set.

## Required settings

In Vercel's Production environment set:

- `SITE_URL`: the final HTTPS production origin, with no path or trailing slash.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: the owner's email and a unique password of at least 12 characters. On first connection the account is created without overwriting existing credentials. Afterwards these bootstrap variables can be removed. Change/reset credentials by running `npm run create-admin` against the configured remote database.
- `PHONE_NUMBER` and `WHATSAPP_NUMBER`: optional initial contact values, with country code. Admin store settings override them.

Redeploy after adding environment variables. Log in at `/admin` and configure the actual phone, WhatsApp, address, hours and Maps link. Only add a real store photograph. No default password or fictitious contact information is shipped.

## Validation

`npm ci`, `npm test`, and `npm run build` run in GitHub Actions. Tests cover existing-data migration, authentication, appointment validation, asynchronous database persistence across restarts, durable rate limiting, and failure when serverless storage is missing. Browser tests cover booking, the frame transition and responsive behavior.

After deployment, `/api/health` must return `{"ok":true,"storage":"persistent-remote"}`. Verify owner login and a booking request, remove the test request, and confirm the saved request survives a deployment. Keep database backups enabled with the provider and restrict account access.

Session cookies are HttpOnly, Secure in production, and SameSite=Strict. Production APIs reject unexpected browser origins, validate requests and use parameterized SQL. Durable remote rate limits protect bookings and login across function instances. The `rate_limits` table contains hashed client identifiers, not raw IP addresses; expired rows are periodically removed.

## Existing local business records

The original local SQLite file remains excluded from Git and Vercel uploads. If it contains real records that must move to production, use an authenticated migration after database setup; never commit the database, customer records, session tokens or credentials. Local catalogue-removal migration preserves appointments and owner/store settings.
