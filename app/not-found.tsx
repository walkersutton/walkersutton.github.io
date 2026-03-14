import Link from "next/link";
import Container from "./components/Container";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-start justify-center py-20 gap-4">
      <h2 className="text-2xl font-bold">Nope</h2>
      <Link href="/" className="underline hover:underline">
        Return Home
      </Link>
    </Container>
  );
}
