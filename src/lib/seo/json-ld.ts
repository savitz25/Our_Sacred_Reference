import { getSiteUrl, SEO } from "@/lib/seo/site";
import { approachPillars, mission, offerings, siteConfig } from "@/lib/content";
import type { BlogPost } from "@/lib/blog/posts";

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site}/#organization`,
    name: SEO.siteName,
    alternateName: ["Sacred Reference", "Our Sacred Reference"],
    url: site,
    email: SEO.email,
    description: SEO.defaultDescription,
    founder: {
      "@type": "Person",
      name: SEO.practitioner,
      url: `${site}/about`,
      jobTitle: "Mytho-Shamanic Somatic Practitioner",
    },
    logo: {
      "@type": "ImageObject",
      url: `${site}${SEO.ogImagePath}`,
    },
    sameAs: [] as string[],
    contactPoint: {
      "@type": "ContactPoint",
      email: SEO.email,
      contactType: "customer service",
      availableLanguage: "English",
    },
  };
}

export function websiteJsonLd(): JsonLd {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site}/#website`,
    name: SEO.siteName,
    url: site,
    description: SEO.defaultDescription,
    publisher: { "@id": `${site}/#organization` },
    inLanguage: "en-US",
  };
}

export function personJsonLd(): JsonLd {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${site}/about#person`,
    name: SEO.practitioner,
    url: `${site}/about`,
    jobTitle: "Mytho-Shamanic Somatic Practitioner",
    worksFor: { "@id": `${site}/#organization` },
    description:
      "Michele Castro offers online mytho-shamanic somatic sessions integrating felt sense, nervous system work, Jungian depth psychology, Divine Mother devotion, and a Path of Remembering.",
    knowsAbout: [
      "Somatic healing",
      "Felt sense",
      "Mytho-shamanic practice",
      "Divine Feminine",
      "Transpersonal psychology",
      "Nervous system regulation",
      "Inner child integration",
    ],
  };
}

/** ProfessionalService for offerings / book session */
export function professionalServiceJsonLd(): JsonLd {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${site}/offerings#service`,
    name: `${SEO.siteName} — Mytho-Shamanic Somatic Sessions`,
    url: `${site}/offerings`,
    description:
      "Online mytho-shamanic somatic healing sessions: free discovery, individual sessions, and ongoing embodied path work with Michele Castro.",
    provider: { "@id": `${site}/#organization` },
    areaServed: {
      "@type": "Place",
      name: "Worldwide (online)",
    },
    serviceType: [
      "Somatic coaching",
      "Mytho-shamanic practice",
      "Embodied spirituality",
      "Discovery session",
    ],
    offers: offerings.map((o) => ({
      "@type": "Offer",
      name: o.title,
      description: o.description,
      url: `${site}${o.href}`,
      price: o.featured ? "0" : undefined,
      priceCurrency: o.featured ? "USD" : undefined,
      availability: "https://schema.org/InStock",
    })),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[]
): JsonLd {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${site}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

export function faqPageJsonLd(
  faqs: { question: string; answer: string }[]
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function blogPostingJsonLd(post: BlogPost): JsonLd {
  const site = getSiteUrl();
  const url = `${site}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.subtitle
      ? `${post.title}: ${post.subtitle}`
      : post.title,
    description: post.description,
    image: post.coverImage ? [post.coverImage] : [`${site}${SEO.ogImagePath}`],
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: {
      "@type": "Person",
      name: post.author,
      url: `${site}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: SEO.siteName,
      url: site,
      logo: {
        "@type": "ImageObject",
        url: `${site}${SEO.ogImagePath}`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: post.category,
    keywords: [
      post.category,
      "Sacred Reference",
      "Michele Castro",
      "somatic",
      "felt sense",
      "Path of Remembering",
    ].join(", "),
    inLanguage: "en-US",
    isPartOf: { "@id": `${site}/#website` },
  };
}

export function approachItemListJsonLd(): JsonLd {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Sacred Reference Approach — Seven Pillars",
    description: approachHeartSafe(),
    itemListElement: approachPillars.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.title,
      description: p.description,
      url: `${site}/approach#${p.id}`,
    })),
  };
}

function approachHeartSafe() {
  return "Seven pillars of mytho-shamanic somatic healing: felt sense, somatic healing, inner child, mytho-shamanic practice, Jungian depth, Divine Mother, embodied spirituality.";
}

/** Home page graph: Organization + WebSite + FAQ */
export function homeGraphJsonLd(
  faqs: { question: string; answer: string }[]
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(),
      websiteJsonLd(),
      personJsonLd(),
      faqPageJsonLd(faqs),
    ],
  };
}

export const homeFaqs: { question: string; answer: string }[] = [
  {
    question: "What is mytho-shamanic somatic healing?",
    answer:
      "Mytho-shamanic somatic healing weaves somatic practice, the felt sense, nervous system capacity, Jungian depth psychology, mythology, and mytho-shamanic wisdom so myth becomes a lived, embodied experience — a Path of Remembering rather than a set of techniques alone.",
  },
  {
    question: "What does “symptoms become soul-language” mean?",
    answer:
      "Anxiety, fear, tension, repeating patterns, chronic pain, depression, anger, exhaustion, or a feeling that something is “off” are not only problems to fix. They can be expressions of life force and sacred messages your body, nervous system, and psyche hold — messages you can learn to slow down and decipher.",
  },
  {
    question: "How do online sessions with Sacred Reference work?",
    answer:
      "Sessions are held via secure in-browser video on Sacred Reference. You book a free discovery session or ongoing work through the site, receive portal access, and may enter a serene countdown room before the join window opens. Optional private recordings can appear in your session library.",
  },
  {
    question: "Who is Michele Castro?",
    answer:
      "Michele Castro is the practitioner behind Sacred Reference — a mother and integrative guide devoted to somatic embodiment, the Divine Mother, and helping people turn toward suffering gently, curiously, and reverently.",
  },
  {
    question: "What is the Path of Remembering?",
    answer:
      "Healing is not about becoming someone else or forcing perfection. It is an Initiation — a remembering of feminine wisdom that does not rush, force, or abandon, and of the Wholeness beneath every wound, defense, and life story.",
  },
];

export function missionSnippetForSeo(): string {
  return mission.coreMessage;
}

export { siteConfig };
