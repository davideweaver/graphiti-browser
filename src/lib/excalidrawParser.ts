import * as LZString from "lz-string";

/**
 * Detects if a markdown file contains Excalidraw data
 * The API strips frontmatter, so we check for other markers:
 * - The compressed-json code block
 * - The Excalidraw warning message
 * - The Text Elements heading
 */
export function isExcalidrawMarkdown(content: string): boolean {
  // Check for frontmatter first (if present)
  if (content.includes("excalidraw-plugin: parsed")) {
    return true;
  }

  // Check for compressed-json block (primary indicator)
  if (content.includes("```compressed-json")) {
    return true;
  }

  // Check for Excalidraw warning message
  if (content.includes("Switch to EXCALIDRAW VIEW")) {
    return true;
  }

  return false;
}

/**
 * Extracts and decompresses Excalidraw data from the Obsidian plugin format
 *
 * Format:
 * - YAML frontmatter with "excalidraw-plugin: parsed"
 * - Content with %% comment section
 * - Inside comment: ```compressed-json code block
 * - LZ-String compressed, then base64 encoded
 *
 * The Obsidian Excalidraw plugin uses LZ-String compression (not pako/zlib)
 */
export function parseExcalidrawMarkdown(content: string): Record<string, unknown> {
  // Extract the compressed-json code block
  const compressedJsonMatch = content.match(/```compressed-json\n([\s\S]+?)\n```/);

  if (!compressedJsonMatch) {
    throw new Error("No compressed-json block found in Excalidraw file");
  }

  // Get the compressed data (remove line breaks added for readability)
  const compressedData = compressedJsonMatch[1].replace(/\n/g, "").trim();

  try {
    // Decompress using LZ-String (the format used by Obsidian Excalidraw plugin)
    const decompressed = LZString.decompressFromBase64(compressedData);

    if (!decompressed) {
      throw new Error("Decompression returned null - invalid compressed data");
    }

    // Parse the JSON
    const parsed = JSON.parse(decompressed);

    // Validate it looks like Excalidraw data
    if (!parsed.elements && !parsed.appState && !parsed.type) {
      console.warn("Parsed data doesn't look like Excalidraw format:", parsed);
    }

    return parsed;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Failed to decompress Excalidraw data: ${errorMessage}`
    );
  }
}
