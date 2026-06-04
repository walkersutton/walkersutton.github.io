import type { Metadata } from "next";
import TripMap from "./TripMap";
import TripsIndex from "./TripsIndex";

export const metadata: Metadata = {
  title: "Trips | Walker Sutton",
  description: "Backpacking trip location updates from Walker Sutton's Garmin inReach.",
};

export default function TripsPage() {
  if (Boolean(process.env.GARMIN_MAPSHARE_KML_URL)) {
    return <TripMap />;
  }
  return <TripsIndex />;
}
