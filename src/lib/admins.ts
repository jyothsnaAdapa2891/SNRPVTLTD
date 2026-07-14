import "server-only";
import bcrypt from "bcryptjs";
import { connectDB } from "./mongodb";
import { AdminModel } from "./models/Admin";

/**
 * The fixed list of admins who may sign in. There is no sign-up flow.
 *
 * Passwords are stored **hashed, in the database** — never in plain text and
 * never sent to the browser. ADMIN_CREDENTIALS (env var, format
 * "user1:password1,user2:password2") is only used once, the very first time
 * the app runs, to seed the initial admin accounts into MongoDB. After that,
 * the env var is no longer consulted — add or change admins by editing the
 * `admins` collection (or adding a small admin-management screen later).
 *
 * If ADMIN_CREDENTIALS is unset in development, a single default admin/admin
 * account is seeded so the app runs with zero setup.
 */

function parseCredentialList(raw: string): [string, string][] {
  const pairs: [string, string][] = [];
  for (const pair of raw.split(",")) {
    const [user, pass] = pair.split(":").map((s) => s.trim());
    if (user && pass) pairs.push([user, pass]);
  }
  return pairs;
}

async function ensureSeeded(): Promise<void> {
  const count = await AdminModel.estimatedDocumentCount();
  if (count > 0) return;

  const raw = process.env.ADMIN_CREDENTIALS;
  let seed: [string, string][];

  if (raw) {
    seed = parseCredentialList(raw);
  } else if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[auth] ADMIN_CREDENTIALS is not set — seeding a default dev admin (admin/admin). Set ADMIN_CREDENTIALS (used once, on first run) before deploying.",
    );
    seed = [["admin", "admin"]];
  } else {
    return; // production with no seed source: no admins, no logins
  }

  const docs = await Promise.all(
    seed.map(async ([username, password]) => ({
      _id: username,
      passwordHash: await bcrypt.hash(password, 10),
    })),
  );
  if (docs.length > 0) {
    await AdminModel.insertMany(docs, { ordered: false }).catch(() => {
      // Ignore duplicate-key races if multiple requests seed concurrently.
    });
  }
}

export async function verifyCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  await connectDB();
  await ensureSeeded();

  const admin = await AdminModel.findById(username.trim()).lean<{
    passwordHash?: string;
  } | null>();
  if (!admin?.passwordHash) return false;

  return bcrypt.compare(password, admin.passwordHash);
}
