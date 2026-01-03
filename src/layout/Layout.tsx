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
  Settings,
  MessageSquare,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useGraphitiWebSocket } from "@/hooks/use-graphiti-websocket";
import WebSocketStatus from "@/components/layout/WebSocketStatus";
// import { useIsMobile } from "@/hooks/use-mobile";

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
  // const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { connectionState, queueSize } = useGraphitiWebSocket();

  return (
    <SidebarProvider>
      <div className="flex w-full overflow-x-clip">
        <Sidebar>
          <div className="h-full flex flex-col p-6">
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
                        onClick={() => navigate(item.path)}
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
              <div className="flex items-center justify-between gap-2">
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <WebSocketStatus connectionState={connectionState} queueSize={queueSize} />
              </div>
            </SidebarFooter>
          </div>
        </Sidebar>

        <SidebarInset>
          <div
            className="bg-background"
            style={{ minHeight: "100vh", width: "100%" }}
          >
            <Outlet />
          </div>
        </SidebarInset>

        {/* Mobile bottom nav could be added here later */}
      </div>
      <Toaster />
    </SidebarProvider>
  );
};

export default Layout;
