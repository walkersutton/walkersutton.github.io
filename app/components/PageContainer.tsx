import React from "react";

export default function PageContainer({
  children,
  as: Tag = "main",
}: {
  children: React.ReactNode;
  as?: "main" | "div";
}) {
  return (
    <Tag className="w-full max-w-[1080px] mx-auto pb-2">
      {children}
    </Tag>
  );
}
