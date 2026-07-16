import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Login",
  description: "Sign in to your Sacred Reference client portal.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
