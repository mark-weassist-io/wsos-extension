import type { Context, Next } from "hono"
import { getCookie } from "hono/cookie"
import { verify, sign } from "hono/jwt"
import { getUserById } from "../db/queries/auth"

const JWT_SECRET = process.env.JWT_SECRET || "nexus-dev-secret-change-in-production"

export function getJwtSecret(): string {
  return JWT_SECRET
}

export function getLoginRedirectUrl(c: Context): string {
  const path = c.req.path
  return path === "/login" ? "/login" : `/login?redirect=${encodeURIComponent(path)}`
}

export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, "nexus_token")
  if (!token) {
    const redirect = getLoginRedirectUrl(c)
    if (c.req.path.startsWith("/api/") || c.req.header("HX-Request")) {
      return c.body(null, 401)
    }
    return c.redirect(redirect)
  }

  try {
    const payload = await verify(token, JWT_SECRET) as { userId: number; role: string }
    const user = getUserById(payload.userId)
    if (!user) {
      return c.redirect("/login")
    }
    c.set("user", user)
    c.set("userId", user.id)
    c.set("userRole", user.role)
    await next()
  } catch {
    return c.redirect("/login")
  }
}

export async function generateToken(userId: number, role: string): Promise<string> {
  return sign({ userId, role, exp: Math.floor(Date.now() / 1000) + 86400 * 7 }, JWT_SECRET)
}
