import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";
import lazyImportComponent from "@/lib/lazyImportComponent";
import Layout from "./Layout";

const Router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route
        index
        lazy={lazyImportComponent(() => import("@/pages/Dashboard"))}
      />
      <Route
        path="/search"
        lazy={lazyImportComponent(() => import("@/pages/Search"))}
      />
      <Route
        path="/facts/:uuid"
        lazy={lazyImportComponent(() => import("@/pages/FactDetail"))}
      />
      <Route
        path="/entities"
        lazy={lazyImportComponent(() => import("@/pages/Entities"))}
      />
      <Route
        path="/entities/:type"
        lazy={lazyImportComponent(() => import("@/pages/Entities"))}
      />
      <Route
        path="/entity/:uuid"
        lazy={lazyImportComponent(() => import("@/pages/EntityDetail"))}
      />
      <Route
        path="/projects"
        lazy={lazyImportComponent(() => import("@/pages/Projects"))}
      />
      <Route
        path="/project/:projectName"
        lazy={lazyImportComponent(() => import("@/pages/ProjectDetail"))}
      />
      <Route
        path="/sessions"
        lazy={lazyImportComponent(() => import("@/pages/Sessions"))}
      />
      <Route
        path="/sessions/:sessionId"
        lazy={lazyImportComponent(() => import("@/pages/SessionDetail"))}
      />
      <Route
        path="/add"
        lazy={lazyImportComponent(() => import("@/pages/AddMemory"))}
      />
      <Route
        path="/processing/:sourceUuid"
        lazy={lazyImportComponent(() => import("@/pages/ProcessingResults"))}
      />
      <Route
        path="/chat"
        lazy={lazyImportComponent(() => import("@/pages/Chat"))}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
    },
  }
);

export default Router;
