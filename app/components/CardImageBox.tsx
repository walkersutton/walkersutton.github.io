export default function CardImageBox({
  children,
  style,
  className,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={`card-image-box${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </div>
  );
}
