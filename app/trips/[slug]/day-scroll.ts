/**
 * Landing on a day's write-up, and staying there.
 *
 * Aiming once does not work on this page. The photos are lazy `<img>`s with no
 * reserved height (ProseImage renders `.img-wide`, which is `width: 100%;
 * height: auto`), so each one is a zero-height box until it loads, and it only
 * starts loading as the scroll brings it near the viewport. Every photo that
 * arrives between here and the target pushes the target further down. A single
 * `scrollIntoView` — or a native `#day-21` link — computes where the day was at
 * the moment of the click and stops there, which on a 26-day trip is thousands
 * of pixels short of where the day ends up.
 *
 * So the scroll re-aims every frame until the target holds still.
 *
 * It is also instant rather than smooth, for the same reason: a smooth scroll
 * fixes its destination when it begins and cannot be corrected mid-flight
 * without fighting its own animation. That costs little here — a day's write-up
 * is usually a whole page away, where an animated scroll is slow and flies past
 * everything between the two ends anyway.
 */

/** The events that mean the reader has taken over and we should stop re-aiming. */
const YIELD_TO = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

/** No layout change for this long and the page is done growing. */
const QUIET_MS = 500;

/** A ceiling, so a page that never stops changing can't pin the reader forever. */
const HARD_STOP_MS = 10_000;

/**
 * Scroll `target` to the top and keep it there while the page reflows beneath
 * it. Honours the element's `scroll-margin-top`, so the offset stays a CSS
 * concern and this does not need to know it.
 *
 * Re-aiming is driven by layout actually changing rather than by a frame loop.
 * A loop has to decide when to stop, and every rule for that is wrong here: the
 * target holds still for the first few frames after the scroll — the photos
 * have not arrived yet — so anything watching for stability quits before the
 * reflow it exists to correct even begins. A ResizeObserver on the body fires
 * when the page grows, which is precisely when the target needs re-aiming, and
 * it stays quiet the rest of the time.
 */
export function settleOn(target: Element): void {
  let quiet: ReturnType<typeof setTimeout> | undefined;
  let released = false;

  const release = () => {
    if (released) return;
    released = true;
    clearTimeout(quiet);
    clearTimeout(hardStop);
    observer.disconnect();
    for (const event of YIELD_TO) window.removeEventListener(event, release);
  };

  /**
   * Only photos *above* the target can move it. `complete` covers errored
   * requests too, so a photo that 404s can't hold this open.
   */
  const stillLoadingAbove = () =>
    [...document.images].some(
      (img) =>
        !img.complete &&
        (target.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_PRECEDING) !== 0,
    );

  const maybeRelease = () => {
    // Quiet is not the same as finished. A photo mid-flight when the page went
    // quiet will move the target the moment it lands, so wait for the ones that
    // can still do that rather than for the gaps between them.
    if (stillLoadingAbove()) {
      quiet = setTimeout(maybeRelease, QUIET_MS);
      return;
    }
    release();
  };

  const aim = () => {
    if (released) return;
    target.scrollIntoView({ behavior: "auto", block: "start" });
    clearTimeout(quiet);
    quiet = setTimeout(maybeRelease, QUIET_MS);
  };

  const observer = new ResizeObserver(aim);
  const hardStop = setTimeout(release, HARD_STOP_MS);

  // The reader scrolling away is not a failure to correct — it is them deciding
  // where to be, and holding them in place would feel broken.
  for (const event of YIELD_TO) {
    window.addEventListener(event, release, { passive: true });
  }

  // Observing fires once with the current size, which does the initial scroll.
  observer.observe(document.body);
}

/**
 * Take the reader to where a day is written up, and record it in the URL.
 *
 * `replaceState` rather than a `#` link or `pushState`: the position becomes
 * shareable, but clicking through a 26-day trip doesn't leave 26 entries for
 * the back button to walk out of.
 */
export function scrollToDay(anchor: string): void {
  const target = document.getElementById(anchor);
  if (!target) return;
  history.replaceState(null, "", `#${anchor}`);
  settleOn(target);
}

/**
 * Re-land a `#day-N` the page was opened on — a link someone shared from the
 * map. The browser's own anchor scroll runs before a single photo below the
 * fold has loaded, so it lands just as short as an un-corrected click would.
 */
export function settleOnHash(): void {
  if (!/^#day-\d+$/.test(location.hash)) return;
  const target = document.getElementById(location.hash.slice(1));
  if (target) settleOn(target);
}
