import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useGraphitiWebSocket } from "@/hooks/use-graphiti-websocket";
import { useState, useEffect } from "react";
import { PrimaryNav } from "@/components/navigation/PrimaryNav";
import { SecondaryNav } from "@/components/navigation/SecondaryNav";
import { ProjectsSecondaryNav } from "@/components/navigation/ProjectsSecondaryNav";
import { DocumentsSecondaryNav } from "@/components/navigation/DocumentsSecondaryNav";
import { MobileNavTrigger } from "@/components/navigation/MobileNavTrigger";
import { MobileNavOverlay } from "@/components/navigation/MobileNavOverlay";
import { PrimaryNavFooter } from "@/components/navigation/PrimaryNavFooter";
import { GraphManagementDialog } from "@/components/sidebar/GraphManagementDialog";
import { navigationConfig, getActivePrimary } from "@/lib/navigationConfig";
import {
  getCurrentFolderPath,
  setCurrentFolderPath as saveCurrentFolderPath,
  setLastDocumentPath,
  getLastDocumentPath,
} from "@/lib/documentsStorage";

const Layout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { connectionState, queueSize } = useGraphitiWebSocket();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [currentFolderPath, setCurrentFolderPath] = useState<string>(() =>
    getCurrentFolderPath()
  );

  const isConnected = connectionState === "connected";
  const activePrimary = getActivePrimary(pathname);

  // Get selected project from URL params
  const selectedProject = params.projectName ? decodeURIComponent(params.projectName) : null;
  const isProjectsSection = activePrimary === "projects";

  // Get current document path from URL params for Documents section
  const currentDocumentPath = params["*"] || null;
  const isDocumentsSection = activePrimary === "documents";

  // Save folder path to localStorage whenever it changes
  useEffect(() => {
    saveCurrentFolderPath(currentFolderPath);
  }, [currentFolderPath]);

  // Save current document to localStorage when viewing a document
  useEffect(() => {
    if (isDocumentsSection && currentDocumentPath) {
      setLastDocumentPath(currentDocumentPath);
    }
  }, [isDocumentsSection, currentDocumentPath]);

  // Restore last viewed document when navigating back to Documents root
  useEffect(() => {
    if (isDocumentsSection && pathname === "/documents") {
      const lastDoc = getLastDocumentPath();
      if (lastDoc) {
        navigate(`/documents/${lastDoc}`, { replace: true });
      }
    }
  }, [isDocumentsSection, pathname, navigate]);

  // Listen for folder change events from document detail page
  useEffect(() => {
    const handleFolderChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ folderPath: string }>;
      if (customEvent.detail?.folderPath) {
        setCurrentFolderPath(customEvent.detail.folderPath);
      }
    };

    window.addEventListener("documents-folder-change", handleFolderChange);
    return () => {
      window.removeEventListener("documents-folder-change", handleFolderChange);
    };
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleMobileNavigate = (path: string) => {
    navigate(path);
    setMobileNavOpen(false);
  };

  const footer = (
    <PrimaryNavFooter
      onAfterClick={() => setMobileNavOpen(false)}
      onOpenManageDialog={() => setIsManageDialogOpen(true)}
      queueSize={queueSize}
      isConnected={isConnected}
    />
  );

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        {/* Primary Navigation - 75px */}
        <PrimaryNav
          navigationConfig={navigationConfig}
          activePrimary={activePrimary}
          onNavigate={handleNavigate}
          footer={footer}
        />

        {/* Secondary Navigation - 380px */}
        {isDocumentsSection ? (
          <DocumentsSecondaryNav
            currentDocumentPath={currentDocumentPath}
            currentFolderPath={currentFolderPath}
            onFolderChange={setCurrentFolderPath}
            onNavigate={handleNavigate}
          />
        ) : isProjectsSection ? (
          <ProjectsSecondaryNav
            selectedProject={selectedProject}
            onNavigate={handleNavigate}
          />
        ) : (
          <SecondaryNav
            activePrimary={activePrimary}
            pathname={pathname}
            onNavigate={handleNavigate}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden h-screen flex flex-col">
        <MobileNavTrigger onClick={() => setMobileNavOpen(true)} />

        <MobileNavOverlay
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          activePrimary={activePrimary}
          pathname={pathname}
          navigationConfig={navigationConfig}
          onNavigate={handleNavigate}
          footer={footer}
          secondaryNav={
            isDocumentsSection ? (
              <DocumentsSecondaryNav
                currentDocumentPath={currentDocumentPath}
                currentFolderPath={currentFolderPath}
                onFolderChange={setCurrentFolderPath}
                onNavigate={handleNavigate}
                onDocumentSelect={handleMobileNavigate}
              />
            ) : isProjectsSection ? (
              <ProjectsSecondaryNav
                selectedProject={selectedProject}
                onNavigate={handleNavigate}
                onProjectSelect={handleMobileNavigate}
              />
            ) : undefined
          }
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <Toaster />

      {/* Graph Management Dialog - rendered outside sidebars */}
      <GraphManagementDialog
        open={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
      />
    </>
  );
};

export default Layout;
