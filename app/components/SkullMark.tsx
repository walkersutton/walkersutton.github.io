/**
 * The skull from the favicon (app/icon.svg), drawn in the current text colour
 * instead of black-and-white so it works in either theme.
 *
 * The eyes are subpaths of the same path with fill-rule="evenodd", which makes
 * them holes rather than shapes painted in the background colour — so the mark
 * sits on any background without carrying an assumption about it.
 */
export default function SkullMark({ size = 76 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <g transform="matrix(.92 0 0 .92 18 11)">
        <path
          fillRule="evenodd"
          d="M50 6 C25 6 5 26 5 51 C5 68 14 82 27 89.5 L27 111 L35 111 L65 111 L73 111 L73 89.5 C86 82 95 68 95 51 C95 26 75 6 50 6Z
             M43 53 a10 10 0 1 0 -20 0 a10 10 0 1 0 20 0Z
             M77 53 a10 10 0 1 0 -20 0 a10 10 0 1 0 20 0Z"
        />
      </g>
    </svg>
  );
}
