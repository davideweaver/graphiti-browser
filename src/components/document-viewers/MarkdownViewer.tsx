import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkWikiLinks from "@/lib/remarkWikiLinks";
import remarkNestedCodeBlocks from "@/lib/remarkNestedCodeBlocks";
import { MarkdownLink } from "@/components/markdown/MarkdownLink";
import type { Components } from "react-markdown";

interface MarkdownViewerProps {
  content: string;
  documentPath: string;
}

export function MarkdownViewer({ content, documentPath }: MarkdownViewerProps) {
  const markdownComponents: Components = {
    a: ({ href, children, ...props }) => (
      <MarkdownLink href={href} currentDocumentPath={documentPath} {...props}>
        {children}
      </MarkdownLink>
    ),
  };

  return (
    <article className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[
          remarkNestedCodeBlocks,
          remarkGfm,
          remarkBreaks,
          remarkWikiLinks,
        ]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
