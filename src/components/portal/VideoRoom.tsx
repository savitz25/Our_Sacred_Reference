"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  PhoneOff,
  Circle,
  Loader2,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { endSessionAndQueueProcessing } from "@/app/actions/sessions";
import type { Room } from "livekit-client";

interface VideoRoomProps {
  sessionId: string;
  sessionTitle: string;
  isPractitioner: boolean;
  clientName?: string;
}

type TokenResponse = {
  configured: boolean;
  token?: string;
  url?: string;
  roomName?: string;
  name?: string;
  isPractitioner?: boolean;
  message?: string;
  error?: string;
};

export function VideoRoom({
  sessionId,
  sessionTitle,
  isPractitioner,
}: VideoRoomProps) {
  const router = useRouter();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [ended, setEnded] = useState(false);
  const [ending, setEnding] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [livekitReady, setLivekitReady] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Connecting…");
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activeRoom: Room | null = null;
    let cancelled = false;

    async function connect() {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = (await res.json()) as TokenResponse;

        if (!res.ok) {
          setError(data.error || "Failed to join room");
          setConnecting(false);
          return;
        }

        if (!data.configured || !data.token || !data.url) {
          setDemoMode(true);
          setStatusMsg(
            data.message ||
              "Demo mode — add LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL for live video."
          );
          setConnecting(false);
          return;
        }

        const { Room: LiveKitRoom, RoomEvent, Track } = await import(
          "livekit-client"
        );
        const r = new LiveKitRoom({
          adaptiveStream: true,
          dynacast: true,
        });
        activeRoom = r;

        r.on(RoomEvent.Connected, () => {
          if (!cancelled) {
            setLivekitReady(true);
            setConnecting(false);
            setStatusMsg("Connected");
          }
        });

        await r.connect(data.url, data.token);
        await r.localParticipant.setCameraEnabled(true);
        await r.localParticipant.setMicrophoneEnabled(true);

        // Attach remote videos
        r.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
          if (track.kind === Track.Kind.Video) {
            const el = track.attach();
            el.id = `remote-${participant.identity}`;
            el.className = "h-full w-full object-cover";
            const container = document.getElementById("remote-video");
            if (container) {
              container.innerHTML = "";
              container.appendChild(el);
            }
          }
        });

        if (!cancelled) setRoom(r);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setDemoMode(true);
          setStatusMsg("Could not connect to LiveKit — running demo room UI.");
          setConnecting(false);
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
      activeRoom?.disconnect();
    };
  }, [sessionId]);

  const toggleMic = useCallback(async () => {
    const next = !micOn;
    setMicOn(next);
    if (room) await room.localParticipant.setMicrophoneEnabled(next);
  }, [micOn, room]);

  const toggleCam = useCallback(async () => {
    const next = !camOn;
    setCamOn(next);
    if (room) await room.localParticipant.setCameraEnabled(next);
  }, [camOn, room]);

  async function handleLeave() {
    setEnding(true);
    try {
      room?.disconnect();
      await endSessionAndQueueProcessing(sessionId);
      setEnded(true);
    } catch {
      setEnded(true);
    } finally {
      setEnding(false);
    }
  }

  if (ended) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-lg text-center rounded-2xl border border-border bg-white p-8 sm:p-10 shadow-elevated">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal">
            <Circle className="h-8 w-8" aria-hidden />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-forest mb-3">
            Session complete
          </h2>
          <p className="text-ink-soft leading-relaxed mb-2">
            Your video is being automatically processed, categorized, and added
            to your private library.
          </p>
          <p className="text-sm text-muted mb-8">
            Post-session pipeline queued (storage path + metadata). Connect
            LiveKit egress and FFmpeg worker for full media processing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button href="/portal/session-complete" variant="gold">
              View processing status
            </Button>
            <Button href="/portal/library" variant="outline">
              Session library
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-forest-deep text-cream">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-cream/10">
        <div>
          <p className="text-sm font-medium">{sessionTitle}</p>
          <p className="text-xs text-cream/50 flex items-center gap-2">
            <Shield className="h-3 w-3" aria-hidden />
            Encrypted ·{" "}
            {demoMode
              ? "Demo mode"
              : livekitReady
                ? "LiveKit connected"
                : "Connecting"}
            {isPractitioner && " · Practitioner"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {recording && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-200">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              Recording
            </span>
          )}
          <button
            type="button"
            onClick={() => router.push("/portal")}
            className="text-xs text-cream/50 hover:text-cream hidden sm:inline"
          >
            Exit to portal
          </button>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 relative p-3 sm:p-4">
          <div
            id="remote-video"
            className="h-full rounded-2xl overflow-hidden bg-gradient-to-br from-forest to-teal-muted relative flex items-center justify-center"
          >
            {connecting && (
              <div className="relative z-10 text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" />
                <p className="text-sm text-cream/80">{statusMsg}</p>
              </div>
            )}
            {!connecting && (demoMode || !livekitReady) && (
              <div className="relative text-center z-10 px-6">
                <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-cream/15 border border-cream/20 text-3xl font-serif">
                  M
                </div>
                <p className="font-medium">Session room</p>
                <p className="text-xs text-cream/60 mt-2 max-w-sm mx-auto">
                  {statusMsg}
                </p>
              </div>
            )}
            {error && (
              <p className="absolute bottom-4 left-4 right-4 text-sm text-red-200">
                {error}
              </p>
            )}
          </div>

          <div className="absolute bottom-6 right-6 w-36 sm:w-48 aspect-video rounded-xl overflow-hidden border-2 border-cream/20 bg-forest shadow-elevated">
            {camOn ? (
              <div className="h-full w-full flex items-center justify-center bg-forest-light">
                <span className="text-2xl font-serif text-cream/80">You</span>
              </div>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-forest-deep">
                <VideoOff className="h-6 w-6 text-cream/40" />
              </div>
            )}
          </div>
        </div>

        {chatOpen && (
          <aside className="w-72 sm:w-80 border-l border-cream/10 bg-forest flex flex-col">
            <div className="px-4 py-3 border-b border-cream/10 text-sm font-medium">
              Session chat
            </div>
            <div className="flex-1 p-4 text-sm text-cream/50">
              In-room chat via LiveKit data messages can be wired next.
            </div>
            <div className="p-3 border-t border-cream/10">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full rounded-full bg-cream/10 border border-cream/15 px-4 py-2 text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:ring-1 focus:ring-teal"
                aria-label="Chat message"
              />
            </div>
          </aside>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-3 px-4 py-4 border-t border-cream/10 bg-forest-deep/90">
        <ControlBtn
          active={micOn}
          onClick={toggleMic}
          label={micOn ? "Mute" : "Unmute"}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </ControlBtn>
        <ControlBtn
          active={camOn}
          onClick={toggleCam}
          label={camOn ? "Camera off" : "Camera on"}
        >
          {camOn ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </ControlBtn>
        <ControlBtn active={false} onClick={() => {}} label="Share screen">
          <MonitorUp className="h-5 w-5" />
        </ControlBtn>
        <ControlBtn
          active={chatOpen}
          onClick={() => setChatOpen((v) => !v)}
          label="Chat"
        >
          <MessageSquare className="h-5 w-5" />
        </ControlBtn>
        {isPractitioner && (
          <ControlBtn
            active={recording}
            onClick={() => setRecording((v) => !v)}
            label="Toggle recording"
            className="hidden sm:flex"
          >
            <Circle
              className={cn("h-5 w-5", recording && "text-red-400")}
            />
          </ControlBtn>
        )}
        <button
          type="button"
          onClick={handleLeave}
          disabled={ending}
          className="ml-2 sm:ml-4 flex h-12 w-12 sm:w-auto sm:px-5 items-center justify-center gap-2 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-60"
          aria-label="Leave session"
        >
          {ending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <PhoneOff className="h-5 w-5" />
          )}
          <span className="hidden sm:inline text-sm font-medium">Leave</span>
        </button>
      </div>
    </div>
  );
}

function ControlBtn({
  children,
  active,
  onClick,
  label,
  className,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
        active
          ? "bg-cream/15 text-cream hover:bg-cream/25"
          : "bg-cream/5 text-cream/60 hover:bg-cream/15 hover:text-cream",
        className
      )}
    >
      {children}
    </button>
  );
}
