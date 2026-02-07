import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/components/container/Container";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProjectSelector from "@/components/memory/ProjectSelector";
import MemoryInput from "@/components/memory/MemoryInput";
import type { SourceInfo } from "@/types/graphiti";

export default function AddMemory() {
  const { groupId } = useGraphiti();
  const navigate = useNavigate();

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sourceInfo, setSourceInfo] = useState<SourceInfo>({
    name: "Manual Entry",
    type: "text",
    metadata: {},
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return graphitiService.addContent({
        content,
        projectName: selectedProject,
        sourceName: sourceInfo.name,
        sourceType: sourceInfo.type,
        sourceMetadata: sourceInfo.metadata,
        groupId,
      });
    },
    onSuccess: (response) => {
      // Navigate to processing results page with source UUID
      navigate(`/memory/processing/${response.source_uuid}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      return;
    }
    mutation.mutate();
  };

  const handleContentChange = (newContent: string, newSource: SourceInfo) => {
    setContent(newContent);
    setSourceInfo(newSource);
  };

  return (
    <Container
      title="Add Content"
      description="Upload content to be processed and added to your memory graph"
    >
      <Card>
        <CardHeader>
          <CardTitle>Content Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="project">Project (Optional)</Label>
              <ProjectSelector
                value={selectedProject}
                onChange={setSelectedProject}
                groupId={groupId}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to assign to general memories
              </p>
            </div>

            {/* Memory Input (tabs for text/file) */}
            <div className="space-y-2">
              <Label>Content</Label>
              <MemoryInput onContentChange={handleContentChange} />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || !content.trim()}
              >
                {mutation.isPending ? "Processing..." : "Add Content"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">How it works</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Your content is processed asynchronously in the background</li>
          <li>• Facts and entities are automatically extracted</li>
          <li>• You'll see results appear in real-time as they're processed</li>
          <li>• All extracted data is linked to your source for traceability</li>
        </ul>
      </div>
    </Container>
  );
}
