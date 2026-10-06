"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { browserSupportsWebAuthn, startAuthentication } from "@simplewebauthn/browser";
import SkullLogo from "../components/SkullLogo";
import { finishPasskeySignIn, login, startPasskeySignIn } from "./actions";

const initial = { error: undefined as string | undefined };

// A short, decaying side-to-side shake: the "no" a Mac login gives.
const SHAKE: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-8px)" },
  { transform: "translateX(7px)" },
  { transform: "translateX(-5px)" },
  { transform: "translateX(3px)" },
  { transform: "translateX(0)" },
];

function shake(element: HTMLElement | null) {
  if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  element.animate(SHAKE, { duration: 360, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
}

/**
 * Passkey first. The password field only appears where it's allowed: before
 * the first passkey exists, in local development, or with the emergency
 * switch on. With neither available — a preview deployment, say — it points
 * at the address that works.
 */
export default function LoginForm({
  passkey,
  password: passwordAllowed,
  siteHost,
}: {
  passkey: boolean;
  password: boolean;
  siteHost: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(login, initial);
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const passkeyRef = useRef<HTMLButtonElement>(null);

  // A wrong password clears the field and puts the cursor back in it, ready
  // for another go. Every failed attempt is a new state object, so a second
  // identical "Wrong password." still shakes.
  useEffect(() => {
    if (!state?.error) return;
    setPassword("");
    setShowError(true);
    setPasskeyError(null);
    inputRef.current?.focus();
    shake(boxRef.current);
  }, [state]);

  async function signInWithPasskey() {
    if (!browserSupportsWebAuthn()) {
      setPasskeyError("This browser doesn't support passkeys.");
      return;
    }
    setPasskeyBusy(true);
    setPasskeyError(null);
    setShowError(false);
    try {
      const start = await startPasskeySignIn();
      if (!start.ok) throw new Error(start.error);
      const response = await startAuthentication({ optionsJSON: start.options });
      const done = await finishPasskeySignIn(response);
      if (!done.ok) throw new Error(done.error);
      // The session cookie is set; re-render the layout, which now lets us in.
      router.refresh();
    } catch (error) {
      const { name, message } = error as Error;
      // Closing the Face ID / Touch ID sheet is a change of mind, not a failure.
      if (name === "NotAllowedError" || name === "AbortError") return;
      setPasskeyError(message || "Couldn't sign in with a passkey.");
      shake(passkeyRef.current);
    } finally {
      setPasskeyBusy(false);
    }
  }

  const readCapsLock = (event: React.KeyboardEvent<HTMLInputElement>) =>
    setCapsLock(event.getModifierState("CapsLock"));

  const message =
    passkeyError ?? (showError ? state?.error : capsLock ? "Caps Lock is on" : "");

  return (
    <div className="adm-login-form">
      <SkullLogo href="/" width={40} label={`Back to ${siteHost}`} className="adm-login-mark adm-rise" />
      <h1 className="adm-login-title adm-rise">Admin</h1>

      {passkey && (
        <div className="adm-login-field adm-rise">
          <button
            ref={passkeyRef}
            type="button"
            className="adm-login-passkey"
            onClick={signInWithPasskey}
            disabled={passkeyBusy}
            autoFocus={!passwordAllowed}
          >
            {passkeyBusy ? (
              <span className="adm-spinner" aria-hidden />
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="8" cy="15" r="4" />
                <path d="M10.8 12.2 19 4M16 7l2.5 2.5M13.5 9.5 16 12" />
              </svg>
            )}
            Sign in with passkey
          </button>
        </div>
      )}

      {passkey && passwordAllowed && (
        <div className="adm-login-or adm-rise" aria-hidden>
          or
        </div>
      )}

      {passwordAllowed && (
        <form action={action} className="adm-login-field adm-rise" style={passkey ? { marginTop: 0 } : undefined}>
          {/* Password managers file a login under a username; without one they
              save it badly or not at all. Never shown, and the server ignores it. */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value="admin"
            readOnly
            tabIndex={-1}
            aria-hidden
            className="adm-visually-hidden"
          />
          <div ref={boxRef} className="adm-login-box">
            <input
              ref={inputRef}
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              aria-label="Password"
              aria-invalid={showError || undefined}
              aria-describedby="adm-login-msg"
              required
              autoFocus={!passkey}
              value={password}
              readOnly={pending}
              onChange={(event) => {
                setPassword(event.target.value);
                setShowError(false);
                setPasskeyError(null);
              }}
              onKeyDown={readCapsLock}
              onKeyUp={readCapsLock}
              onBlur={() => setCapsLock(false)}
              className="adm-login-input"
            />
            <button
              type="submit"
              className="adm-login-go"
              disabled={pending || !password}
              data-pending={pending || undefined}
              aria-label="Sign in"
            >
              {pending ? (
                <span className="adm-spinner" aria-hidden />
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
          </div>
        </form>
      )}

      {!passkey && !passwordAllowed && (
        <p className="adm-login-note adm-rise">
          Sign in at{" "}
          <a href={`https://${siteHost}/admin`}>{siteHost}/admin</a>
          {" "}— passkeys only work there.
        </p>
      )}

      {/* Space is held for the message whether or not there is one, so an
          error appearing doesn't shove the form around. */}
      <p
        id="adm-login-msg"
        className="adm-login-msg"
        data-tone={passkeyError || showError ? "error" : undefined}
        aria-live="assertive"
      >
        {message}
      </p>
    </div>
  );
}
