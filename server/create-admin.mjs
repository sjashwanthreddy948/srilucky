import "dotenv/config";
import { randomBytes, scryptSync } from "node:crypto";
import { db } from "./db.mjs";
const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
if (!email || !password || password.length < 12)
  throw new Error(
    "Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in .env.",
  );
const salt = randomBytes(16).toString("hex");
await db
  .prepare(
    "INSERT INTO admins(email,password_hash) VALUES(?,?) ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash",
  )
  .run(
    email.toLowerCase(),
    salt + ":" + scryptSync(password, salt, 64).toString("hex"),
  );
console.log("Admin account saved.");
