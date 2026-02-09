export const DocumentFileType = {
  MARKDOWN: "markdown",
  EXCALIDRAW: "excalidraw",
  UNKNOWN: "unknown",
} as const;

export type DocumentFileType = (typeof DocumentFileType)[keyof typeof DocumentFileType];

export function getFileExtension(path: string): string {
  const lastDot = path.lastIndexOf(".");
  return lastDot === -1 ? "" : path.substring(lastDot + 1).toLowerCase();
}

export function getFileType(path: string): DocumentFileType {
  // Check for .excalidraw.md files (Obsidian Excalidraw plugin format)
  if (path.toLowerCase().endsWith(".excalidraw.md")) {
    return DocumentFileType.EXCALIDRAW;
  }

  const ext = getFileExtension(path);

  if (ext === "md" || ext === "markdown") return DocumentFileType.MARKDOWN;
  if (ext === "excalidraw") return DocumentFileType.EXCALIDRAW;

  return DocumentFileType.UNKNOWN;
}

export function isMarkdownFile(path: string): boolean {
  return getFileType(path) === DocumentFileType.MARKDOWN;
}

export function isExcalidrawFile(path: string): boolean {
  return getFileType(path) === DocumentFileType.EXCALIDRAW;
}
