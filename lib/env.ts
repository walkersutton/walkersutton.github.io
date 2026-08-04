// The repo commits a dotenvx-encrypted .env, and Next loads .env at runtime.
// Whenever the private key hasn't reached the running server, values arrive as
// the literal "encrypted:..." ciphertext instead of their real contents. That
// is never a usable value, but it *is* a truthy string, so it sails past every
// `if (!process.env.X)` guard and fails much later as something unrelated —
// `fetch failed` for a URL, `Invalid token` from an SDK. Detect it explicitly.
const ENCRYPTED_PREFIX = "encrypted:";

export function isEncrypted(value: string | undefined): boolean {
  return typeof value === "string" && value.startsWith(ENCRYPTED_PREFIX);
}

/** The value only when it is genuinely usable; undefined if missing or still ciphertext. */
export function plainEnv(name: string): string | undefined {
  const value = process.env[name];
  return !value || isEncrypted(value) ? undefined : value;
}

export function encryptedEnvMessage(name: string): string {
  return (
    `${name} is still dotenvx ciphertext at runtime, so it cannot be used. ` +
    `The deployment needs either the decrypted value set directly, or ` +
    `DOTENV_PRIVATE_KEY set so it can be decrypted on boot.`
  );
}
