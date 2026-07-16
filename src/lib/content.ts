export const siteConfig = {
  name: "Sacred Reference",
  tagline: "Mytho-Shamanic Somatic Healing",
  description:
    "An embodied path of healing weaving somatic practice, the felt sense, attachment science, Jungian depth psychology, mythology, and mytho-shamanic wisdom.",
  url: "https://sacredreference.com",
  practitioner: "Michele",
  email: "hello@sacredreference.com",
};

export const navigation = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Approach", href: "/approach" },
  { name: "Offerings", href: "/offerings" },
  { name: "Blog", href: "/blog" },
  { name: "Book Free Session", href: "/book-session", cta: true },
];

export const portalNav = [
  { name: "Dashboard", href: "/portal" },
  { name: "Session Library", href: "/portal/library" },
  { name: "Profile", href: "/portal/profile" },
];

export const mission = {
  title: "Our Mission",
  paragraphs: [
    "Sacred Reference offers an embodied path of healing that weaves together somatic practice, the felt sense, attachment science, Jungian depth psychology, mythology, and mytho-shamanic wisdom.",
    "Our work invites people to slow down and listen to the intelligence of the body. Through the language of sensation, emotion, image, symbol, and story, we learn to reconnect with the deeper currents of our own psyche and soul.",
    "Rather than striving to transcend the body, we cultivate the capacity to inhabit it. As we develop the ability to stay present with our lived experience, the nervous system becomes a vessel capable of integrating trauma, awakening creativity, deepening relationship, and supporting authentic spiritual transformation.",
  ],
  closing: [
    "Healing is not about becoming someone else.",
    "It is about remembering the sacred intelligence that has always lived within you.",
  ],
};

export const approachPillars = [
  {
    id: "felt-sense",
    title: "The Felt Sense",
    description:
      "Learning to listen to the body's subtle language before thoughts and stories arise.",
    icon: "ear",
    color: "teal",
  },
  {
    id: "somatic-healing",
    title: "Somatic Healing",
    description:
      "Building nervous system capacity so healing emerges naturally rather than through force or catharsis.",
    icon: "heart",
    color: "forest",
  },
  {
    id: "inner-child",
    title: "Inner Child Integration",
    description:
      "Meeting younger parts of ourselves with presence, curiosity, and compassion, allowing unfinished developmental experiences to become integrated.",
    icon: "sparkles",
    color: "gold",
  },
  {
    id: "mytho-shamanic",
    title: "Mytho-Shamanic Practice",
    description:
      "Working with myths, dreams, symbols, archetypes, and imagination as living guides for transformation rather than metaphors alone.",
    icon: "flame",
    color: "gold",
  },
  {
    id: "jungian",
    title: "Jungian Depth Psychology",
    description:
      "Engaging the unconscious through image, shadow, active imagination, and archetypal patterns.",
    icon: "moon",
    color: "forest",
  },
  {
    id: "divine-mother",
    title: "Embodying the Divine Mother",
    description:
      "Cultivating an inner source of nourishment, protection, discernment, and unconditional presence.",
    icon: "flower",
    color: "teal",
  },
  {
    id: "embodied-spirituality",
    title: "Embodied Spirituality",
    description:
      "Bridging mystical experience with nervous system regulation so insight becomes lived wisdom.",
    icon: "sun",
    color: "gold",
  },
] as const;

export const approachHeart = {
  title: "The Heart of the Work",
  body: "At the center of Sacred Reference is relationship — with sensation, dreams, myth, the unconscious, the body, Nature, and the Sacred. The felt sense is the doorway; mythology gives language; a mytho-shamanic perspective turns the psyche into a living landscape.",
};

export const testimonials = [
  {
    quote:
      "For the first time, myth felt like something living in my body — not a story I was analyzing, but a presence I could meet.",
    author: "Client reflection",
    role: "Online sessions",
  },
  {
    quote:
      "Michele holds a space that is both deeply grounded and mysteriously open. My nervous system finally had room to settle.",
    author: "Client reflection",
    role: "Discovery session",
  },
  {
    quote:
      "The session library became an embodied archive — I could return to the felt sense of our work between meetings.",
    author: "Client reflection",
    role: "Ongoing work",
  },
];

export const offerings = [
  {
    title: "Free Discovery Session",
    duration: "30–45 minutes",
    price: "Complimentary",
    description:
      "A gentle introduction to the Sacred Reference approach. We explore what brings you, how your body holds your story, and whether this work feels like a fit.",
    highlights: [
      "No commitment required",
      "Secure video session",
      "Portal access to schedule follow-ups",
    ],
    cta: "Book Free Session",
    href: "/book-session",
    featured: true,
  },
  {
    title: "Individual Sessions",
    duration: "60–75 minutes",
    price: "Investment discussed in discovery",
    description:
      "Deep, online video sessions integrating somatic practice, felt sense, attachment science, Jungian depth psychology, and mytho-shamanic wisdom.",
    highlights: [
      "In-browser secure video",
      "Session recording in private library",
      "Thematic categorization of past work",
    ],
    cta: "Learn More",
    href: "/book-session",
    featured: false,
  },
  {
    title: "Ongoing Embodied Path",
    duration: "Weekly or bi-weekly",
    price: "Custom packages",
    description:
      "A sustained relationship with the work — building nervous system capacity, integrating myth as lived experience, and cultivating inner sacred reference.",
    highlights: [
      "Personalized session library",
      "Continuity across the seasons of healing",
      "Priority scheduling",
    ],
    cta: "Start with Discovery",
    href: "/book-session",
    featured: false,
  },
];

export const blogPosts = [
  {
    slug: "felt-sense-as-doorway",
    title: "The Felt Sense as Doorway",
    excerpt:
      "Before thoughts and stories arise, the body speaks a subtler language. Learning to listen is the beginning of embodied healing.",
    category: "Felt Sense",
    date: "2026-03-12",
    readTime: "6 min",
  },
  {
    slug: "myth-as-lived-experience",
    title: "Myth as Lived Experience",
    excerpt:
      "Mytho-shamanic practice invites myths, dreams, and symbols to become living guides — not metaphors alone, but companions on the path.",
    category: "Mytho-Shamanic",
    date: "2026-02-28",
    readTime: "8 min",
  },
  {
    slug: "nervous-system-as-vessel",
    title: "The Nervous System as Vessel",
    excerpt:
      "Rather than transcending the body, we cultivate the capacity to inhabit it — so trauma, creativity, and spiritual insight can integrate.",
    category: "Somatic Healing",
    date: "2026-02-10",
    readTime: "7 min",
  },
];

export const videoCategories = [
  "All",
  "Felt Sense",
  "Somatic Healing",
  "Inner Child Integration",
  "Mytho-Shamanic Journey",
  "Jungian Depth",
  "Divine Mother",
  "Embodied Spirituality",
] as const;
