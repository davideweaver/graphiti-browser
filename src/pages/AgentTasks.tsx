import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AgentTasks() {
  const navigate = useNavigate();

  // Redirect to task history page
  useEffect(() => {
    navigate("/agent-tasks/history", { replace: true });
  }, [navigate]);

  return null;
}
