import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { blogPosts } from "@/lib/content";
import { CTABanner } from "@/components/home/CTABanner";

export const metadata: Metadata = {
  title: "Blog & Resources",
  description:
    "Articles and reflections on felt sense, myth as lived experience, somatic healing, and mytho-shamanic practice.",
};

export default function BlogPage() {
  return (
    <>
      <section className="relative bg-sacred-gradient py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-gold-soft text-sm font-medium tracking-[0.15em] uppercase mb-4">
            Resources
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-cream max-w-3xl leading-tight">
            Blog & Resources
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cream/80 leading-relaxed">
            A future content hub for felt sense, myth as lived experience, and
            embodied spirituality. Featured pieces below are design placeholders.
          </p>
        </div>
      </section>

      <Section className="bg-cream">
        <SectionHeader
          eyebrow="Featured"
          title="Reflections for the path"
          description="Full articles will publish here. These teasers illustrate layout and tone."
        />

        <div className="grid gap-8 max-w-3xl mx-auto">
          {blogPosts.map((post) => (
            <article key={post.slug} id={post.slug} className="scroll-mt-24">
              <Card hover padding="lg">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <Badge variant="teal">{post.category}</Badge>
                  <span className="text-xs text-muted">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {post.readTime} read
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl text-forest mb-3">
                  {post.title}
                </h2>
                <p className="text-ink-soft leading-relaxed text-lg">
                  {post.excerpt}
                </p>
                <p className="mt-4 text-sm text-muted italic">
                  Full article coming soon — content hub for Phase 2.
                </p>
              </Card>
            </article>
          ))}
        </div>
      </Section>

      <CTABanner />
    </>
  );
}
