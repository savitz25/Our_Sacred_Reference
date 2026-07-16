"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  PhoneOff,
  Circle,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface VideoRoomMockProps {
  sessionTitle?: string;
}

export function VideoRoomMock({
  sessionTitle = "Secure Session with Michele",
}: VideoRoomMockProps) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [recording, setRecording] = useState(true);
  const [ended, setEnded] = useState(false);

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
            Your video is being automatically processed, edited, categorized,
            and added to your private library.
          </p>
          <p className="text-sm text-muted mb-8">
            Placeholder for post-session automation (FFmpeg trim, private
            storage, optional local Whisper tagging). You&apos;ll receive an
            email when it&apos;s ready.
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
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-cream/10">
        <div>
          <p className="text-sm font-medium">{sessionTitle}</p>
          <p className="text-xs text-cream/50">Encrypted · In-browser · Design mock</p>
        </div>
        <div className="flex items-center gap-3">
          {recording && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-200">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              Recording (practitioner only)
            </span>
          )}
          <Link
            href="/portal"
            className="text-xs text-cream/50 hover:text-cream hidden sm:inline"
          >
            Exit to portal
          </Link>
        </div>
      </div>

      {/* Video stage */}
      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 relative p-3 sm:p-4">
          {/* Main participant */}
          <div className="h-full rounded-2xl overflow-hidden bg-gradient-to-br from-forest to-teal-muted relative flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=60)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="relative text-center z-10">
              <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-cream/15 border border-cream/20 text-3xl font-serif">
                M
              </div>
              <p className="font-medium">Michele</p>
              <p className="text-xs text-cream/60 mt-1">Practitioner</p>
            </div>
            <span className="absolute bottom-4 left-4 rounded-lg bg-forest-deep/70 px-2.5 py-1 text-xs">
              Michele
            </span>
          </div>

          {/* Self view */}
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
              Chat placeholder — messages appear here during live sessions.
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

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 px-4 py-4 border-t border-cream/10 bg-forest-deep/90">
        <ControlBtn
          active={micOn}
          onClick={() => setMicOn((v) => !v)}
          label={micOn ? "Mute microphone" : "Unmute microphone"}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </ControlBtn>
        <ControlBtn
          active={camOn}
          onClick={() => setCamOn((v) => !v)}
          label={camOn ? "Turn off camera" : "Turn on camera"}
        >
          {camOn ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </ControlBtn>
        <ControlBtn
          active={false}
          onClick={() => {}}
          label="Share screen (mock)"
        >
          <MonitorUp className="h-5 w-5" />
        </ControlBtn>
        <ControlBtn
          active={chatOpen}
          onClick={() => setChatOpen((v) => !v)}
          label="Toggle chat"
        >
          <MessageSquare className="h-5 w-5" />
        </ControlBtn>
        <ControlBtn
          active={recording}
          onClick={() => setRecording((v) => !v)}
          label="Toggle recording indicator"
          className="hidden sm:flex"
        >
          <Circle className={cn("h-5 w-5", recording && "text-red-400")} />
        </ControlBtn>
        <ControlBtn active={false} onClick={() => {}} label="Fullscreen mock">
          <Maximize2 className="h-5 w-5" />
        </ControlBtn>
        <button
          type="button"
          onClick={() => setEnded(true)}
          className="ml-2 sm:ml-4 flex h-12 w-12 sm:w-auto sm:px-5 items-center justify-center gap-2 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors"
          aria-label="Leave session"
        >
          <PhoneOff className="h-5 w-5" />
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
