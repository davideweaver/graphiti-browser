import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/layout/Container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Projects() {
  const { groupId } = useGraphiti();
  const navigate = useNavigate();

  // Fetch first project to redirect to
  const { data, isLoading } = useQuery({
    queryKey: ["projects-redirect", groupId],
    queryFn: async () => {
      return await graphitiService.listProjects(groupId, 1, undefined, undefined, undefined, "desc");
    },
    select: (data) => ({
      ...data,
      // Filter out '_general' project from list
      projects: data.projects.filter((p) => p.name !== "_general"),
    }),
  });

  // Redirect to first project when data loads
  useEffect(() => {
    if (data && data.projects.length > 0) {
      navigate(`/project/${encodeURIComponent(data.projects[0].name)}`, { replace: true });
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

  if (!data || data.projects.length === 0) {
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
