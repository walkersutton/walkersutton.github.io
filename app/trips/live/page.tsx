import { redirect } from "next/navigation";
import TripMap from "../TripMap";
import { buildTripEntries } from "@/lib/trips";

export default function TripLivePage() {
  if (!process.env.GARMIN_MAPSHARE_KML_URL) redirect("/trips");
  return <TripMap trips={buildTripEntries()} />;
}
