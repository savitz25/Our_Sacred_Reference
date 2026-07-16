export default function PortalLoading() {
  return (
    <div
      className="py-16 flex flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-9 w-9 rounded-full border-2 border-forest/20 border-t-teal animate-spin"
        aria-hidden
      />
      <p className="text-sm text-muted">Opening your portal…</p>
    </div>
  );
}
