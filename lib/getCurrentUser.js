import { cookies } from "next/headers";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";

// Returns { userId, email, name } or null. Use inside API route handlers
// and server components to identify the logged-in user.
export async function getCurrentUserPayload() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return payload;
}
