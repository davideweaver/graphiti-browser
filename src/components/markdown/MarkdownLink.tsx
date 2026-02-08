import { Link } from "react-router-dom";

interface MarkdownLinkProps {
  href?: string;
  children?: React.ReactNode;
  currentDocumentPath?: string;
}

/**
 * Custom link component for ReactMarkdown that handles internal document links
 * and external links appropriately.
 *
 * Internal links (markdown files):
 * - Rendered as React Router Links for client-side navigation
 * - Relative paths resolved based on currentDocumentPath
 * - .md extension automatically stripped for routing
 *
 * External links:
 * - Open in new tab with security attributes
 */
export function MarkdownLink({
  href,
  children,
  currentDocumentPath,
  ...props
}: MarkdownLinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (!href) return <a {...props}>{children}</a>;

  // Check if this is an internal markdown link
  const isInternalLink =
    href.endsWith(".md") ||
    href.includes(".md#") ||
    (!href.startsWith("http://") &&
      !href.startsWith("https://") &&
      !href.startsWith("mailto:"));

  if (isInternalLink) {
    // Keep the full path including .md extension for routing
    let linkPath = href;

    // Handle path resolution (only if currentDocumentPath is provided)
    if (currentDocumentPath) {
      // Check if this is an absolute path from the Documents root
      // (e.g., "Home/Lab/..." when current path is "Documents/Home/Lab/...")
      const firstSegment = linkPath.split("/")[0];
      const isAbsoluteFromDocumentsRoot =
        currentDocumentPath.startsWith("Documents/") &&
        currentDocumentPath.includes(`/${firstSegment}/`);

      if (isAbsoluteFromDocumentsRoot) {
        // This is an absolute path from Documents root, prepend "Documents/"
        linkPath = `Documents/${linkPath}`;
      } else if (linkPath.startsWith("/")) {
        // Remove leading slash for absolute paths
        linkPath = linkPath.substring(1);
      } else if (!linkPath.startsWith("/")) {
        // This is a relative path, resolve it relative to current directory
        const currentDir = currentDocumentPath.split("/").slice(0, -1).join("/");

        // Resolve relative path
        const pathSegments = currentDir ? currentDir.split("/") : [];
        const linkSegments = linkPath.split("/");

        for (const segment of linkSegments) {
          if (segment === "..") {
            pathSegments.pop();
          } else if (segment !== ".") {
            pathSegments.push(segment);
          }
        }

        linkPath = pathSegments.join("/");
      }
    } else if (linkPath.startsWith("/")) {
      // Remove leading slash for absolute paths
      linkPath = linkPath.substring(1);
    }

    // Navigate to the document
    return (
      <Link
        to={`/documents/${linkPath}`}
        className="text-primary hover:underline"
        {...props}
      >
        {children}
      </Link>
    );
  }

  // External links open in new tab
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
      {...props}
    >
      {children}
    </a>
  );
}
