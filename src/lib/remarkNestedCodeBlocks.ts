import type { Plugin } from "unified";
import type { Root } from "mdast";

/**
 * Preprocesses raw markdown to handle nested code blocks.
 *
 * ## Problem
 * Standard markdown parsers don't handle nested code blocks correctly. When a markdown
 * code block contains nested triple backticks (e.g., bash code blocks inside a markdown
 * code block), the parser treats the first inner ``` as the closing fence for the outer
 * block, causing incorrect rendering.
 *
 * ## Solution
 * This preprocessor runs BEFORE the markdown parser and escapes nested code fences by
 * inserting hair space characters (U+200A) between the backticks: ``` becomes ` ` `.
 * This prevents the parser from treating inner fences as block closers while maintaining
 * visual appearance.
 *
 * ## Algorithm
 * Uses a state machine to track:
 * - Whether we're currently inside a code block
 * - The language of the outer block (markdown, xml, bash, etc.)
 * - Nesting depth within markdown blocks (0 or 1)
 *
 * Only processes markdown-type blocks (```markdown or bare ``` blocks), as these are
 * the only ones that can contain nested code examples.
 *
 * @param markdown - Raw markdown string before parsing
 * @returns Preprocessed markdown with escaped nested fences
 *
 * @example
 * Input:
 * ```markdown
 * # Example
 * ```bash
 * echo "hello"
 * ```
 * ```
 *
 * Output:
 * ```markdown
 * # Example
 * ` ` `bash
 * echo "hello"
 * ` ` `
 * ```
 */
export function preprocessNestedCodeBlocks(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];

  // State machine variables
  let inCodeBlock = false;
  let codeBlockLang = "";
  let nestingDepth = 0;

  for (const line of lines) {
    const fenceMatch = line.match(/^```(\w*)/);

    if (!fenceMatch) {
      // Regular line (not a code fence)
      result.push(line);
      continue;
    }

    const lang = fenceMatch[1] || "";

    if (!inCodeBlock) {
      // Opening a new code block
      inCodeBlock = true;
      codeBlockLang = lang;
      nestingDepth = 0;
      result.push(line);
    } else if (codeBlockLang === "markdown" || codeBlockLang === "") {
      // Inside a markdown block - handle nested fences
      if (nestingDepth === 0 && lang === "") {
        // Closing fence for the outer markdown block (``` with no language at depth 0)
        inCodeBlock = false;
        result.push(line);
      } else {
        // Nested fence (either opening or closing inner block)
        // Escape by inserting hair spaces between backticks
        result.push(line.replace(/```/g, "`\u200A`\u200A`"));
        // Toggle depth: 0 -> 1 (entering nested block) or 1 -> 0 (exiting nested block)
        nestingDepth = nestingDepth === 0 ? 1 : 0;
      }
    } else {
      // Inside a non-markdown block (xml, bash, etc.) - this must be the closing fence
      inCodeBlock = false;
      result.push(line);
    }
  }

  return result.join("\n");
}

/**
 * Remark plugin for nested code blocks.
 *
 * Note: This is now a no-op since preprocessing handles nested fences before parsing.
 * Kept for backward compatibility with the remark plugin system.
 */
const remarkNestedCodeBlocks: Plugin<[], Root> = () => {
  return () => {
    // No-op - preprocessing handles nested code blocks
  };
};

export default remarkNestedCodeBlocks;
