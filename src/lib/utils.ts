import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ParsedSourceDescription {
  app: string;
  folder: string;
  raw: string;
}

/**
 * Parse source_description field with format: "<APP>: <FOLDER>"
 * Example: "Claude Code: contactcenter"
 */
export function parseSourceDescription(
  sourceDescription: string
): ParsedSourceDescription | null {
  const regex = /^(.+?):\s*(.+?)$/i;
  const match = sourceDescription.match(regex);

  if (!match) {
    return null;
  }

  return {
    app: match[1].trim(),
    folder: match[2].trim(),
    raw: sourceDescription,
  };
}

export interface ParsedMessage {
  role: string;
  content: string;
  isUser: boolean;
}

/**
 * Parse episode content into individual messages
 * Tries to parse as JSON first (structured messages), falls back to text parsing
 */
export function parseEpisodeMessages(content: string): ParsedMessage[] {
  // Try to parse as JSON array of messages
  try {
    const parsed = JSON.parse(content);

    if (Array.isArray(parsed)) {
      return parsed.map((msg: any) => {
        const role = msg.role || msg.name || "Unknown";
        const isUser = msg.role_type === "user" || role.toLowerCase().includes("user");

        return {
          role,
          content: msg.content || "",
          isUser,
        };
      });
    }

    // If it's a single message object
    if (parsed.content) {
      const role = parsed.role || parsed.name || "Unknown";
      const isUser = parsed.role_type === "user" || role.toLowerCase().includes("user");

      return [{
        role,
        content: parsed.content,
        isUser,
      }];
    }
  } catch {
    // Not JSON, try to parse as text
  }

  // Try to detect role-based messages in plain text
  // Pattern: "Role:\ncontent" or "Role: content"
  const rolePattern = /^([A-Z][a-zA-Z\s]*?):\s*(.+?)(?=\n[A-Z][a-zA-Z\s]*?:|$)/gms;
  const matches = [...content.matchAll(rolePattern)];

  if (matches.length > 0) {
    return matches.map((match) => {
      const role = match[1].trim();
      const messageContent = match[2].trim();
      const isUser = role.toLowerCase().includes("user") ||
                     role.toLowerCase().includes("human");

      return {
        role,
        content: messageContent,
        isUser,
      };
    });
  }

  // Fallback: treat entire content as single assistant message
  return [{
    role: "Assistant",
    content: content,
    isUser: false,
  }];
}
