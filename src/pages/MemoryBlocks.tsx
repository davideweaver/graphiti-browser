import Container from "@/components/container/Container";
import { BookMarked } from "lucide-react";

export default function MemoryBlocks() {
  return (
    <Container>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <BookMarked className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">No block selected</p>
          <p className="text-sm text-muted-foreground">
            Choose a memory block from the sidebar to get started
          </p>
        </div>
      </div>
    </Container>
  );
}
