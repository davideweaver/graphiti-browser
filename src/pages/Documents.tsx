import { useQuery } from "@tanstack/react-query";
import { documentsService } from "@/api/documentsService";
import Container from "@/layout/Container";
import { Button } from "@/components/ui/button";
import { Folder, FileText, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export default function Documents() {
  const navigate = useNavigate();

  // Fetch root-level documents and folders
  const { data, isLoading } = useQuery({
    queryKey: ["documents-root"],
    queryFn: () => documentsService.getFolderStructure(undefined),
  });

  const items = data || [];
  const folders = items.filter((item) => item.type === "folder");
  const documents = items.filter((item) => item.type === "document");

  return (
    <Container
      title="Documents"
      description="Browse your Obsidian vault documents and folders"
    >
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-accent/50 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No documents found in your vault</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Folders Section */}
          {folders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Folders</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {folders.map((folder) => (
                  <Card
                    key={folder.path}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => navigate(`/documents/${folder.path}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Folder className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{folder.name}</h3>
                          {folder.documentCount !== undefined && (
                            <p className="text-sm text-muted-foreground">
                              {folder.documentCount}{" "}
                              {folder.documentCount === 1 ? "document" : "documents"}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Documents Section */}
          {documents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Recent Documents</h2>
              <div className="space-y-2">
                {documents.slice(0, 10).map((doc) => (
                  <Button
                    key={doc.path}
                    variant="ghost"
                    className="w-full justify-start h-auto py-4 px-4"
                    onClick={() => navigate(`/documents/${doc.path}`)}
                  >
                    <FileText className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-medium truncate">{doc.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(doc.modified).toLocaleString()}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
