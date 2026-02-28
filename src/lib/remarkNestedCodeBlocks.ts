import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Code, Root } from "mdast";

/**
 * Remark plugin to handle nested code blocks (triple backticks inside triple backticks).
 *
 * Standard markdown parsers don't handle nested code blocks well because it's not
 * valid CommonMark. This plugin preprocesses the markdown to escape inner code fences
 * so they render as literal text inside the outer code block.
 *
 * How it works:
 * 1. Finds all code blocks with language="markdown" or language=""
 * 2. Looks for nested triple backticks inside the code content
 * 3. Counts opening and closing backticks to maintain proper nesting
 * 4. Only the outermost backticks should close the code block
 */
const remarkNestedCodeBlocks: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "code", (node: Code) => {
      // Only process markdown code blocks or generic code blocks
      if (node.lang === "markdown" || !node.lang) {
        const content = node.value;

        // Check if there are nested code blocks (triple backticks inside)
        const backtickPattern = /```/g;
        const matches = content.match(backtickPattern);

        if (matches && matches.length > 0) {
          // Count opening and closing backticks
          // For proper nesting, we need to escape inner backticks
          // Replace inner ``` with a unicode lookalike or escaped version
          // that won't be parsed as a code fence closer

          // Strategy: Replace inner ``` with ` ` ` (with zero-width spaces)
          // or use a different approach: add zero-width space between backticks
          const lines = content.split("\n");
          let inNestedBlock = false;
          let nestedBlockLang = "";

          const processedLines = lines.map((line, index) => {
            // Detect code fence lines
            const fenceMatch = line.match(/^(\s*)```(\w*)(.*)$/);

            if (fenceMatch) {
              if (!inNestedBlock) {
                // This is an opening fence for a nested block
                inNestedBlock = true;
                nestedBlockLang = fenceMatch[2];
                // Replace ``` with ` ` ` (with hair spaces U+200A)
                return line.replace(/```/, "`\u200A`\u200A`");
              } else {
                // This is a closing fence for a nested block
                inNestedBlock = false;
                // Replace ``` with ` ` ` (with hair spaces U+200A)
                return line.replace(/```/, "`\u200A`\u200A`");
              }
            }

            return line;
          });

          node.value = processedLines.join("\n");
        }
      }
    });
  };
};

export default remarkNestedCodeBlocks;
