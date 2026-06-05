import type { Metadata } from "next";
import TripsIndex from "./TripsIndex";
import { buildTripEntries } from "@/lib/trips";

export const metadata: Metadata = {
  title: "Trips | Walker Sutton",
  description: "Backpacking trip location updates from Walker Sutton's Garmin inReach.",
};

export default function TripsPage() {
  return <TripsIndex trips={buildTripEntries()} />;
}
