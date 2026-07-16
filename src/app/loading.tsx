export default function RootLoading() {
  return (
    <div
      className="min-h-[40vh] flex items-center justify-center bg-cream"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 rounded-full border-2 border-forest/20 border-t-forest animate-spin"
          aria-hidden
        />
        <p className="text-sm text-muted">Loading…</p>
      </div>
    </div>
  );
}
