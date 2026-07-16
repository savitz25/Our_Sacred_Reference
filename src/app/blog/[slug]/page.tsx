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
import { buildPageMetadata } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { blogPostingJsonLd } from "@/lib/seo/json-ld";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { RelatedPaths } from "@/components/seo/RelatedPaths";

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
    return { title: "Article not found", robots: { index: false } };
  }

  const title = post.subtitle
    ? `${post.title} — ${post.subtitle}`
    : post.title;

  return {
    ...buildPageMetadata({
      title,
      description: post.description,
      path: `/blog/${post.slug}`,
      type: "article",
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author],
      images: post.coverImage ? [post.coverImage] : undefined,
      keywords: [
        post.category,
        "Sacred Reference",
        "Michele Castro",
        "somatic healing essay",
        "felt sense",
        "Path of Remembering",
        "Dark Goddess",
        "embodied spirituality",
        "Divine Feminine",
      ],
    }),
    openGraph: {
      ...buildPageMetadata({
        title,
        description: post.description,
        path: `/blog/${post.slug}`,
        type: "article",
        publishedTime: new Date(post.date).toISOString(),
        authors: [post.author],
        images: post.coverImage ? [post.coverImage] : undefined,
      }).openGraph,
      type: "article",
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const published = new Date(post.date);
  const dateLabel = published.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const related = getPostsSorted()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  return (
    <>
      <JsonLd data={blogPostingJsonLd(post)} />

      <article itemScope itemType="https://schema.org/BlogPosting">
        <meta itemProp="datePublished" content={post.date} />
        <meta itemProp="author" content={post.author} />
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
            <Breadcrumbs
              light
              className="mb-6"
              items={[
                { name: "Blog", path: "/blog" },
                { name: post.title, path: `/blog/${post.slug}` },
              ]}
            />
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
            <h1
              itemProp="headline"
              className="font-serif text-3xl sm:text-4xl lg:text-5xl text-cream leading-tight"
            >
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
          <div itemProp="articleBody">
            <BlogArticleBody body={post.body} />
          </div>

          <footer className="mt-14 pt-8 border-t border-border">
            <p className="text-sm text-muted leading-relaxed">
              Written by{" "}
              <Link
                href="/about"
                className="text-teal font-medium hover:underline"
              >
                {post.author}
              </Link>{" "}
              for Sacred Reference — a Path of Remembering. Explore the{" "}
              <Link href="/approach" className="text-teal hover:underline">
                approach
              </Link>
              ,{" "}
              <Link href="/offerings" className="text-teal hover:underline">
                offerings
              </Link>
              , or{" "}
              <Link href="/book-session" className="text-teal hover:underline">
                book a free discovery session
              </Link>
              .
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

        <Section className="bg-cream" narrow>
          <RelatedPaths excludeHref="/blog" />
        </Section>
      </article>

      <CTABanner />
    </>
  );
}
