import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useGraphitiWebSocket } from "@/hooks/use-graphiti-websocket";
import { useState } from "react";
import { PrimaryNav } from "@/components/navigation/PrimaryNav";
import { SecondaryNav } from "@/components/navigation/SecondaryNav";
import { ProjectsSecondaryNav } from "@/components/navigation/ProjectsSecondaryNav";
import { MobileNavTrigger } from "@/components/navigation/MobileNavTrigger";
import { MobileNavOverlay } from "@/components/navigation/MobileNavOverlay";
import { PrimaryNavFooter } from "@/components/navigation/PrimaryNavFooter";
import { GraphManagementDialog } from "@/components/sidebar/GraphManagementDialog";
import { navigationConfig, getActivePrimary } from "@/lib/navigationConfig";

const Layout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { connectionState, queueSize } = useGraphitiWebSocket();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

  const isConnected = connectionState === "connected";
  const activePrimary = getActivePrimary(pathname);

  // Get selected project from URL params
  const selectedProject = params.projectName ? decodeURIComponent(params.projectName) : null;
  const isProjectsSection = activePrimary === "projects";

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
        {isProjectsSection ? (
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
            isProjectsSection ? (
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
