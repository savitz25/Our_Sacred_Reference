import { VideoLibraryGrid } from "@/components/portal/VideoLibraryGrid";

export default function PortalLibraryPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-forest">
          Session library
        </h1>
        <p className="mt-2 text-ink-soft max-w-2xl">
          Your private embodied archive — filter by category, search by
          title or notes, and revisit past sessions with presence.
        </p>
      </div>
      <VideoLibraryGrid />
    </div>
  );
}
