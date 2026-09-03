import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "rn_token";

if (!JWT_SECRET) {
  throw new Error(
    "Missing JWT_SECRET environment variable. Add it to your .env.local file."
  );
}

const secretKey = new TextEncoder().encode(JWT_SECRET);
const TOKEN_TTL = "7d";

/**
 * Sign a JWT for a given user payload ({ userId, email, name }).
 */
export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secretKey);
}

/**
 * Verify a JWT string. Returns the decoded payload or null if invalid/expired.
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Cookie options shared between routes that set the auth cookie.
 */
export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days, matches TOKEN_TTL
  };
}
