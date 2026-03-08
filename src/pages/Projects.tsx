import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { xerroProjectsService } from "@/api/xerroProjectsService";
import Container from "@/components/container/Container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Projects() {
  const navigate = useNavigate();

  // Fetch first project to redirect to
  const { data, isLoading } = useQuery({
    queryKey: ["projects-redirect"],
    queryFn: () => xerroProjectsService.listProjects({ limit: 1 }),
  });

  // Redirect to first project when data loads
  useEffect(() => {
    if (data && data.items?.length > 0) {
      navigate(`/project/${encodeURIComponent(data.items[0].name)}`, { replace: true });
    }
  }, [data, navigate]);

  if (isLoading) {
    return (
      <Container title="Projects" description="Loading projects...">
        <div className="flex items-center justify-center h-64">
          <Skeleton className="h-8 w-32" />
        </div>
      </Container>
    );
  }

  if (!data || (data.items?.length ?? 0) === 0) {
    return (
      <Container title="Projects" description="No projects found">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            No projects available. Create some memories to get started.
          </p>
        </div>
      </Container>
    );
  }

  return null;
}
