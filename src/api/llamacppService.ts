import { toast } from "sonner";
import type { LlamaCppRequest, LlamaCppStreamChunk } from "@/types/chat";

const BASE_URL = "/llamacpp";
const TIMEOUT_MS = 120000; // 2 minutes

class LlamaCppService {
  private baseUrl: string;

  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Health check
  async healthcheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Streaming chat completion
  async sendMessageStream(
    messages: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "default",
          messages,
          stream: true,
          max_tokens: 1500,
        } as LlamaCppRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              onComplete();
              return;
            }

            try {
              const chunk: LlamaCppStreamChunk = JSON.parse(data);
              const content = chunk.choices[0]?.delta?.content;

              if (content) {
                onChunk(content);
              }
            } catch (err) {
              console.warn("Failed to parse SSE chunk:", err);
            }
          }
        }
      }
    } catch (error) {
      console.error("LlamaCpp streaming error:", error);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          toast.error("Request timed out after 30 seconds");
        } else {
          toast.error(`Chat error: ${error.message}`);
        }
        onError(error);
      }
    }
  }
}

export const llamacppService = new LlamaCppService();
export default llamacppService;
