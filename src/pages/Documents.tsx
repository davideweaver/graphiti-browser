import { useQuery } from "@tanstack/react-query";
import { documentsService } from "@/api/documentsService";
import Container from "@/components/container/Container";
import { Button } from "@/components/ui/button";
import { Folder, FileText, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export default function Documents() {
  return (
    <Container>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">No document selected</p>
          <p className="text-sm text-muted-foreground">
            Choose a document from the sidebar to get started
          </p>
        </div>
      </div>
    </Container>
  );
}
