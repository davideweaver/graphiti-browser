import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useGraphitiWebSocket } from "@/hooks/use-graphiti-websocket";
import { useState, useEffect, useRef } from "react";
import { PrimaryNav } from "@/components/navigation/PrimaryNav";
import { SecondaryNav } from "@/components/navigation/SecondaryNav";
import { ProjectsSecondaryNav } from "@/components/navigation/ProjectsSecondaryNav";
import { DocumentsSecondaryNav } from "@/components/navigation/DocumentsSecondaryNav";
import { AgentTasksSecondaryNav } from "@/components/navigation/AgentTasksSecondaryNav";
import { MobileNavTrigger } from "@/components/navigation/MobileNavTrigger";
import { DraggableMobileNav } from "@/components/navigation/DraggableMobileNav";
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

  // Track drag state for opening nav from edge
  const [dragOpenProgress, setDragOpenProgress] = useState(0);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isDraggingOpenRef = useRef(false);
  const hasCheckedDirectionRef = useRef(false);

  // Handle edge drag to open
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.innerWidth >= 768) return; // Desktop only
      if (mobileNavOpen) return; // Already open

      const touch = e.touches[0];
      if (touch.pageX <= 50) { // Within edge threshold
        touchStartXRef.current = touch.pageX;
        touchStartYRef.current = touch.pageY;
        isDraggingOpenRef.current = true;
        hasCheckedDirectionRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingOpenRef.current) return;

      const touch = e.touches[0];
      const deltaX = touch.pageX - touchStartXRef.current;
      const deltaY = touch.pageY - touchStartYRef.current;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Check direction on first significant movement
      if (!hasCheckedDirectionRef.current && (absDeltaX > 5 || absDeltaY > 5)) {
        hasCheckedDirectionRef.current = true;
        // If more vertical than horizontal, cancel the drag
        if (absDeltaY > absDeltaX) {
          isDraggingOpenRef.current = false;
          setDragOpenProgress(0);
          return;
        }
      }

      if (deltaX > 0) { // Only track rightward movement
        const progress = Math.min(deltaX / window.innerWidth, 1);
        setDragOpenProgress(progress);

        // Prevent scrolling during horizontal drag
        if (absDeltaX > absDeltaY && deltaX > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isDraggingOpenRef.current) return;

      console.log('Drag-to-open ended - progress:', dragOpenProgress);

      // If dragged more than 40% of screen width, open the nav
      if (dragOpenProgress > 0.4) {
        console.log('Opening nav');
        setMobileNavOpen(true);
        setDragOpenProgress(0); // Clear immediately so it doesn't show during open animation
      } else {
        console.log('Not opening - animating closed');
        // Animate closed over 300ms
        const startProgress = dragOpenProgress;
        const startTime = Date.now();
        const duration = 300;

        const animateClose = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          const currentProgress = startProgress * (1 - easedProgress);

          setDragOpenProgress(currentProgress);

          if (progress < 1) {
            requestAnimationFrame(animateClose);
          } else {
            setDragOpenProgress(0);
          }
        };

        requestAnimationFrame(animateClose);
      }

      // Reset
      isDraggingOpenRef.current = false;
      hasCheckedDirectionRef.current = false;
      touchStartXRef.current = 0;
      touchStartYRef.current = 0;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [mobileNavOpen, dragOpenProgress]);

  // iOS Safari: prevent back/forward navigation gesture near screen edges
  // Must be on document level to intercept before browser claims the gesture
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only on mobile
      if (window.innerWidth >= 768) return;
      const touch = e.touches[0];
      // Block browser gesture when touch starts within 20px of either edge
      if (touch.pageX <= 20 || touch.pageX >= window.innerWidth - 20) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    return () => document.removeEventListener("touchstart", handleTouchStart);
  }, []);

  // Get selected project from URL params
  const selectedProject = params.projectName ? decodeURIComponent(params.projectName) : null;
  const isProjectsSection = activePrimary === "projects";

  // Get current document path from URL params for Documents section
  const currentDocumentPath = params["*"] || null;
  const isDocumentsSection = activePrimary === "documents";

  // Get selected task ID from URL params for Agent Tasks section
  const selectedTaskId = params.id || null;
  const isAgentTasksSection = activePrimary === "agent-tasks";

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
        ) : isAgentTasksSection ? (
          <AgentTasksSecondaryNav
            selectedTaskId={selectedTaskId}
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

        {/* Drag-to-open preview */}
        {dragOpenProgress > 0 && !mobileNavOpen && (
          <div
            className="fixed inset-y-0 left-0 z-40 w-full bg-background shadow-lg pointer-events-none overflow-hidden"
            style={{
              transform: `translateX(${-100 + dragOpenProgress * 100}%)`,
              transition: "none",
            }}
          >
            <div className="flex h-full opacity-50">
              <PrimaryNav
                navigationConfig={navigationConfig}
                activePrimary={activePrimary}
                onNavigate={() => {}}
                footer={footer}
              />
              {isDocumentsSection ? (
                <DocumentsSecondaryNav
                  currentDocumentPath={currentDocumentPath}
                  currentFolderPath={currentFolderPath}
                  onFolderChange={setCurrentFolderPath}
                  onNavigate={() => {}}
                />
              ) : isProjectsSection ? (
                <ProjectsSecondaryNav
                  selectedProject={selectedProject}
                  onNavigate={() => {}}
                />
              ) : isAgentTasksSection ? (
                <AgentTasksSecondaryNav
                  selectedTaskId={selectedTaskId}
                  onNavigate={() => {}}
                />
              ) : (
                <SecondaryNav
                  activePrimary={activePrimary}
                  pathname={pathname}
                  onNavigate={() => {}}
                />
              )}
            </div>
          </div>
        )}

        <DraggableMobileNav
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
            ) : isAgentTasksSection ? (
              <AgentTasksSecondaryNav
                selectedTaskId={selectedTaskId}
                onNavigate={handleNavigate}
                onTaskSelect={handleMobileNavigate}
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
