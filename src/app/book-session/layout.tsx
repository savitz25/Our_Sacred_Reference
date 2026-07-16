import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Free Discovery Session",
  description:
    "Schedule your free discovery session with Michele — a Path of Remembering through mytho-shamanic somatic healing online.",
};

export default function BookSessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
