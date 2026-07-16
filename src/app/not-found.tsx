import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-5 py-20 text-center bg-cream">
      <p className="text-sm font-medium tracking-[0.15em] uppercase text-teal mb-3">
        404
      </p>
      <h1 className="font-serif text-4xl sm:text-5xl text-forest mb-4">
        Page not found
      </h1>
      <p className="text-ink-soft max-w-md mb-8 leading-relaxed">
        This path does not exist or may have moved. Return home or book a free
        discovery session when you are ready.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button href="/" variant="primary">
          Home
        </Button>
        <Button href="/book-session" variant="gold">
          Book free session
        </Button>
        <Link
          href="/portal"
          className="inline-flex items-center justify-center text-sm text-teal hover:underline px-4 py-2"
        >
          Client portal
        </Link>
      </div>
    </div>
  );
}
