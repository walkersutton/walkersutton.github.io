import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start justify-center py-20 gap-4">
      <h2 className="text-2xl font-bold">Nope</h2>
      <Link href="/" className="underline hover:underline">
        Return Home
      </Link>
    </div>
  );
}
