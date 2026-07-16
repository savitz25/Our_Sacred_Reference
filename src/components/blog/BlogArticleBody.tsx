import type { BlogBlock } from "@/lib/blog/posts";

export function BlogArticleBody({ body }: { body: BlogBlock[] }) {
  return (
    <div className="prose-sacred space-y-6">
      {body.map((block, i) => {
        if (block.type === "paragraph") {
          return (
            <p
              key={i}
              className="text-ink-soft text-lg leading-[1.75] first:text-ink first:text-xl"
            >
              {block.text}
            </p>
          );
        }
        if (block.type === "blockquote") {
          return (
            <blockquote
              key={i}
              className="border-l-4 border-gold pl-5 sm:pl-6 my-8"
            >
              <p className="font-serif text-xl sm:text-2xl text-forest leading-snug italic">
                “{block.text}”
              </p>
              {block.cite && (
                <cite className="mt-3 block text-sm text-muted not-italic">
                  — {block.cite}
                </cite>
              )}
            </blockquote>
          );
        }
        if (block.type === "heading") {
          if (block.level === 2) {
            return (
              <h2
                key={i}
                className="font-serif text-2xl sm:text-3xl text-forest font-medium pt-6 pb-1"
              >
                {block.text}
              </h2>
            );
          }
          return (
            <h3
              key={i}
              className="font-serif text-xl sm:text-2xl text-forest font-medium pt-4"
            >
              {block.text}
            </h3>
          );
        }
        return null;
      })}
    </div>
  );
}
