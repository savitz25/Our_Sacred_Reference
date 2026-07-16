/**
 * Sacred Reference content — mission, approach, about, and offerings.
 * Core messaging drawn from sacredreference.com (client-loved verbage),
 * integrated with the modern full-stack site voice.
 */

export const siteConfig = {
  name: "Sacred Reference",
  tagline: "A mytho-shamanic return to the wisdom of your soul…",
  shortTagline: "Mytho-Shamanic Somatic Healing",
  description:
    "Beneath every wound, every defense, and every life story there is Wholeness, something sacred waiting to be remembered. A Path of Remembering through somatic awareness, feminine wisdom, and mytho-shamanic practice.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.oursacredreference.com",
  practitioner: "Michele Castro",
  practitionerFirst: "Michele",
  email: "michele@oursacredreference.com",
  supportEmail: "michele@oursacredreference.com",
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

/** Hero — primary messages from the original Sacred Reference home */
export const heroContent = {
  eyebrow: "A mytho-shamanic return to the wisdom of your soul…",
  /** Primary line clients love — used as the hero headline */
  headline:
    "Beneath every wound, every defense, and every life story there is Wholeness, something sacred waiting to be remembered.",
  pathTitle: "This is a Path of Remembering",
  reclaimTitle: "Reclaim the Sacred Intelligence Within",
  reclaimLead:
    "Every symptom in our body, every emotion, relationship or life circumstance carries information. This work takes you to the threshold where symptoms become soul-language.",
  ctaPrimary: "Schedule Your Free Discovery Session",
  ctaSecondary: "Explore the Approach",
};

/**
 * Mission / core teaching — near-verbatim from sacredreference.com
 */
export const mission = {
  title: "Reclaim the Sacred Intelligence Within",
  pathTitle: "This is a Path of Remembering",
  coreMessage:
    "Beneath every wound, every defense, and every life story there is Wholeness, something sacred waiting to be remembered.",
  paragraphs: [
    "What if anxiety, fear, tension, repeating life patterns, illness, chronic pain, depression, anger, conflict, exhaustion, or a feeling that something is “off” are not random problems to fix?",
    "They are expressions of life force… an intelligent, responsive, interconnected system… sacred messages that you can learn to slow down and decipher… your body, your nervous system, your psyche all contain the voices from the soul…. YOUR Sovereign Truth!",
    "At Sacred Reference, I help people learn how to listen to those signals. I guide people to strengthen their capacity to bring unconditional love, compassion and curiosity to the parts that are in suffering, pain, fear and often exiled. Rather than trying to push these experiences away or transcend them we learn to safely turn towards them… Gently, Curiously, Reverently.",
    "Healing is not about having a problem to be fixed… it’s an Initiation, a remembering of the feminine wisdom that does not rush, does not force and does not abandon.",
    "Through somatic awareness, nervous system work, and depth-process oriented dialogue, we create a relationship with the symptoms and experiences and discover that all they are are voices waiting to be heard, aspects of Self waiting to be reconciled. When we do this something profound and remarkable happens… The unconditional love we strive to express becomes the very thing we learn to bring to ourselves.",
  ],
  closing: [
    "What was once fragmented within you begins reorganizing itself towards wholeness.",
    "This is a Path of Remembering.",
  ],
  /** Secondary mission language preserved for about / depth pages */
  practiceParagraphs: [
    "Sacred Reference offers an embodied path of healing that weaves together somatic practice, the felt sense, attachment science, Jungian depth psychology, mythology, and mytho-shamanic wisdom.",
    "Our work invites people to slow down and listen to the intelligence of the body. Through the language of sensation, emotion, image, symbol, and story, we learn to reconnect with the deeper currents of our own psyche and soul.",
    "Rather than striving to transcend the body, we cultivate the capacity to inhabit it. As we develop the ability to stay present with our lived experience, the nervous system becomes a vessel capable of integrating trauma, awakening creativity, deepening relationship, and supporting authentic spiritual transformation.",
  ],
};

export const approachPillars = [
  {
    id: "felt-sense",
    title: "The Felt Sense",
    description:
      "Learning to listen to the body’s subtle language before thoughts and stories arise — the doorway where symptoms become soul-language.",
    icon: "ear",
    color: "teal",
  },
  {
    id: "somatic-healing",
    title: "Somatic Healing",
    description:
      "Building nervous system capacity so healing emerges naturally rather than through force or catharsis — gently, curiously, reverently.",
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
      "Engaging the unconscious through image, shadow, active imagination, and archetypal patterns — a descent that becomes Initiation.",
    icon: "moon",
    color: "forest",
  },
  {
    id: "divine-mother",
    title: "Embodying the Divine Mother",
    description:
      "Cultivating an inner source of nourishment, protection, discernment, and unconditional presence — feminine wisdom that does not rush, force, or abandon.",
    icon: "flower",
    color: "teal",
  },
  {
    id: "embodied-spirituality",
    title: "Embodied Spirituality",
    description:
      "Bridging mystical experience with nervous system regulation so insight becomes lived wisdom — a mytho-shamanic return to the soul.",
    icon: "sun",
    color: "gold",
  },
] as const;

export const approachHeart = {
  title: "The Heart of the Work",
  body: "At the center of Sacred Reference is relationship — with sensation, dreams, myth, the unconscious, the body, Nature, and the Sacred. The felt sense is the doorway; mythology gives language; a mytho-shamanic perspective turns the psyche into a living landscape. We turn toward what is in suffering… Gently, Curiously, Reverently.",
};

/**
 * Michele Castro bio — from sacredreference.com/about (near-verbatim)
 */
export const micheleBio = {
  name: "Michele Castro",
  intro:
    "First and foremost, I am a mother and all I do revolves around this aspect of my life. I have birthed two beautiful goddesses in my Northern California home, nine years apart; each birth was different and offered me the most profound transmission of wisdom and medicine I have ever experienced. Satori and Athena are my greatest teachers, my heart, and my world.",
  paragraphs: [
    "I was raised in central NJ, to an Italian mother and Cuban father, so I was exposed to complete diversity in the hustle-bustle rat race, in a home that was loud, certainly dysfunctional, food-loving, dramatic, passionate, over-bearing chaos, and craziness that I can now see as an enormous slice of Heaven. I include this because it strongly informs my personality, my values, my challenges, and my presence.",
    "I moved to Vermont at the age of 21, where I deepened my relationship with Earth and Spirit in more grounded ways by connecting more to land, the soil, and the plants. I completed degrees in Transpersonal Psychology and Latin American Studies from Burlington College in 2007, which gave me many opportunities to explore healing from a multi-disciplinary approach. It was introduction to the world of mythology, Gnosticism, and the Evolution of Human Consciousness. I was also introduced to the work of Stanislav Grof and the validity of non-ordinary states of consciousness.",
    "In my late 20’s I experienced an immense cycle of repeated loss, death, and grief. I was debilitated in immense sorrow, depression, and other commingled mental health issues. This truly was the beginning of my conscious descent into the Underworld. It was a journey that took many years to unfold.",
    "I had the blessings of traveling and exploring Western Esoteric and Eastern spiritual teachings, which gave me a new understanding of how the Body, Mind, and Spirit work together to ignite The Dark Night of Soul and The Dark Night of the Ego. I participated in many Vipassana Meditations, in the style of S.N. Goenka, and I was introduced to Hatha and Vajra Yoga. I was called repeatedly to the Green Tara, which synchronistically led me to the compassion and teachings of the Divine Mother through various Tibetan Buddhist teachers and practices that I began to utilize and integrate into my own life.",
    "I traveled to the Findhorn Community to study spirituality and community development and was introduced to the work of 5 Rhythms dance, which took me deeper into this understanding of “Body as Psyche” and “living movement meditation.” I also met my current teachers, Errol Weiner and Imogen Masters, who together creatively share their work in Planetary Transpersonal Astrology, Depth Psychology, and Esoteric Wisdom.",
    "At 29, I experienced a direct confirmation of my path through an apparition of the Divine Mother, while camping beneath the stars on a sacred mountain in Baja California, Mexico. I was given the message that I was to be leading people into the process of Awakening.",
    "I settled in the Sierra Foothills of Northern California and devoted myself to healing, transforming, and integrating the teachings and lived experiences into wisdom. I began to bridge the connection between my own life, my ancestral lineage, and ancient mythology. I was introduced to The Stargate Experience in 2011 and began to completely immerse myself in multidimensional energies and frequencies. These meditations gave me such a gentle and expansive way to explore non-ordinary states of consciousness. It was during a Stargate Immersion Retreat in 2020 that I first experienced my connection and ability to channel the energies of Isis.",
    "As the devoted apprentice, I received my Masters Degree in 2015 from Burlington College, in Integrative Psychology specializing in Transpersonal and Somatic Psychology and Trauma Studies. This marriage of science and spirit has allowed me to create unique offerings and techniques to safely access, navigate, and integrate the archetypal, transpersonal, and multidimensional realms of existence.",
    "I also have years of experience working with “at risk” teens with trauma, developmental, and learning disabilities, in both private sessions and in group settings, which is the most challenging, rewarding, and fun work I have ever done. I have accumulated many hours of supervision, consultation, and training in nervous system practices, polyvagal theory, and resiliency skills.",
    "Now in my 40’s, I’m devoted to bringing the many facets of Self into my offerings. I bring my lineage, my experiences, and my wisdom. My deep devotion to Serve and Embody the Divine Mother has been integrated and I am available to bring through her frequencies and energies in various forms. It is through her guidance that I seek to repair her disrupted and distorted connection with humanity.",
    "I am always engaged in continuing education; learning new movement practices, nervous system trainings, and continually developing my research with intentions of contributing more to the field of Transpersonal Psychology and to energetically restore the Great Gnostic Libraries that were destroyed throughout history.",
  ],
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
      "What was fragmented began reorganizing itself. I learned to turn toward my suffering gently — not to fix it, but to listen.",
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
      "A gentle introduction to this Path of Remembering. We explore what brings you, how your body holds your story, and whether this mytho-shamanic somatic work feels like a fit — no pressure, only presence.",
    highlights: [
      "No commitment required",
      "Secure video session on Sacred Reference",
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
      "One-to-one sessions where symptoms become soul-language. We work with somatic awareness, nervous system capacity, depth dialogue, and mytho-shamanic wisdom — turning toward what is in suffering, gently and reverently.",
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
    duration: "Weekly, bi-weekly, or monthly",
    price: "Custom packages",
    description:
      "A sustained relationship with the work — strengthening your capacity for unconditional love and curiosity toward the parts that have been exiled, and remembering the feminine wisdom that does not rush or abandon.",
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
      "Before thoughts and stories arise, the body speaks a subtler language. Learning to listen is the beginning of embodied healing — where symptoms become soul-language.",
    category: "Felt Sense",
    date: "2026-03-12",
    readTime: "6 min",
  },
  {
    slug: "myth-as-lived-experience",
    title: "Myth as Lived Experience",
    excerpt:
      "Mytho-shamanic practice invites myths, dreams, and symbols to become living guides — not metaphors alone, but companions on a Path of Remembering.",
    category: "Mytho-Shamanic",
    date: "2026-02-28",
    readTime: "8 min",
  },
  {
    slug: "nervous-system-as-vessel",
    title: "The Nervous System as Vessel",
    excerpt:
      "Rather than transcending the body, we cultivate the capacity to inhabit it — so trauma, creativity, and spiritual insight can integrate. Gently. Curiously. Reverently.",
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
