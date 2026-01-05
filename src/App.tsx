import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GraphitiProvider } from "@/context/GraphitiContext";
import { DashboardProvider } from "@/context/DashboardContext";
import { ThemeProvider } from "@/components/theme-provider";
import Router from "@/layout/Router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <GraphitiProvider>
          <DashboardProvider>
            <RouterProvider
              router={Router}
              future={{ v7_startTransition: true }}
            />
          </DashboardProvider>
        </GraphitiProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
