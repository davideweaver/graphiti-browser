import { visit, SKIP } from "unist-util-visit";
import type { Root, Text, Link, Image, Parent } from "mdast";

/**
 * Remark plugin to transform Obsidian wiki-links into standard markdown links.
 *
 * Transforms:
 * - [[Document Name]] -> [Document Name](Document Name.md)
 * - [[path/to/file.md]] -> [file](path/to/file.md)
 * - [[path/to/file.md|Display Text]] -> [Display Text](path/to/file.md)
 * - ![[image.png]] -> ![](image.png)
 * - ![[image.png | #small]] -> ![](image.png)
 */
export default function remarkWikiLinks() {
  return (tree: Root) => {
    // Collect all replacements first, then apply them
    const replacements: Array<{
      parent: Parent;
      index: number;
      newNodes: (Text | Link | Image)[];
    }> = [];

    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index === undefined || !("children" in parent)) return;

      const text = node.value;
      // Match wiki-links: [[...]] or ![[...]]
      const wikiLinkRegex = /(!?\[\[([^\]]+?)\]\])/g;

      let match;
      let lastIndex = 0;
      const newNodes: (Text | Link | Image)[] = [];

      while ((match = wikiLinkRegex.exec(text)) !== null) {
        const fullMatch = match[1]; // ![[...]] or [[...]]
        const isEmbed = fullMatch.startsWith("!");
        const innerContent = match[2]; // Everything inside [[...]]

        // Add text before the wiki-link
        if (match.index > lastIndex) {
          newNodes.push({
            type: "text",
            value: text.slice(lastIndex, match.index),
          } as Text);
        }

        // Parse the wiki-link content
        // Format: "path/to/file.md|Display Text" or "path/to/file.md" or "path/to/file"
        const pipeSplit = innerContent.split("|");
        let linkPath = pipeSplit[0].trim();
        let displayText = pipeSplit[1]?.trim();

        // Handle image size modifiers (e.g., "| #xx-small")
        if (displayText?.startsWith("#")) {
          displayText = "";
        }

        // If no display text, derive it from the path
        if (!displayText) {
          // Extract filename without extension
          const pathParts = linkPath.split("/");
          const filename = pathParts[pathParts.length - 1];
          displayText = filename.replace(/\.md$/, "");
        }

        // Ensure .md extension for document links (not images)
        const isImageLink = /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(linkPath);
        if (!isImageLink && !linkPath.endsWith(".md")) {
          linkPath = linkPath + ".md";
        }

        // Create appropriate node
        if (isEmbed && isImageLink) {
          // Embedded image: ![[image.png]]
          newNodes.push({
            type: "image",
            url: linkPath,
            alt: displayText,
          } as Image);
        } else if (isEmbed) {
          // Embedded document: ![[doc.md]] - treat as regular link
          newNodes.push({
            type: "link",
            url: linkPath,
            children: [{ type: "text", value: displayText } as Text],
          } as Link);
        } else {
          // Regular wiki-link: [[doc.md]] or [[doc.md|Text]]
          newNodes.push({
            type: "link",
            url: linkPath,
            children: [{ type: "text", value: displayText } as Text],
          } as Link);
        }

        lastIndex = match.index + fullMatch.length;
      }

      // Add remaining text after the last wiki-link
      if (lastIndex < text.length) {
        newNodes.push({
          type: "text",
          value: text.slice(lastIndex),
        } as Text);
      }

      // Collect replacement if we found any wiki-links
      if (newNodes.length > 0) {
        replacements.push({
          parent: parent as Parent,
          index,
          newNodes,
        });
      }
    });

    // Apply all replacements in reverse order to maintain correct indices
    replacements.reverse().forEach(({ parent, index, newNodes }) => {
      parent.children.splice(index, 1, ...newNodes);
    });
  };
}
