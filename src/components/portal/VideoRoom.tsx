"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  MessageSquare,
  PhoneOff,
  Circle,
  Loader2,
  Shield,
  Settings,
  Sparkles,
  X,
  Image as ImageIcon,
  Aperture,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { endSessionAndQueueProcessing } from "@/app/actions/sessions";
import type {
  LocalVideoTrack,
  Room,
  TrackProcessor,
} from "livekit-client";

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

type BgMode = "none" | "blur" | "forest" | "soft-light" | "mist";

type MediaDeviceOption = { deviceId: string; label: string };

/** Curated serene virtual backgrounds (Unsplash, forest/gold aesthetic) */
const VIRTUAL_BACKGROUNDS: {
  id: Exclude<BgMode, "none" | "blur">;
  label: string;
  url: string;
}[] = [
  {
    id: "forest",
    label: "Forest canopy",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&q=80",
  },
  {
    id: "soft-light",
    label: "Soft light",
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1280&q=80",
  },
  {
    id: "mist",
    label: "Morning mist",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&q=80",
  },
];

export function VideoRoom({
  sessionId,
  sessionTitle,
  isPractitioner,
}: VideoRoomProps) {
  const router = useRouter();
  const localVideoRef = useRef<HTMLDivElement>(null);
  const processorRef = useRef<TrackProcessor<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  > | null>(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [effectsOpen, setEffectsOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingBusy, setRecordingBusy] = useState(false);
  const [ended, setEnded] = useState(false);
  const [ending, setEnding] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [livekitReady, setLivekitReady] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Connecting…");
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bgMode, setBgMode] = useState<BgMode>("none");
  const [bgBusy, setBgBusy] = useState(false);
  const [bgSupported, setBgSupported] = useState(true);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceOption[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceOption[]>([]);
  const [selectedMicId, setSelectedMicId] = useState("");
  const [selectedCamId, setSelectedCamId] = useState("");
  const [participantCount, setParticipantCount] = useState(1);

  const attachLocalVideo = useCallback((r: Room) => {
    void (async () => {
      const { Track } = await import("livekit-client");
      const camPub = r.localParticipant.getTrackPublication(Track.Source.Camera);
      const track = camPub?.track;
      const elHost = localVideoRef.current;
      if (!elHost || !track) return;
      elHost.innerHTML = "";
      const el = track.attach() as HTMLVideoElement;
      el.className = "h-full w-full object-cover -scale-x-100";
      el.muted = true;
      el.playsInline = true;
      elHost.appendChild(el);
    })();
  }, []);

  const refreshDevices = useCallback(async (r?: Room | null) => {
    try {
      const { Room: LKRoom } = await import("livekit-client");
      const audio = await LKRoom.getLocalDevices("audioinput");
      const video = await LKRoom.getLocalDevices("videoinput");
      setAudioDevices(
        audio.map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${i + 1}`,
        }))
      );
      setVideoDevices(
        video.map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }))
      );

      if (r) {
        const micId = r.getActiveDevice("audioinput");
        const camId = r.getActiveDevice("videoinput");
        if (micId) setSelectedMicId(micId);
        if (camId) setSelectedCamId(camId);
      }
    } catch {
      /* permissions may not be granted yet */
    }
  }, []);

  const startEgress = useCallback(async () => {
    setRecordingBusy(true);
    try {
      const res = await fetch("/api/livekit/recording/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.started) {
        setRecording(true);
        setStatusMsg("Recording via LiveKit Egress…");
      } else if (data.demo) {
        setRecording(false);
        setStatusMsg(data.reason || "Demo mode — egress not started");
      } else if (data.reason) {
        setStatusMsg(data.reason);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRecordingBusy(false);
    }
  }, [sessionId]);

  const stopEgress = useCallback(async () => {
    setRecordingBusy(true);
    try {
      await fetch("/api/livekit/recording/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      setRecording(false);
    } catch (e) {
      console.error(e);
    } finally {
      setRecordingBusy(false);
    }
  }, [sessionId]);

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
          // Still enumerate devices for settings UI in demo
          void refreshDevices(null);
          return;
        }

        const { Room: LiveKitRoom, RoomEvent, Track } = await import(
          "livekit-client"
        );

        try {
          const { supportsBackgroundProcessors } = await import(
            "@livekit/track-processors"
          );
          if (!cancelled) {
            setBgSupported(supportsBackgroundProcessors());
          }
        } catch {
          if (!cancelled) setBgSupported(false);
        }

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
            setParticipantCount(r.remoteParticipants.size + 1);
            void startEgress();
            void refreshDevices(r);
          }
        });

        r.on(RoomEvent.ParticipantConnected, () => {
          setParticipantCount(r.remoteParticipants.size + 1);
        });
        r.on(RoomEvent.ParticipantDisconnected, () => {
          setParticipantCount(r.remoteParticipants.size + 1);
        });

        r.on(RoomEvent.LocalTrackPublished, (pub) => {
          if (pub.source === Track.Source.Camera) {
            attachLocalVideo(r);
          }
        });

        r.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
          if (track.kind === Track.Kind.Video) {
            const el = track.attach();
            el.id = `remote-${participant.identity}-${track.sid}`;
            el.className = "h-full w-full object-cover";
            const container = document.getElementById("remote-video");
            if (container) {
              // Prefer screen share as main stage
              if (
                _pub.source === Track.Source.ScreenShare ||
                container.querySelector("video") === null
              ) {
                if (_pub.source === Track.Source.ScreenShare) {
                  container.innerHTML = "";
                }
                // Only replace camera if no screen share present
                const hasScreen = container.querySelector(
                  '[data-source="screenshare"]'
                );
                if (_pub.source === Track.Source.ScreenShare) {
                  el.dataset.source = "screenshare";
                  container.innerHTML = "";
                  container.appendChild(el);
                } else if (!hasScreen) {
                  el.dataset.source = "camera";
                  container.innerHTML = "";
                  container.appendChild(el);
                }
              }
            }
          }
        });

        r.on(RoomEvent.TrackUnsubscribed, (track) => {
          track.detach().forEach((el) => el.remove());
        });

        await r.connect(data.url, data.token);
        await r.localParticipant.setCameraEnabled(true);
        await r.localParticipant.setMicrophoneEnabled(true);
        attachLocalVideo(r);

        // Install background processor in disabled mode for smooth switching
        try {
          const { BackgroundProcessor, supportsBackgroundProcessors } =
            await import("@livekit/track-processors");
          if (supportsBackgroundProcessors()) {
            const camPub = r.localParticipant.getTrackPublication(
              Track.Source.Camera
            );
            const camTrack = camPub?.track as LocalVideoTrack | undefined;
            if (camTrack) {
              const processor = BackgroundProcessor({ mode: "disabled" });
              await camTrack.setProcessor(processor);
              processorRef.current = processor as unknown as TrackProcessor<
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                any
              >;
            }
          }
        } catch (e) {
          console.warn("Background processors unavailable", e);
          if (!cancelled) setBgSupported(false);
        }

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
      const proc = processorRef.current;
      processorRef.current = null;
      void (async () => {
        try {
          if (activeRoom) {
            const { Track } = await import("livekit-client");
            const camPub = activeRoom.localParticipant.getTrackPublication(
              Track.Source.Camera
            );
            const t = camPub?.track as LocalVideoTrack | undefined;
            if (t && proc) await t.stopProcessor();
          }
        } catch {
          /* ignore */
        }
        activeRoom?.disconnect();
      })();
    };
  }, [sessionId, startEgress, attachLocalVideo, refreshDevices]);

  const getCameraTrack = useCallback(async (): Promise<LocalVideoTrack | null> => {
    if (!room) return null;
    const { Track } = await import("livekit-client");
    const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
    return (pub?.track as LocalVideoTrack | undefined) ?? null;
  }, [room]);

  const applyBackground = useCallback(
    async (mode: BgMode) => {
      setBgBusy(true);
      setBgMode(mode);
      try {
        if (demoMode || !room) {
          setBgBusy(false);
          return;
        }

        const track = await getCameraTrack();
        if (!track) {
          setBgBusy(false);
          return;
        }

        type BgProcessor = {
          switchTo: (opts:
            | { mode: "disabled" }
            | { mode: "background-blur"; blurRadius?: number }
            | { mode: "virtual-background"; imagePath: string }
          ) => Promise<void>;
        };

        let processor = processorRef.current as unknown as BgProcessor | null;

        if (!processor) {
          const { BackgroundProcessor, supportsBackgroundProcessors } =
            await import("@livekit/track-processors");
          if (!supportsBackgroundProcessors()) {
            setBgSupported(false);
            setBgBusy(false);
            return;
          }
          const p = BackgroundProcessor({ mode: "disabled" });
          await track.setProcessor(p);
          processorRef.current = p as unknown as TrackProcessor<
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
          >;
          processor = p as unknown as BgProcessor;
        }

        if (mode === "none") {
          await processor!.switchTo({ mode: "disabled" });
        } else if (mode === "blur") {
          await processor!.switchTo({
            mode: "background-blur",
            blurRadius: 20,
          });
        } else {
          const bg = VIRTUAL_BACKGROUNDS.find((b) => b.id === mode);
          if (bg) {
            await processor!.switchTo({
              mode: "virtual-background",
              imagePath: bg.url,
            });
          }
        }
      } catch (e) {
        console.error("Background effect failed", e);
        setStatusMsg("Background effect unavailable in this browser.");
        setBgSupported(false);
      } finally {
        setBgBusy(false);
      }
    },
    [demoMode, room, getCameraTrack]
  );

  const toggleMic = useCallback(async () => {
    const next = !micOn;
    setMicOn(next);
    if (room) await room.localParticipant.setMicrophoneEnabled(next);
  }, [micOn, room]);

  const toggleCam = useCallback(async () => {
    const next = !camOn;
    setCamOn(next);
    if (room) {
      await room.localParticipant.setCameraEnabled(next);
      if (next) {
        // Re-attach after re-enable
        setTimeout(() => attachLocalVideo(room), 200);
        // Re-apply bg if needed
        if (bgMode !== "none") {
          setTimeout(() => void applyBackground(bgMode), 400);
        }
      }
    }
  }, [camOn, room, attachLocalVideo, bgMode, applyBackground]);

  const toggleScreenShare = useCallback(async () => {
    if (!room || demoMode) {
      setScreenSharing((v) => !v);
      return;
    }
    try {
      const next = !screenSharing;
      await room.localParticipant.setScreenShareEnabled(next);
      setScreenSharing(next);
      setStatusMsg(next ? "Sharing your screen" : "Screen share stopped");
    } catch (e) {
      console.error(e);
      setStatusMsg("Screen share was cancelled or is not available.");
      setScreenSharing(false);
    }
  }, [room, demoMode, screenSharing]);

  const switchDevice = useCallback(
    async (kind: "audioinput" | "videoinput", deviceId: string) => {
      if (!deviceId) return;
      if (kind === "audioinput") setSelectedMicId(deviceId);
      else setSelectedCamId(deviceId);

      if (!room || demoMode) return;
      try {
        await room.switchActiveDevice(kind, deviceId);
        if (kind === "videoinput") {
          setTimeout(() => attachLocalVideo(room), 200);
          if (bgMode !== "none") {
            setTimeout(() => void applyBackground(bgMode), 400);
          }
        }
      } catch (e) {
        console.error(e);
        setStatusMsg("Could not switch device.");
      }
    },
    [room, demoMode, attachLocalVideo, bgMode, applyBackground]
  );

  async function handleRecordToggle() {
    if (recordingBusy || demoMode) return;
    if (recording) {
      await stopEgress();
    } else {
      await startEgress();
    }
  }

  async function handleLeave() {
    setEnding(true);
    try {
      if (recording && !demoMode) {
        await stopEgress();
      }
      try {
        const track = await getCameraTrack();
        if (track && processorRef.current) {
          await track.stopProcessor();
        }
      } catch {
        /* ignore */
      }
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
            Your video is being processed via LiveKit Egress, uploaded to your
            private library, and (when FFmpeg is available) trimmed and
            normalized.
          </p>
          <p className="text-sm text-muted mb-8">
            You&apos;ll receive an email when the recording is ready (when
            Resend is configured).
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-cream/10 bg-forest-deep/95 backdrop-blur-sm">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{sessionTitle}</p>
          <p className="text-xs text-cream/50 flex items-center gap-2">
            <Shield className="h-3 w-3 shrink-0" aria-hidden />
            Encrypted ·{" "}
            {demoMode
              ? "Demo mode"
              : livekitReady
                ? "LiveKit connected"
                : "Connecting"}
            {isPractitioner && " · Practitioner"}
            {livekitReady && ` · ${participantCount} present`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {recording && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-200">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              Recording
            </span>
          )}
          <button
            type="button"
            onClick={() => router.push("/portal")}
            className="text-xs text-cream/50 hover:text-cream hidden sm:inline transition-colors"
          >
            Exit to portal
          </button>
        </div>
      </div>

      {/* Stage */}
      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 relative p-3 sm:p-4">
          <div
            id="remote-video"
            className="h-full rounded-2xl overflow-hidden bg-gradient-to-br from-forest to-teal-muted relative flex items-center justify-center"
          >
            {connecting && (
              <div className="relative z-10 text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-gold-soft" />
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

          {/* Self-view PIP */}
          <div className="absolute bottom-6 right-6 w-36 sm:w-52 aspect-video rounded-xl overflow-hidden border-2 border-cream/20 bg-forest shadow-elevated">
            {camOn ? (
              <div
                ref={localVideoRef}
                className="h-full w-full bg-forest-light relative"
              >
                {/* Fallback label until track attaches */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-serif text-cream/50">You</span>
                </div>
              </div>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-forest-deep">
                <VideoOff className="h-6 w-6 text-cream/40" />
              </div>
            )}
            {bgMode !== "none" && camOn && (
              <span className="absolute top-1.5 left-1.5 rounded-full bg-forest-deep/70 px-2 py-0.5 text-[10px] text-gold-soft backdrop-blur-sm">
                {bgMode === "blur" ? "Blur" : "Background"}
              </span>
            )}
          </div>
        </div>

        {/* Effects panel */}
        {effectsOpen && (
          <aside className="w-72 sm:w-80 border-l border-cream/10 bg-forest flex flex-col absolute sm:relative inset-y-0 right-0 z-20 shadow-elevated sm:shadow-none">
            <div className="flex items-center justify-between px-4 py-3 border-b border-cream/10">
              <span className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold-soft" />
                Background effects
              </span>
              <button
                type="button"
                onClick={() => setEffectsOpen(false)}
                className="rounded-full p-1.5 hover:bg-cream/10"
                aria-label="Close effects"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!bgSupported && (
                <p className="text-xs text-cream/60 leading-relaxed">
                  Background processors aren&apos;t supported in this browser.
                  Try Chrome or Edge for blur and virtual backgrounds.
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <EffectCard
                  active={bgMode === "none"}
                  label="None"
                  onClick={() => void applyBackground("none")}
                  disabled={bgBusy}
                >
                  <Aperture className="h-6 w-6 text-cream/70" />
                </EffectCard>
                <EffectCard
                  active={bgMode === "blur"}
                  label="Blur"
                  onClick={() => void applyBackground("blur")}
                  disabled={bgBusy || !bgSupported}
                >
                  <div className="h-10 w-full rounded-lg bg-cream/20 backdrop-blur-md" />
                </EffectCard>
                {VIRTUAL_BACKGROUNDS.map((bg) => (
                  <EffectCard
                    key={bg.id}
                    active={bgMode === bg.id}
                    label={bg.label}
                    onClick={() => void applyBackground(bg.id)}
                    disabled={bgBusy || !bgSupported}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bg.url}
                      alt=""
                      className="h-12 w-full object-cover rounded-lg"
                    />
                  </EffectCard>
                ))}
              </div>
              {bgBusy && (
                <p className="text-xs text-gold-soft flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Applying effect…
                </p>
              )}
              <p className="text-[11px] text-cream/45 leading-relaxed">
                Effects use LiveKit track processors. They run on your device and
                are applied before video is sent.
              </p>
            </div>
          </aside>
        )}

        {/* Settings panel */}
        {settingsOpen && (
          <aside className="w-72 sm:w-80 border-l border-cream/10 bg-forest flex flex-col absolute sm:relative inset-y-0 right-0 z-20 shadow-elevated sm:shadow-none">
            <div className="flex items-center justify-between px-4 py-3 border-b border-cream/10">
              <span className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4 text-gold-soft" />
                Settings
              </span>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-full p-1.5 hover:bg-cream/10"
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div>
                <label
                  htmlFor="mic-select"
                  className="block text-xs uppercase tracking-wider text-cream/50 mb-2"
                >
                  Microphone
                </label>
                <select
                  id="mic-select"
                  value={selectedMicId}
                  onChange={(e) =>
                    void switchDevice("audioinput", e.target.value)
                  }
                  onFocus={() => void refreshDevices(room)}
                  className="w-full rounded-xl bg-cream/10 border border-cream/15 px-3 py-2.5 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  {audioDevices.length === 0 && (
                    <option value="">Default microphone</option>
                  )}
                  {audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId} className="text-ink">
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="cam-select"
                  className="block text-xs uppercase tracking-wider text-cream/50 mb-2"
                >
                  Camera
                </label>
                <select
                  id="cam-select"
                  value={selectedCamId}
                  onChange={(e) =>
                    void switchDevice("videoinput", e.target.value)
                  }
                  onFocus={() => void refreshDevices(room)}
                  className="w-full rounded-xl bg-cream/10 border border-cream/15 px-3 py-2.5 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  {videoDevices.length === 0 && (
                    <option value="">Default camera</option>
                  )}
                  {videoDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId} className="text-ink">
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-xl border border-cream/10 bg-cream/5 p-3 text-xs text-cream/60 leading-relaxed">
                Choose the devices you want for this session. Changes apply
                immediately when connected.
              </div>
            </div>
          </aside>
        )}

        {/* Chat panel */}
        {chatOpen && (
          <aside className="w-72 sm:w-80 border-l border-cream/10 bg-forest flex flex-col absolute sm:relative inset-y-0 right-0 z-20 shadow-elevated sm:shadow-none">
            <div className="flex items-center justify-between px-4 py-3 border-b border-cream/10 text-sm font-medium">
              Session chat
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="rounded-full p-1.5 hover:bg-cream/10"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
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

      {/* Control bar — Zoom-like */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 sm:py-4 border-t border-cream/10 bg-forest-deep/95 backdrop-blur-md">
        <ControlBtn
          active={micOn}
          onClick={() => void toggleMic()}
          label={micOn ? "Mute" : "Unmute"}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </ControlBtn>
        <ControlBtn
          active={camOn}
          onClick={() => void toggleCam()}
          label={camOn ? "Camera off" : "Camera on"}
        >
          {camOn ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </ControlBtn>
        <ControlBtn
          active={screenSharing}
          onClick={() => void toggleScreenShare()}
          label={screenSharing ? "Stop sharing" : "Share screen"}
        >
          {screenSharing ? (
            <MonitorOff className="h-5 w-5" />
          ) : (
            <MonitorUp className="h-5 w-5" />
          )}
        </ControlBtn>
        <ControlBtn
          active={effectsOpen}
          onClick={() => {
            setEffectsOpen((v) => !v);
            setSettingsOpen(false);
            setChatOpen(false);
          }}
          label="Background effects"
        >
          <ImageIcon className="h-5 w-5" />
        </ControlBtn>
        <ControlBtn
          active={settingsOpen}
          onClick={() => {
            setSettingsOpen((v) => !v);
            setEffectsOpen(false);
            setChatOpen(false);
            void refreshDevices(room);
          }}
          label="Settings"
        >
          <Settings className="h-5 w-5" />
        </ControlBtn>
        <ControlBtn
          active={chatOpen}
          onClick={() => {
            setChatOpen((v) => !v);
            setEffectsOpen(false);
            setSettingsOpen(false);
          }}
          label="Chat"
          className="hidden sm:flex"
        >
          <MessageSquare className="h-5 w-5" />
        </ControlBtn>
        {(isPractitioner || livekitReady) && !demoMode && (
          <ControlBtn
            active={recording}
            onClick={() => void handleRecordToggle()}
            label={recording ? "Stop recording" : "Start recording"}
            className="hidden sm:flex"
          >
            {recordingBusy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Circle className={cn("h-5 w-5", recording && "text-red-400")} />
            )}
          </ControlBtn>
        )}
        <button
          type="button"
          onClick={() => void handleLeave()}
          disabled={ending}
          className="ml-1 sm:ml-3 flex h-12 w-12 sm:w-auto sm:px-5 items-center justify-center gap-2 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-60"
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
  children: ReactNode;
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
      title={label}
      className={cn(
        "flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full transition-colors",
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

function EffectCard({
  children,
  label,
  active,
  onClick,
  disabled,
}: {
  children: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all",
        active
          ? "border-gold/60 bg-gold/10 ring-1 ring-gold/40"
          : "border-cream/10 bg-cream/5 hover:border-cream/25 hover:bg-cream/10",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <div className="w-full flex items-center justify-center min-h-[3rem]">
        {children}
      </div>
      <span className="text-[11px] text-cream/80">{label}</span>
    </button>
  );
}
