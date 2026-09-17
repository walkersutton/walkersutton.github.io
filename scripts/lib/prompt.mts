/**
 * Arrow-key prompts for the repo's scripts.
 *
 * Hand-rolled rather than pulled from npm: these scripts run with a Blob
 * read-write token in the environment, and a few dozen lines of ANSI is a
 * smaller thing to trust than a dependency tree. Covers what the scripts
 * actually ask for — a list to pick from, and a line of text.
 *
 * Every prompt needs a TTY. Callers check `isInteractive()` and fall back to
 * flags when there isn't one, so a piped or CI run never hangs waiting on a
 * keypress nobody is there to press.
 */
const CSI = "[";
const KEY = {
  up: `${CSI}A`,
  down: `${CSI}B`,
  enter: ["\r", "\n"],
  interrupt: "",
};

/**
 * A read is a stream of keys, not one key: a terminal coalesces keys pressed in
 * quick succession into a single chunk, and can equally split one escape
 * sequence across two. Comparing a whole chunk against `${CSI}B` misses both.
 *
 * Escape sequences are taken whole — parameter bytes up to a final byte in
 * `@`–`~` — and everything else is one character. Reading them as a unit is
 * also what keeps a bare `ESC` from being read out of the middle of an arrow
 * key, which is why cancelling is Ctrl-C only.
 */
function tokenize(chunk: string): string[] {
  const keys: string[] = [];
  for (let i = 0; i < chunk.length; ) {
    if (chunk[i] === "" && chunk[i + 1] === "[") {
      let end = i + 2;
      while (end < chunk.length && !/[@-~]/.test(chunk[end])) end += 1;
      keys.push(chunk.slice(i, end + 1));
      i = end + 1;
    } else {
      keys.push(chunk[i]);
      i += 1;
    }
  }
  return keys;
}

const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const wrap = (code: string) => (text: string) =>
  useColor ? `${CSI}${code}m${text}${CSI}0m` : text;

export const paint = {
  bold: wrap("1"),
  dim: wrap("2"),
  cyan: wrap("36"),
  green: wrap("32"),
  red: wrap("31"),
};

export function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function requireTTY(): void {
  if (!isInteractive()) throw new Error("prompts need a terminal");
}

/** Ctrl-C mid-prompt should leave the terminal as it was found. */
function abort(): never {
  process.stdout.write(`${CSI}?25h\n`);
  process.exit(130);
}

export interface Choice<T> {
  label: string;
  value: T;
  /** Shown dimmed after the label — the consequence of picking it. */
  hint?: string;
}

/**
 * A list navigated with the arrow keys (or j/k), chosen with enter. Redraws in
 * place, then collapses to a single line recording the answer, so a run of
 * prompts reads back as a transcript of the decisions rather than a screenful
 * of menus.
 */
export async function select<T>(
  message: string,
  choices: Choice<T>[],
  initial = 0,
): Promise<T> {
  requireTTY();
  if (choices.length === 0) {
    throw new Error(`select("${message}") needs at least one choice`);
  }

  let index = Math.min(Math.max(initial, 0), choices.length - 1);
  const height = choices.length + 1;

  const draw = (first: boolean) => {
    const lines = [
      `${paint.cyan("?")} ${paint.bold(message)}`,
      ...choices.map((choice, i) => {
        const active = i === index;
        const label = active ? paint.cyan(choice.label) : choice.label;
        const hint = choice.hint ? `  ${paint.dim(choice.hint)}` : "";
        return `${active ? paint.cyan("❯") : " "} ${label}${hint}`;
      }),
    ];
    process.stdout.write(
      (first ? "" : `${CSI}${height}A`) +
        lines.map((line) => `${CSI}2K${line}`).join("\n") +
        "\n",
    );
  };

  return new Promise<T>((resolve) => {
    const stdin = process.stdin;
    const wasRaw = Boolean(stdin.isRaw);

    const restore = () => {
      stdin.off("data", onKey);
      stdin.setRawMode(wasRaw);
      stdin.pause();
    };

    const onKey = (chunk: string) => {
      for (const key of tokenize(chunk)) {
        if (key === KEY.up || key === "k") {
          index = (index - 1 + choices.length) % choices.length;
          draw(false);
        } else if (key === KEY.down || key === "j") {
          index = (index + 1) % choices.length;
          draw(false);
        } else if (KEY.enter.includes(key)) {
          restore();
          // Collapse the whole menu into one line naming what was picked.
          process.stdout.write(
            `${CSI}${height}A${CSI}0J${paint.green("✔")} ${paint.bold(message)} ` +
              `${paint.dim("›")} ${choices[index].label}\n${CSI}?25h`,
          );
          resolve(choices[index].value);
          // Anything typed past the answer belongs to the next prompt.
          return;
        } else if (key === KEY.interrupt) {
          restore();
          abort();
        }
      }
    };

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    process.stdout.write(`${CSI}?25l`);
    draw(true);
    stdin.on("data", onKey);
  });
}

/**
 * One line of text. An empty answer takes `fallback`, so enter accepts the
 * suggestion shown in parentheses; `validate` returns a complaint to re-ask
 * with, or null to accept.
 */
export async function text(
  message: string,
  opts: { fallback?: string; validate?: (value: string) => string | null } = {},
): Promise<string> {
  requireTTY();
  const { createInterface } = await import("node:readline/promises");

  for (;;) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.on("SIGINT", () => {
      rl.close();
      abort();
    });

    const suffix = opts.fallback ? ` ${paint.dim(`(${opts.fallback})`)}` : "";
    const question = `${paint.cyan("?")} ${paint.bold(message)}${suffix} ${paint.dim("›")} `;

    let answer: string;
    try {
      answer = (await rl.question(question)).trim();
    } finally {
      rl.close();
      // readline leaves stdin flowing; the next select() sets it up again.
      process.stdin.pause();
    }

    const value = answer || opts.fallback || "";
    const complaint = opts.validate?.(value);
    if (complaint) {
      process.stdout.write(`  ${paint.red(complaint)}\n`);
      continue;
    }
    return value;
  }
}
