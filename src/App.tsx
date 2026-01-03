import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GraphitiProvider } from "@/context/GraphitiContext";
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
    <QueryClientProvider client={queryClient}>
      <GraphitiProvider>
        <RouterProvider
          router={Router}
          future={{ v7_startTransition: true }}
        />
      </GraphitiProvider>
    </QueryClientProvider>
  );
}

export default App;
