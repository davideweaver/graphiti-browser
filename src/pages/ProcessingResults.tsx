import { useParams, Navigate } from "react-router-dom";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/layout/Container";
import ExtractionResults from "@/components/memory/ExtractionResults";

export default function ProcessingResults() {
  const { sourceUuid } = useParams<{ sourceUuid: string }>();
  const { groupId } = useGraphiti();

  if (!sourceUuid) {
    return <Navigate to="/add" replace />;
  }

  return (
    <Container
      title="Processing Content"
      description="Extraction in progress"
    >
      <ExtractionResults sourceUuid={sourceUuid} groupId={groupId} />
    </Container>
  );
}
