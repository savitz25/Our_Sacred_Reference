import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CTABanner } from "@/components/home/CTABanner";
import { BlogArticleBody } from "@/components/blog/BlogArticleBody";
import {
  getAllPostSlugs,
  getPostBySlug,
  getPostsSorted,
} from "@/lib/blog/posts";
import { siteConfig } from "@/lib/content";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.oursacredreference.com";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return { title: "Article not found" };
  }

  const url = `${siteUrl}/blog/${post.slug}`;
  const title = post.subtitle
    ? `${post.title} — ${post.subtitle}`
    : post.title;

  return {
    title,
    description: post.description,
    authors: [{ name: post.author }],
    openGraph: {
      type: "article",
      title,
      description: post.description,
      url,
      siteName: siteConfig.name,
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author],
      images: post.coverImage
        ? [
            {
              url: post.coverImage,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
    alternates: {
      canonical: url,
    },
    keywords: [
      post.category,
      "Sacred Reference",
      "Michele Castro",
      "somatic",
      "felt sense",
      "Path of Remembering",
      "Dark Goddess",
      "embodied spirituality",
    ],
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const url = `${siteUrl}/blog/${post.slug}`;
  const published = new Date(post.date);
  const dateLabel = published.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.subtitle
      ? `${post.title}: ${post.subtitle}`
      : post.title,
    description: post.description,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: published.toISOString(),
    dateModified: published.toISOString(),
    author: {
      "@type": "Person",
      name: post.author,
      url: `${siteUrl}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    articleSection: post.category,
  };

  const related = getPostsSorted()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        <header className="relative bg-sacred-gradient py-16 sm:py-24 overflow-hidden">
          {post.coverImage && (
            <div className="absolute inset-0 opacity-25">
              <Image
                src={post.coverImage}
                alt=""
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-forest-deep/80 via-forest/70 to-forest-deep/90" />
            </div>
          )}
          <div className="relative mx-auto max-w-3xl px-5 sm:px-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-cream/70 hover:text-cream transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All articles
            </Link>
            <Badge className="mb-4 !bg-gold/20 !text-gold-soft">
              {post.category}
            </Badge>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-cream leading-tight">
              {post.title}
            </h1>
            {post.subtitle && (
              <p className="mt-4 font-serif text-xl sm:text-2xl text-gold-soft italic leading-snug">
                {post.subtitle}
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-cream/75">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4 text-gold-soft" aria-hidden />
                {post.author}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gold-soft" aria-hidden />
                <time dateTime={post.date}>{dateLabel}</time>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gold-soft" aria-hidden />
                {post.readTime} read
              </span>
            </div>
          </div>
        </header>

        <Section className="bg-cream" narrow>
          <BlogArticleBody body={post.body} />

          <footer className="mt-14 pt-8 border-t border-border">
            <p className="text-sm text-muted leading-relaxed">
              Written by{" "}
              <Link
                href="/about"
                className="text-teal font-medium hover:underline"
              >
                {post.author}
              </Link>{" "}
              for Sacred Reference — a Path of Remembering.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button href="/book-session" variant="gold">
                Book a free discovery session
              </Button>
              <Button href="/blog" variant="outline">
                More reflections
              </Button>
            </div>
          </footer>
        </Section>

        {related.length > 0 && (
          <Section className="bg-cream-dark/40">
            <h2 className="font-serif text-2xl text-forest mb-6">
              Continue reading
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="block rounded-2xl border border-border bg-white p-5 shadow-soft hover:shadow-elevated transition-shadow"
                  >
                    <p className="text-xs text-teal font-medium mb-1">
                      {r.category}
                    </p>
                    <p className="font-serif text-lg text-forest">{r.title}</p>
                    <p className="mt-2 text-sm text-ink-soft line-clamp-2">
                      {r.excerpt}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </article>

      <CTABanner />
    </>
  );
}
