import crypto from "crypto";

function secret(): string {
  return process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD ?? "dev";
}

export function signToken(): string {
  return crypto.createHmac("sha256", secret()).update("admin-session").digest("hex");
}

export function verifyToken(token: string): boolean {
  const expected = signToken();
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
