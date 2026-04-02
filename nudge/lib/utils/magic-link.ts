import crypto from "crypto";

const SECRET = process.env.MAGIC_LINK_SECRET || "nudge-dev-secret-change-in-production";

/**
 * Generate a secure HMAC-signed token for magic links.
 * Format: base64url(actionItemId:newStatus:hmac)
 */
export function generateMagicToken(actionItemId: string, newStatus: string): string {
  const payload = `${actionItemId}:${newStatus}`;
  const hmac = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

/**
 * Verify and decode a magic link token.
 * Returns { actionItemId, newStatus } or throws if invalid.
 */
export function verifyMagicToken(token: string): { actionItemId: string; newStatus: string } {
  const decoded = Buffer.from(token, "base64url").toString("utf-8");
  const parts = decoded.split(":");
  if (parts.length < 3) throw new Error("Invalid token format");

  const hmac = parts.pop()!;
  const [actionItemId, newStatus] = parts;

  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(`${actionItemId}:${newStatus}`)
    .digest("hex");

  const valid = crypto.timingSafeEqual(Buffer.from(hmac, "hex"), Buffer.from(expected, "hex"));
  if (!valid) throw new Error("Invalid token signature");

  return { actionItemId, newStatus };
}
