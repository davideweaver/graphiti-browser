import Container from "@/components/container/Container";
import { FileText } from "lucide-react";

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
