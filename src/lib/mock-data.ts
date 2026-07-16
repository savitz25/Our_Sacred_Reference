export type SessionStatus = "upcoming" | "completed" | "cancelled";

export interface MockSession {
  id: string;
  title: string;
  datetime: string;
  duration: string;
  status: SessionStatus;
  joinable?: boolean;
}

export interface MockVideo {
  id: string;
  sessionId: string;
  title: string;
  date: string;
  duration: string;
  categories: string[];
  thumbnail: string;
  notes?: string;
}

export const mockClient = {
  name: "Alex Rivera",
  email: "alex@example.com",
  memberSince: "January 2026",
};

export const mockUpcomingSessions: MockSession[] = [
  {
    id: "sess-upcoming-1",
    title: "Individual Session with Michele",
    datetime: "2026-07-18T15:00:00",
    duration: "75 min",
    status: "upcoming",
    joinable: true,
  },
  {
    id: "sess-upcoming-2",
    title: "Individual Session with Michele",
    datetime: "2026-07-25T15:00:00",
    duration: "75 min",
    status: "upcoming",
    joinable: false,
  },
];

export const mockVideos: MockVideo[] = [
  {
    id: "vid-1",
    sessionId: "sess-1",
    title: "Opening to the Felt Sense",
    date: "2026-07-04",
    duration: "68 min",
    categories: ["Felt Sense", "Somatic Healing"],
    thumbnail:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
    notes: "Explored subtle body language before narrative.",
  },
  {
    id: "vid-2",
    sessionId: "sess-2",
    title: "Mytho-Shamanic Journey: The Threshold",
    date: "2026-06-27",
    duration: "72 min",
    categories: ["Mytho-Shamanic Journey", "Embodied Spirituality"],
    thumbnail:
      "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80",
    notes: "Working with threshold imagery and nervous system settling.",
  },
  {
    id: "vid-3",
    sessionId: "sess-3",
    title: "Inner Child Presence Practice",
    date: "2026-06-20",
    duration: "70 min",
    categories: ["Inner Child Integration", "Divine Mother"],
    thumbnail:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
  },
  {
    id: "vid-4",
    sessionId: "sess-4",
    title: "Shadow & Active Imagination",
    date: "2026-06-13",
    duration: "75 min",
    categories: ["Jungian Depth", "Felt Sense"],
    thumbnail:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
  },
  {
    id: "vid-5",
    sessionId: "sess-5",
    title: "Embodying Nourishment",
    date: "2026-06-06",
    duration: "65 min",
    categories: ["Divine Mother", "Somatic Healing"],
    thumbnail:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
  },
  {
    id: "vid-6",
    sessionId: "sess-6",
    title: "Discovery Session Archive",
    date: "2026-05-30",
    duration: "40 min",
    categories: ["Felt Sense"],
    thumbnail:
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80",
  },
];

/** Simple calendar availability mock for booking UI */
export function getAvailableSlots(date: Date): string[] {
  const day = date.getDay();
  if (day === 0 || day === 6) return [];
  return ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"];
}
