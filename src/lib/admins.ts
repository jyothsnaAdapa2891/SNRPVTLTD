import "server-only";

/**
 * The fixed list of admins who may sign in. There is no sign-up flow —
 * accounts only come from the ADMIN_CREDENTIALS environment variable
 * (format: "user1:password1,user2:password2").
 *
 * If unset in development, a single default admin/admin account is used so
 * the app runs with zero setup. In production, ADMIN_CREDENTIALS must be set
 * or no one can log in.
 */

function loadAdmins(): Map<string, string> {
  const raw = process.env.ADMIN_CREDENTIALS;
  const map = new Map<string, string>();

  if (!raw) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[auth] ADMIN_CREDENTIALS is not set — using default dev admin (admin/admin). Set ADMIN_CREDENTIALS before deploying.",
      );
      map.set("admin", "admin");
    }
    return map;
  }

  for (const pair of raw.split(",")) {
    const [user, pass] = pair.split(":").map((s) => s.trim());
    if (user && pass) map.set(user, pass);
  }
  return map;
}

export function verifyCredentials(username: string, password: string): boolean {
  const admins = loadAdmins();
  const expected = admins.get(username.trim());
  return expected !== undefined && expected === password;
}
