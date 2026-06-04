import React from "react";

export default function PageHero({
  eyebrow,
  children,
}: {
  eyebrow?: React.ReactNode;
  children: React.ReactNode;
}) {
  // return (
  //   <section className="pt-14 pb-4 max-w-[800px]">
  //     {eyebrow && (
  //       <div
  //         className="text-[13.5px] font-medium mb-6"
  //         style={{ color: "var(--color-text-variant)" }}
  //       >
  //         {eyebrow}
  //       </div>
  //     )}
  //     <h1
  //       className="text-[clamp(28px,4.4vw,47px)] font-semibold leading-[1.16] tracking-[-0.025em] m-0"
  //       style={{ color: "var(--color-text)", textWrap: "balance" } as React.CSSProperties}
  //     >
  //       {children}
  //     </h1>
  //   </section>
  // );
}
