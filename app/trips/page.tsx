import type { Metadata } from "next";
import PageContainer from "../components/PageContainer";
import PageHero from "../components/PageHero";
import TripMap from "./TripMap";

export const metadata: Metadata = {
  title: "Trips | Walker Sutton",
  description: "Backpacking trip location updates from Walker Sutton's Garmin inReach.",
};

export default function TripsPage() {
  return (
    <PageContainer>
      <PageHero eyebrow="Backpacking updates">Trips.</PageHero>
      <TripMap />
    </PageContainer>
  );
}
