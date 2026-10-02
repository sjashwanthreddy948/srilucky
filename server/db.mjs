import "dotenv/config";
import { randomBytes, scryptSync } from "node:crypto";
export const isRemote = Boolean(process.env.TURSO_DATABASE_URL);
let connection, initialization;
const unavailable = () =>
  Object.assign(new Error("Persistent booking storage is not configured."), {
    status: 503,
  });
async function initialize() {
  if (!isRemote) {
    if (process.env.VERCEL) throw unavailable();
    connection = (await import("./db-local.mjs")).db;
    return;
  }
  const url = process.env.TURSO_DATABASE_URL;
  if (
    process.env.VERCEL &&
    (!/^(libsql|https):\/\//.test(url) || !process.env.TURSO_AUTH_TOKEN)
  )
    throw unavailable();
  const { createClient } = await import("@libsql/client");
  connection = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  await connection.executeMultiple(`
    CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY,email TEXT UNIQUE,password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,admin_id INTEGER REFERENCES admins(id),expires INTEGER);
    CREATE TABLE IF NOT EXISTS appointments(id INTEGER PRIMARY KEY,customer_name TEXT NOT NULL,phone TEXT NOT NULL,service TEXT NOT NULL,date TEXT NOT NULL,time TEXT NOT NULL,message TEXT DEFAULT '',status TEXT DEFAULT 'Pending',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS store_settings(id INTEGER PRIMARY KEY CHECK(id=1),business_name TEXT NOT NULL DEFAULT 'Sri Lucky Eye Wear & Clinic',phone TEXT DEFAULT '',whatsapp TEXT DEFAULT '',address TEXT DEFAULT '',hours TEXT DEFAULT '',maps_url TEXT DEFAULT '',instagram TEXT DEFAULT '',facebook TEXT DEFAULT '',store_image TEXT DEFAULT '');
    INSERT OR IGNORE INTO store_settings(id) VALUES(1);
    CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,hits INTEGER NOT NULL,expires INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
    CREATE INDEX IF NOT EXISTS appointments_date ON appointments(date,time);
    CREATE INDEX IF NOT EXISTS rate_limits_expiry ON rate_limits(expires);
  `);
  // Optional first deployment bootstrap. Existing owner credentials are never reset.
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (email && password) {
    if (password.length < 12)
      throw new Error("ADMIN_PASSWORD must have at least 12 characters.");
    const salt = randomBytes(16).toString("hex");
    await connection.execute({
      sql: "INSERT INTO admins(email,password_hash) VALUES(?,?) ON CONFLICT(email) DO NOTHING",
      args: [
        email.toLowerCase(),
        salt + ":" + scryptSync(password, salt, 64).toString("hex"),
      ],
    });
  }
}
async function ready() {
  if (!initialization)
    initialization = initialize().catch((error) => {
      initialization = null;
      throw error;
    });
  await initialization;
}
if (!isRemote && !process.env.VERCEL) await ready();
export const db = {
  prepare(sql) {
    const query = async (args) => {
      await ready();
      return isRemote
        ? connection.execute({ sql, args })
        : connection.prepare(sql);
    };
    return {
      async get(...args) {
        const r = await query(args);
        return isRemote ? r.rows[0] : r.get(...args);
      },
      async all(...args) {
        const r = await query(args);
        return isRemote ? r.rows : r.all(...args);
      },
      async run(...args) {
        const r = await query(args);
        return isRemote
          ? { changes: r.rowsAffected, lastInsertRowid: r.lastInsertRowid }
          : r.run(...args);
      },
    };
  },
};
export async function takeRateLimit(key, limit, windowMs) {
  const now = Date.now(),
    bucket = Math.floor(now / windowMs),
    expires = (bucket + 1) * windowMs;
  const row = await db
    .prepare(
      "INSERT INTO rate_limits(key,hits,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits",
    )
    .get(key + ":" + bucket, expires);
  if (Math.random() < 0.01)
    await db.prepare("DELETE FROM rate_limits WHERE expires<?").run(now);
  return {
    allowed: Number(row.hits) <= limit,
    retryAfter: Math.max(1, Math.ceil((expires - now) / 1000)),
  };
}
