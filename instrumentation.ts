import { isEncrypted } from "@/lib/env";

// The repo commits a dotenvx-encrypted .env. Locally the npm scripts run
// through `dotenvx run`, which decrypts before Next ever starts. On Vercel
// nothing runs dotenvx: the build gets decrypted values, but the serverless
// runtime boots the built output directly, and Next's own .env loader hands
// every secret to the app as the literal "encrypted:..." ciphertext.
//
// That is silently destructive, because ciphertext is a truthy string. It
// passes `if (!process.env.X)`, then fails much later as something that looks
// unrelated: a MapShare URL that "fails to fetch", a Blob token the SDK calls
// invalid. Decrypt here instead, once, before the app serves anything.
//
// Setting the decrypted values directly in the deployment environment also
// works and takes precedence — this only ever replaces values that are still
// ciphertext.
export async function register() {
  // Only the Node runtime has a filesystem to read .env from; the edge runtime
  // gets its env injected and has no dotenvx to run.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const encryptedKeys = Object.keys(process.env).filter((key) =>
    isEncrypted(process.env[key]),
  );
  if (encryptedKeys.length === 0) return;

  if (!process.env.DOTENV_PRIVATE_KEY) {
    console.error(
      `[env] Still encrypted at runtime and no DOTENV_PRIVATE_KEY to decrypt them: ${encryptedKeys.join(", ")}. ` +
        `Set DOTENV_PRIVATE_KEY, or set these variables' decrypted values, in the deployment environment.`,
    );
    return;
  }

  try {
    // Snapshot first: dotenvx can only overwrite process.env wholesale via
    // `overload`, and anything the deployment set directly is more current than
    // the committed .env. Restore those afterwards so only the ciphertext
    // values are actually replaced.
    const preexisting = new Map(
      Object.entries(process.env).filter(([, value]) => !isEncrypted(value)),
    );

    const { config } = await import("@dotenvx/dotenvx");
    config({ overload: true, quiet: true });

    for (const [key, value] of preexisting) {
      if (value !== undefined) process.env[key] = value;
    }

    const stillEncrypted = encryptedKeys.filter((key) => isEncrypted(process.env[key]));
    const decrypted = encryptedKeys.filter((key) => !isEncrypted(process.env[key]));

    if (decrypted.length > 0) {
      console.log(`[env] Decrypted at runtime: ${decrypted.join(", ")}`);
    }
    if (stillEncrypted.length > 0) {
      console.error(
        `[env] DOTENV_PRIVATE_KEY did not decrypt: ${stillEncrypted.join(", ")}. ` +
          `The key may be for a different .env, or these values were encrypted with a rotated key.`,
      );
    }
  } catch (error) {
    // Never let env repair take the site down — a stale map beats a 500 on
    // every route. The values stay as they were and the guards report them.
    console.error("[env] Runtime decryption failed:", error);
  }
}
