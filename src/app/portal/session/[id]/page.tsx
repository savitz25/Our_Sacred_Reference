import { VideoRoomMock } from "@/components/portal/VideoRoomMock";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <VideoRoomMock
      sessionTitle={
        id.startsWith("sess-upcoming")
          ? "Live session with Michele"
          : "Session replay & room mock"
      }
    />
  );
}
