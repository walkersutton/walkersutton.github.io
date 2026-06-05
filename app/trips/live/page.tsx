import { redirect } from "next/navigation";
import TripMap from "../TripMap";
import { buildTripEntries } from "@/lib/trips";
import { getLiveEnabled, getActiveTripName } from "@/lib/live-state";

export default async function TripLivePage() {
  if (!process.env.GARMIN_MAPSHARE_KML_URL) redirect("/trips");
  const [isOnTrip, activeTripName] = await Promise.all([getLiveEnabled(), getActiveTripName()]);
  return <TripMap trips={buildTripEntries()} isOnTrip={isOnTrip} activeTripName={activeTripName} />;
}
