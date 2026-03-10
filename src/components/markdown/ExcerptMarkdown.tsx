import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ExcerptMarkdownProps {
  content: string;
  /**
   * inline: collapses all block elements to spans — use for list rows where
   * line-clamp needs to cut mid-sentence across the whole excerpt.
   *
   * block (default): renders as block markdown with headings capped to just
   * slightly larger than body text — use for search result cards.
   */
  inline?: boolean;
  className?: string;
}

// Block mode: headings capped just above body size (body = text-sm = 14px)
const blockComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => <p className="text-[15px] font-semibold my-0 leading-snug">{children}</p>,
  h2: ({ children }) => <p className="text-[15px] font-semibold my-0 leading-snug">{children}</p>,
  h3: ({ children }) => <p className="text-sm font-semibold my-0 leading-snug">{children}</p>,
  h4: ({ children }) => <p className="text-sm font-semibold my-0">{children}</p>,
  h5: ({ children }) => <p className="text-sm font-semibold my-0">{children}</p>,
  h6: ({ children }) => <p className="text-sm font-semibold my-0">{children}</p>,
  p:  ({ children }) => <p className="my-0">{children}</p>,
};

// Inline mode: every element collapses to a span so line-clamp cuts naturally
const inlineComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p:          ({ children }) => <span>{children} </span>,
  h1:         ({ children }) => <span className="font-semibold">{children} </span>,
  h2:         ({ children }) => <span className="font-semibold">{children} </span>,
  h3:         ({ children }) => <span className="font-semibold">{children} </span>,
  h4:         ({ children }) => <span className="font-semibold">{children} </span>,
  h5:         ({ children }) => <span className="font-semibold">{children} </span>,
  h6:         ({ children }) => <span className="font-semibold">{children} </span>,
  strong:     ({ children }) => <strong>{children}</strong>,
  em:         ({ children }) => <em>{children}</em>,
  code:       ({ children }) => <code className="text-xs bg-white/10 rounded px-0.5">{children}</code>,
  ul:         ({ children }) => <span>{children}</span>,
  ol:         ({ children }) => <span>{children}</span>,
  li:         ({ children }) => <span>• {children} </span>,
  blockquote: ({ children }) => <span className="italic opacity-75">{children}</span>,
};

export function ExcerptMarkdown({ content, inline = false, className }: ExcerptMarkdownProps) {
  const text = inline ? content.replace(/\n/g, " ") : content;

  return (
    <div
      className={cn(
        "text-sm text-muted-foreground",
        !inline && "prose prose-sm dark:prose-invert max-w-none",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={inline ? [] : [remarkGfm]}
        components={inline ? inlineComponents : blockComponents}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
