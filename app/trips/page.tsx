import type { Metadata } from "next";
import { draftMode } from "next/headers";
import TripsIndex from "./TripsIndex";
import { buildTripEntries } from "@/lib/trips";

export const metadata: Metadata = {
  title: "Trips | Walker Sutton",
  description: "Backpacking trip location updates from Walker Sutton's Garmin inReach.",
};

export default async function TripsPage() {
  const { isEnabled: includeDrafts } = await draftMode();
  return <TripsIndex trips={buildTripEntries({ includeDrafts })} />;
}
