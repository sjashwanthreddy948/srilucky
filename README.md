# Sri Lucky — See clearer.

A cinematic brand and eye-clinic website beginning with the supplied woman's portrait and continuing with one black cat-eye frame. No catalogue, product management, inventory or checkout.

## Run

Node.js 24 or newer is required.

```powershell
npm.cmd install
npm.cmd run dev
```

Website: http://localhost:5173 · Owner workspace: http://localhost:5173/admin

## Owner setup

Copy `.env.example` to `.env`, set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters, and run `npm.cmd run create-admin`. No default credentials exist. Sign in and configure the business name, international phone/WhatsApp numbers, address, opening hours, Google Maps and social links. Optional `PHONE_NUMBER` and `WHATSAPP_NUMBER` environment values are used when admin contact fields are empty.

Only use a real, authorized store photograph for the optional store image. No stock or fabricated store photos are displayed by default. Contact actions explain when business details have not been configured; visitors can still request an appointment.

## The single-frame journey

- `src/motion.ts`: nine continuous poses interpolated across measured scene centers. Mobile has its own restrained choreography.
- `src/FrameJourney.tsx`: one persistent frame and one requestAnimationFrame controller. At rest the original photo appears normally. The sticky hero zooms toward the glasses; the original masked rim pixels move forward, grow and lift while the face recedes independently. The frame stays fully opaque throughout extraction. Only the background fades once separation is clear. Reversing scroll reverses the same journey. Native scrolling is preserved.
- `src/FrameArtwork.tsx`: a shared SVG trace clips the actual hero pixels for the first extraction and defines the later high-resolution material pass. This preserves the silhouette through the transition and keeps enlarged rims crisp. Transparent lens interiors carry restrained blue reflections and a moving light streak. There is no separate generated frame asset or shape swap.
- `/hero-portrait.webp` and `/hero-clean.webp`: approximately 155 KB combined. The built-in imagegen tool extended the supplied portrait and prepared a clean plate without glasses. The clean plate repairs only the eyewear region beneath the extracted frame; the rest of the original photograph is preserved. See `ASSET-PROMPTS.md` for prompts and provenance.
- CSS perspective gives the photographic frame depth and restrained rotations; this is a flat photo layer, not a volumetric 3D model. Using it as the primary renderer preserves the photographic silhouette and eliminates WebGL startup, device compatibility and GPU costs. There is no alternate frame that replaces it on mobile.
- `src/portrait.css`: separate mobile crop, portrait typography and inline booking layout. Main image has high fetch priority; the owner bundle loads separately.
- Reduced-motion users retain the portrait without zoom, then a static, smaller frame. Off-tab rendering pauses. The travelling frame and reduced-motion behavior share the same controller.

The reference site was reviewed only for visual pacing and single-object choreography. Its assets, text, branding and source code are not used.

## Business platform

SQLite persists appointment requests and store settings. Visitors can book directly in the page or open the accessible booking dialog from any CTA. The owner dashboard provides today's appointments, pending/confirmed/completed counts, status updates and customer call/WhatsApp actions. Preferred times are requests and need manual confirmation. WhatsApp links are click-to-chat, not automated delivery. No medical outcomes or credentials are invented.

The rebuild migrates the existing database once, removes the superseded shop tables and unused tables, and preserves appointments, owner accounts and contact settings. The only tables are `admins`, `sessions`, `appointments` and `store_settings`. Historical appointment service names remain preserved. The migration is transactional and tested.

Passwords use salted scrypt hashes. Session tokens are hashed in the database and sent in HttpOnly, SameSite cookies. Admin APIs require authentication. Forms use server-side validation, parameterized SQL, rate limiting and origin checks. Secrets remain server-side.

## Production

```powershell
npm.cmd run build
$env:NODE_ENV = 'production'
npm.cmd start
```

For Vercel, follow [DEPLOYMENT.md](DEPLOYMENT.md). The CDN serves the frontend; `api/index.mjs` exports the API without starting a listening server. Turso persists appointments, settings and sessions, with durable rate limiting across function instances. The API fails safely when serverless database settings are missing. GitHub Actions validates the production build.

For a standalone server, set `SITE_URL` to the live HTTPS origin and `PORT` if needed. Use an HTTPS reverse proxy; production session cookies require HTTPS. Without a Turso URL, keep `data/` on a persistent, restricted volume with tested backups. Local SQLite is for one server, not an ephemeral/serverless disk. Confirm real services, contact details and time preferences before publishing.

SEO includes semantic headings, metadata, a canonical URL, sitemap, robots exclusion for the owner workspace and local-business schema when an actual address is configured. Measure real-device frame rate and production Core Web Vitals before launch; desktop browser simulation does not establish a performance guarantee.

## Verification

```powershell
npm.cmd test
npm.cmd run build
npx.cmd playwright install chromium
node tests/browser.mjs
node tests/admin-browser.mjs
```

API tests use temporary databases and generated test credentials. Motion tests check scene-boundary continuity and the mobile trajectory. Browser checks verify the portrait zoom and fade, one persistent frame through all nine scenes, nine widths, visible glasses crop, inline appointments, mobile navigation, reduced motion, connection errors and owner workflows. Screenshots are in ignored `test-results/`. The public browser test saves one appointment named `Browser Rebuild Test`; remove only that test record after verification.
