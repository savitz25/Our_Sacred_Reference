import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Free Discovery Session",
  description:
    "Schedule your free discovery session with Sacred Reference — mytho-shamanic somatic healing online.",
};

export default function BookSessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
