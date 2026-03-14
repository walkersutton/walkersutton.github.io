import { Metadata } from "next";
import BagContent from "./BagContent";
import { SITE_CONFIG } from "@/lib/config";

export const metadata: Metadata = {
  title: `Your Bag | ${SITE_CONFIG.title}`,
};

export default function BagPage() {
  return (
    <main className="min-h-[70vh]">
      <BagContent />
    </main>
  );
}
