import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Search,
  Users,
  Clock,
  Plus,
  MessageSquare,
  MoreHorizontal,
  X,
  FolderKanban,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useGraphitiWebSocket } from "@/hooks/use-graphiti-websocket";
import WebSocketStatus from "@/components/layout/WebSocketStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCallback, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useGraphiti } from "@/context/GraphitiContext";

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
}

const navigationItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    title: "Projects",
    icon: FolderKanban,
    path: "/projects",
  },
  {
    title: "Search",
    icon: Search,
    path: "/search",
  },
  {
    title: "Entities",
    icon: Users,
    path: "/entities",
  },
  {
    title: "Sessions",
    icon: Clock,
    path: "/sessions",
  },
  {
    title: "Chat",
    icon: MessageSquare,
    path: "/chat",
  },
  {
    title: "Add Memory",
    icon: Plus,
    path: "/add",
  },
];

const Layout = () => {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { baseUrl, groupId } = useGraphiti();
  const { connectionState, queueSize } = useGraphitiWebSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mobile navigation items - just the most important ones for bottom bar
  const mobileNavItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/",
    },
    {
      title: "Search",
      icon: Search,
      path: "/search",
    },
    {
      title: "Chat",
      icon: MessageSquare,
      path: "/chat",
    },
  ];

  const renderSidebarContent = useCallback(
    () => (
      <div className="h-full flex flex-col p-6 pb-4">
        <SidebarHeader>
          <div className="pt-5 pb-2">
            <h1 className="text-2xl font-bold">Graphiti Browser</h1>
            <p className="text-sm text-muted-foreground">Memory Explorer</p>
          </div>
        </SidebarHeader>

        <SidebarContent className="mt-4">
          <SidebarMenu>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    isActive={isActive}
                    className={isActive ? "sidebar-active-item" : ""}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <WebSocketStatus connectionState={connectionState} queueSize={queueSize} />
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-start gap-1">
                <span className="font-medium">Server:</span>
                <span className="break-all">{baseUrl}</span>
              </div>
              <div className="flex items-start gap-1">
                <span className="font-medium">Group:</span>
                <span className="break-all">{groupId}</span>
              </div>
            </div>
          </div>
        </SidebarFooter>
      </div>
    ),
    [pathname, connectionState, queueSize, navigate, baseUrl, groupId]
  );

  return (
    <SidebarProvider>
      <div className="flex w-full overflow-x-clip">
        {/* Standard sidebar for desktop */}
        <Sidebar>{renderSidebarContent()}</Sidebar>

        <SidebarInset>
          <div
            className="bg-background"
            style={{
              minHeight: "100vh",
              width: isMobile ? "100vw" : "100%",
            }}
          >
            <Outlet />
          </div>
        </SidebarInset>

        {/* Mobile bottom navigation bar */}
        {isMobile && (
          <>
            {mobileMenuOpen && (
              <div className="fixed bottom-16 left-0 right-0 top-0 bg-background z-50">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute top-6 right-4 w-10 h-10"
                >
                  <X className="h-8 w-8" />
                </button>
                <div className="w-full h-full -ml-2 -mr-10">
                  {renderSidebarContent()}
                </div>
              </div>
            )}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-gray-200 dark:border-gray-800 z-50">
              <div className="flex items-center justify-around h-16">
                {mobileNavItems.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(item.path);
                    }}
                    className={`flex flex-col items-center justify-center w-1/4 ${
                      mobileMenuOpen
                        ? "text-neutral-700"
                        : item.path === pathname
                        ? "text-neutral-300"
                        : "text-neutral-500"
                    }`}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs mt-1">{item.title}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`flex flex-col items-center justify-center w-1/4 h-full ${
                    mobileMenuOpen ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  <MoreHorizontal className="h-6 w-6" />
                  <span className="text-xs mt-1">More</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <Toaster />
    </SidebarProvider>
  );
};

export default Layout;
