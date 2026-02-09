import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { isExcalidrawMarkdown, parseExcalidrawMarkdown } from "@/lib/excalidrawParser";

interface ExcalidrawViewerProps {
  content: string;
  onError?: (error: Error) => void;
}

export function ExcalidrawViewer({ content, onError }: ExcalidrawViewerProps) {
  const [initialData, setInitialData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const keyRef = useRef(0);

  useEffect(() => {
    // Increment key to force Excalidraw to re-mount with new data
    keyRef.current += 1;

    try {
      let parsed;

      // Check if this is an Obsidian Excalidraw markdown file
      if (isExcalidrawMarkdown(content)) {
        parsed = parseExcalidrawMarkdown(content);
      } else {
        // Try parsing as direct JSON (for .excalidraw files)
        parsed = JSON.parse(content);
      }

      setInitialData(parsed);
      setError(null);
    } catch (err) {
      const error = err instanceof Error
        ? err
        : new Error("Failed to parse Excalidraw data");
      setError(error);
      onError?.(error);
    }
  }, [content, onError]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 border border-destructive rounded-lg">
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-lg font-semibold mb-2">Invalid Excalidraw File</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-280px)] min-h-[500px] border rounded-lg overflow-hidden">
      <Excalidraw
        key={keyRef.current} // Force re-mount when content changes
        initialData={initialData}
        viewModeEnabled={true}
        zenModeEnabled={false}
        gridModeEnabled={false}
      />
    </div>
  );
}
