export default function AdminLoading() {
  return (
    <div
      className="py-16 flex flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-9 w-9 rounded-full border-2 border-forest/20 border-t-gold animate-spin"
        aria-hidden
      />
      <p className="text-sm text-muted">Loading admin dashboard…</p>
    </div>
  );
}
