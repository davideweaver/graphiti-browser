import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import type { SourceInfo } from "@/types/graphiti";

interface Props {
  onContentChange: (content: string, source: SourceInfo) => void;
}

export default function MemoryInput({ onContentChange }: Props) {
  const [activeTab, setActiveTab] = useState<"text" | "file">("text");
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (value: string) => {
    setTextContent(value);
    onContentChange(value, {
      name: "Manual Entry",
      type: "text",
      metadata: {
        entry_method: "paste",
        timestamp: new Date().toISOString(),
      },
    });
  };

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validExtensions = [".txt", ".md", ".json"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      toast.error(`Invalid file type. Please upload ${validExtensions.join(", ")} files.`);
      return;
    }

    // Validate file size (max 1MB)
    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      toast.error("File too large. Maximum size is 1MB.");
      return;
    }

    try {
      // Read file content
      const content = await file.text();

      setSelectedFile(file);
      setFileContent(content);

      // Determine source type from file extension
      const sourceType = "file" as const;

      onContentChange(content, {
        name: file.name,
        type: sourceType,
        metadata: {
          original_filename: file.name,
          file_size: file.size,
          content_type: file.type || "text/plain",
          uploaded_at: new Date().toISOString(),
        },
      });

      toast.success(`File "${file.name}" loaded successfully`);
    } catch (error) {
      toast.error("Failed to read file: " + (error as Error).message);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onContentChange("", {
      name: "Manual Entry",
      type: "text",
      metadata: {},
    });
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "text" | "file")}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="text">Text</TabsTrigger>
        <TabsTrigger value="file">File Upload</TabsTrigger>
      </TabsList>

      <TabsContent value="text" className="space-y-4">
        <Textarea
          placeholder="Paste or type your content here..."
          rows={12}
          value={textContent}
          onChange={(e) => handleTextChange(e.target.value)}
          className="font-mono text-sm"
        />
        {textContent && (
          <div className="text-xs text-muted-foreground">
            {textContent.length} characters
          </div>
        )}
      </TabsContent>

      <TabsContent value="file" className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.json"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {!selectedFile ? (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary hover:bg-muted/50"
              }
            `}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Drop a file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports .txt, .md, .json files (max 1MB)
            </p>
          </div>
        ) : (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFile}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {fileContent && (
              <div className="pt-3 border-t">
                <p className="text-xs font-medium mb-2">Preview:</p>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-40">
                  {fileContent.substring(0, 500)}
                  {fileContent.length > 500 && "\n..."}
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  {fileContent.length} characters
                </p>
              </div>
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
