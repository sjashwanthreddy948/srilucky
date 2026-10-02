const origin = new URL(
  process.argv[2] || process.env.SITE_URL || "https://srilucky.vercel.app",
).origin;
for (const path of ["/", "/admin", "/robots.txt", "/sitemap.xml"]) {
  const response = await fetch(origin + path);
  if (response.status !== 200)
    throw new Error(`${path}: HTTP ${response.status}`);
  if (
    path === "/admin" &&
    !response.headers.get("x-robots-tag")?.includes("noindex")
  )
    throw new Error("Admin indexing protection is missing");
}
const response = await fetch(origin + "/api/health");
const health = await response.json();
if (!response.ok || health.storage !== "persistent-remote")
  throw new Error(
    "Production database is not ready: " + JSON.stringify(health),
  );
console.log(
  `Production checks passed for ${origin}: public site, admin indexing protection, SEO endpoints and persistent remote database.`,
);
