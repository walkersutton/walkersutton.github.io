/**
 * The boxed label that sits above a title and says what kind of page or
 * section it is ("Trip report", "Trip log", "Day 3"). Square with a hard
 * offset shadow, like the site's other boxes, so it reads at a glance instead
 * of disappearing the way a faint uppercase eyebrow did.
 */
export default function TitleTag({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`inline-flex items-center px-[8px] py-[3px] text-[13px] font-semibold leading-[1.2] ${className}`}
      style={{
        color: "var(--color-text)",
        border: "1px solid var(--color-text)",
        boxShadow: "2px 2px 0 0 var(--color-text)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
