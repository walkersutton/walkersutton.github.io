import Link from "next/link";
import Container from "./components/Container";
import TrackEvent from "./components/TrackEvent";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-start justify-center py-20 gap-4">
      {/* Shows up as a "404" goal in the stats, with the broken URL as its
          page — the inbound links worth fixing or redirecting. */}
      <TrackEvent name="404" />
      <h2 className="text-2xl font-bold">Nope</h2>
      <Link href="/" className="underline hover:underline">
        Return Home
      </Link>
    </Container>
  );
}
