import { redirect } from "next/navigation";

/**
 * Convenience route used by emails: /portal/session/[id]/early
 * Always resolves through the main session page, which shows the
 * countdown wait UI when appropriate (never leaves Sacred Reference).
 */
export default async function SessionEarlyRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/portal/session/${id}`);
}
