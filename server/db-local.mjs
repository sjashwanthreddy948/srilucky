import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
mkdirSync("data", { recursive: true });
export const db = new DatabaseSync("data/srilucky.db");
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY,email TEXT UNIQUE,password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,admin_id INTEGER REFERENCES admins(id),expires INTEGER);
CREATE TABLE IF NOT EXISTS appointments(id INTEGER PRIMARY KEY,customer_name TEXT NOT NULL,phone TEXT NOT NULL,service TEXT NOT NULL,date TEXT NOT NULL,time TEXT NOT NULL,message TEXT DEFAULT '',status TEXT DEFAULT 'Pending',created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
// One-time, explicit removal of the superseded shop architecture. Existing visits and accounts survive.
if (db.prepare("PRAGMA user_version").get().user_version < 2) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const previous = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='store_settings'",
      )
      .get()
      ? db.prepare("SELECT * FROM store_settings WHERE id=1").get()
      : {};
    db.exec(`DROP TABLE IF EXISTS enquiries; DROP TABLE IF EXISTS product_images; DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS product_categories; DROP TABLE IF EXISTS offers; DROP TABLE IF EXISTS reviews;
      DROP TABLE IF EXISTS customers; DROP TABLE IF EXISTS services; DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS store_settings;
      CREATE TABLE store_settings(id INTEGER PRIMARY KEY CHECK(id=1),business_name TEXT NOT NULL DEFAULT 'Sri Lucky Eye Wear & Clinic',phone TEXT DEFAULT '',whatsapp TEXT DEFAULT '',address TEXT DEFAULT '',hours TEXT DEFAULT '',maps_url TEXT DEFAULT '',instagram TEXT DEFAULT '',facebook TEXT DEFAULT '',store_image TEXT DEFAULT '');`);
    db.prepare(
      "INSERT INTO store_settings(id,business_name,phone,whatsapp,address,hours,maps_url,store_image) VALUES(1,?,?,?,?,?,?,?)",
    ).run(
      previous?.business_name || "Sri Lucky Eye Wear & Clinic",
      previous?.phone || "",
      previous?.whatsapp || "",
      previous?.address || "",
      previous?.hours || "",
      previous?.maps_url || "",
      previous?.store_image || "",
    );
    db.exec("PRAGMA user_version=2; COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
