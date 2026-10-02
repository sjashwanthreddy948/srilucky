import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { db, isRemote, takeRateLimit } from "./db.mjs";
export const services = [
  "Eye Examination",
  "Vision Testing",
  "Consultation",
  "Contact Lens Consultation",
  "Spectacle Fitting",
];
const times = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
const app = express();
if (process.env.VERCEL) app.set("trust proxy", 1);
const limiter = (options) => {
  if (!isRemote) return rateLimit(options);
  return async (req, res, next) => {
    try {
      const key = createHash("sha256")
        .update(
          `${options.windowMs}:${options.limit}:${ipKeyGenerator(req.ip || "")}`,
        )
        .digest("hex");
      const result = await takeRateLimit(key, options.limit, options.windowMs);
      if (!result.allowed)
        return res
          .set("Retry-After", String(result.retryAfter))
          .status(429)
          .json(options.message);
      next();
    } catch (error) {
      next(error);
    }
  };
};
const distRoot = fileURLToPath(new URL("../dist/", import.meta.url));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        upgradeInsecureRequests:
          process.env.NODE_ENV === "production" ? [] : null,
      },
    },
  }),
);
app.use(express.json({ limit: "30kb" }));
app.use(cookieParser());
app.use(
  "/api",
  limiter({
    windowMs: 60000,
    limit: 100,
    message: { error: "Please wait a minute before trying again." },
  }),
);
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "private, no-store");
  const origins =
    process.env.NODE_ENV === "production"
      ? [
          process.env.SITE_URL,
          ...[process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
            .filter(Boolean)
            .map((host) => "https://" + host),
        ]
      : [
          process.env.SITE_URL,
          "http://localhost:5173",
          "http://localhost:3001",
        ];
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.headers.origin &&
    !origins.includes(req.headers.origin)
  )
    return res.status(403).json({ error: "Origin not permitted." });
  next();
});
app.get("/api/health", async (_, res) => {
  await db.prepare("SELECT 1 AS ok").get();
  res.json({
    ok: true,
    storage: isRemote ? "persistent-remote" : "local-sqlite",
  });
});
const clean = z
  .string()
  .trim()
  .max(2000)
  .transform((s) => s.replace(/[<>]/g, ""));
const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number.")
  .refine((v) => {
    const digits = v.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }, "Enter 7 to 15 phone digits.");
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T00:00:00Z");
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Choose a valid date.");
const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date(),
  );
const getSettings = async () => {
  const s = await db.prepare("SELECT * FROM store_settings WHERE id=1").get();
  return {
    ...s,
    phone: s.phone || process.env.PHONE_NUMBER || "",
    whatsapp: s.whatsapp || process.env.WHATSAPP_NUMBER || "",
  };
};
app.get("/api/public", async (_, res) =>
  res.json({ settings: await getSettings(), services, times }),
);
app.post(
  "/api/appointments",
  limiter({
    windowMs: 3600000,
    limit: 20,
    message: {
      error: "Too many appointment requests. Please contact the store.",
    },
  }),
  async (req, res) => {
    const parsed = z
      .object({
        customer_name: clean.pipe(z.string().min(2).max(100)),
        phone,
        service: z.enum(services),
        date,
        time: z.enum(times),
        message: clean.default(""),
      })
      .strict()
      .safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({
        error: "Please check your name, phone, service, date and time.",
      });
    const p = parsed.data;
    if (p.date < today())
      return res.status(400).json({ error: "Choose today or a future date." });
    const now = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
    if (p.date === today() && p.time <= now)
      return res.status(400).json({
        error:
          "That time has passed. Please choose a later time or another date.",
      });
    const r = await db
      .prepare(
        "INSERT INTO appointments(customer_name,phone,service,date,time,message) VALUES(?,?,?,?,?,?)",
      )
      .run(p.customer_name, p.phone, p.service, p.date, p.time, p.message);
    res.status(201).json({ id: Number(r.lastInsertRowid), status: "Pending" });
  },
);
app.post(
  "/api/auth/login",
  limiter({
    windowMs: 900000,
    limit: 10,
    message: { error: "Too many login attempts. Try again in 15 minutes." },
  }),
  async (req, res) => {
    const parsed = z
      .object({ email: z.email(), password: z.string().min(1).max(256) })
      .safeParse(req.body);
    const admin = parsed.success
      ? await db
          .prepare("SELECT * FROM admins WHERE email=?")
          .get(parsed.data.email.toLowerCase())
      : null;
    if (!admin)
      return res.status(401).json({ error: "Email or password is incorrect." });
    const [salt, hash] = admin.password_hash.split(":");
    if (
      !timingSafeEqual(
        Buffer.from(hash, "hex"),
        scryptSync(parsed.data.password, salt, 64),
      )
    )
      return res.status(401).json({ error: "Email or password is incorrect." });
    await db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
    const token = randomBytes(32).toString("hex");
    await db
      .prepare("INSERT INTO sessions VALUES(?,?,?)")
      .run(
        createHash("sha256").update(token).digest("hex"),
        admin.id,
        Date.now() + 8 * 3600000,
      );
    res.cookie("session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 3600000,
      path: "/",
    });
    res.json({ ok: true });
  },
);
const auth = async (req, res, next) => {
  const token = createHash("sha256")
    .update(req.cookies.session || "")
    .digest("hex");
  if (
    !(await db
      .prepare("SELECT admin_id FROM sessions WHERE token=? AND expires>?")
      .get(token, Date.now()))
  )
    return res.status(401).json({ error: "Please sign in." });
  next();
};
app.post("/api/auth/logout", async (req, res) => {
  await db.prepare("DELETE FROM sessions WHERE token=?").run(
    createHash("sha256")
      .update(req.cookies.session || "")
      .digest("hex"),
  );
  res.clearCookie("session");
  res.json({ ok: true });
});
app.get("/api/admin", auth, async (_, res) =>
  res.json({
    appointments: await db
      .prepare("SELECT * FROM appointments ORDER BY date DESC,time DESC")
      .all(),
    settings: await getSettings(),
  }),
);
app.patch("/api/admin/appointments/:id", auth, async (req, res) => {
  const p = z
    .object({
      status: z.enum(["Pending", "Confirmed", "Completed", "Cancelled"]),
      date: date.optional(),
      time: z.enum(times).optional(),
    })
    .strict()
    .safeParse(req.body);
  if (!p.success)
    return res
      .status(400)
      .json({ error: "Choose a valid appointment status, date and time." });
  const entries = Object.entries(p.data);
  const r = await db
    .prepare(
      `UPDATE appointments SET ${entries.map(([k]) => k + "=?").join(",")} WHERE id=?`,
    )
    .run(...entries.map(([, v]) => v), Number(req.params.id));
  if (!r.changes)
    return res.status(404).json({ error: "Appointment not found." });
  res.json({ ok: true });
});
const optionalPhone = z.union([z.literal(""), phone]);
const optionalURL = z.union([
  z.literal(""),
  z.url().refine((v) => v.startsWith("https://"), "Use an HTTPS URL."),
]);
app.patch("/api/admin/settings", auth, async (req, res) => {
  const p = z
    .object({
      business_name: clean.pipe(z.string().min(2).max(100)),
      phone: optionalPhone,
      whatsapp: optionalPhone,
      address: clean,
      hours: clean,
      maps_url: optionalURL.refine(
        (v) =>
          !v ||
          [
            "google.com",
            "www.google.com",
            "maps.google.com",
            "maps.app.goo.gl",
            "goo.gl",
          ].includes(new URL(v).hostname),
        "Use a Google Maps link.",
      ),
      instagram: optionalURL,
      facebook: optionalURL,
      store_image: optionalURL,
    })
    .strict()
    .safeParse(req.body);
  if (!p.success)
    return res.status(400).json({
      error: p.error.issues
        .map((i) => i.path.join(".") + ": " + i.message)
        .join("; "),
    });
  const entries = Object.entries(p.data);
  await db
    .prepare(
      `UPDATE store_settings SET ${entries.map(([k]) => k + "=?").join(",")} WHERE id=1`,
    )
    .run(...entries.map(([, v]) => v));
  res.json({ ok: true });
});
const escape = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const origin = () =>
  (
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL
      : "http://localhost:3001")
  ).replace(/\/$/, "");
app.get("/robots.txt", async (_, res) =>
  res
    .type("text/plain")
    .send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${origin()}/sitemap.xml`,
    ),
);
app.get("/sitemap.xml", async (_, res) =>
  res
    .type("application/xml")
    .send(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(origin())}</loc></url></urlset>`,
    ),
);
app.use("/api", async (_, res) =>
  res.status(404).json({ error: "Unknown API route." }),
);
app.use(express.static(distRoot, { index: false }));
app.get(["/", "/admin"], async (req, res) => {
  let html = readFileSync(distRoot + "index.html", "utf8");
  const s = await getSettings();
  const meta =
    req.path === "/admin"
      ? '<meta name="robots" content="noindex,nofollow"/>'
      : `<link rel="canonical" href="${escape(origin())}"/><meta property="og:url" content="${escape(origin())}"/>${s.store_image ? `<meta property="og:image" content="${escape(s.store_image)}"/>` : ""}`;
  html = html.replace("</head>", meta + "</head>");
  res.type("html").send(html);
});
app.use(async (_, res) =>
  res
    .status(404)
    .type("html")
    .send('<h1>Page not found</h1><a href="/">Back to Sri Lucky</a>'),
);
app.use((err, req, res, next) =>
  res
    .status(err.status || 500)
    .json({
      error:
        err.status === 503
          ? "Booking is temporarily unavailable. Please contact the store or try again later."
          : "Unable to complete your request. Please try again.",
    }),
);
export default app;
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  app.listen(process.env.PORT || 3001, () =>
    console.log("Sri Lucky running on port " + (process.env.PORT || 3001)),
  );
