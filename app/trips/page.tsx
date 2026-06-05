import type { Metadata } from "next";
import TripsIndex from "./TripsIndex";
import { buildTripEntries } from "@/lib/trips";
import { getLiveEnabled } from "@/lib/live-state";

export const metadata: Metadata = {
  title: "Trips | Walker Sutton",
  description: "Backpacking trip location updates from Walker Sutton's Garmin inReach.",
};

export default async function TripsPage() {
  const isLive = await getLiveEnabled();
  return <TripsIndex trips={buildTripEntries()} isLive={isLive} />;
}
