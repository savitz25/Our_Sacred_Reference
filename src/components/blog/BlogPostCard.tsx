import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { BlogPost } from "@/lib/blog/posts";

type BlogPostCardProps = {
  post: BlogPost;
  /** Compact card for homepage teaser grids */
  variant?: "index" | "teaser";
};

export function BlogPostCard({ post, variant = "index" }: BlogPostCardProps) {
  const dateLabel = new Date(post.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (variant === "teaser") {
    return (
      <Link href={`/blog/${post.slug}`} className="group block h-full">
        <Card hover className="h-full">
          <Badge variant="teal" className="mb-3">
            {post.category}
          </Badge>
          <h3 className="font-serif text-xl text-forest group-hover:text-teal transition-colors mb-2">
            {post.title}
          </h3>
          {post.subtitle && (
            <p className="text-sm text-ink-soft italic mb-2 line-clamp-2">
              {post.subtitle}
            </p>
          )}
          <p className="text-sm text-ink-soft leading-relaxed mb-4 line-clamp-3">
            {post.excerpt}
          </p>
          <span className="inline-flex items-center gap-1 text-sm text-teal font-medium">
            Read more
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </Card>
      </Link>
    );
  }

  return (
    <article id={post.slug} className="scroll-mt-24 h-full">
      <Link href={`/blog/${post.slug}`} className="group block h-full">
        <Card hover padding="lg" className="h-full">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Badge variant="teal">{post.category}</Badge>
            <span className="text-xs text-muted">
              {dateLabel} · {post.readTime} read · {post.author}
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-forest mb-2 group-hover:text-teal transition-colors">
            {post.title}
          </h2>
          {post.subtitle && (
            <p className="font-serif text-lg text-ink-soft italic mb-3">
              {post.subtitle}
            </p>
          )}
          <p className="text-ink-soft leading-relaxed text-lg">{post.excerpt}</p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-teal">
            Read full article
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </Card>
      </Link>
    </article>
  );
}
