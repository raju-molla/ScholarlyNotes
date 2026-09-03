// Admin access is controlled by the deployment owner via an environment
// variable, not by who happens to sign up first — keeps /admin restricted
// to whoever the owner explicitly lists, on any hosting platform.
export function isConfiguredAdmin(email) {
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes((email || "").toLowerCase());
}
