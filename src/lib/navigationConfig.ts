import {
  LayoutDashboard,
  FolderKanban,
  Brain,
  Search,
  MessageSquare,
  Users,
  Clock,
  Plus
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SecondaryNavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

export interface PrimaryNavItem {
  key: string;
  icon: LucideIcon;
  label: string;
  defaultPath: string;
  secondaryItems: SecondaryNavItem[];
}

export const navigationConfig: PrimaryNavItem[] = [
  {
    key: 'dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    defaultPath: '/',
    secondaryItems: []
  },
  {
    key: 'projects',
    icon: FolderKanban,
    label: 'Projects',
    defaultPath: '/projects',
    secondaryItems: []
  },
  {
    key: 'memory',
    icon: Brain,
    label: 'Memory',
    defaultPath: '/search',
    secondaryItems: [
      { path: '/search', icon: Search, label: 'Search' },
      { path: '/chat', icon: MessageSquare, label: 'Chat' },
      { path: '/entities', icon: Users, label: 'Entities' },
      { path: '/sessions', icon: Clock, label: 'Sessions' },
      { path: '/add', icon: Plus, label: 'Add Memory' }
    ]
  }
];

export function getActivePrimary(pathname: string): string | null {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/projects') || pathname.startsWith('/project/')) return 'projects';
  if (
    pathname.startsWith('/search') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/entities') ||
    pathname.startsWith('/entity/') ||
    pathname.startsWith('/sessions') ||
    pathname.startsWith('/add') ||
    pathname.startsWith('/facts/')
  ) {
    return 'memory';
  }
  return null;
}

export function getActivePrimaryConfig(pathname: string): PrimaryNavItem | null {
  const activePrimary = getActivePrimary(pathname);
  if (!activePrimary) return null;
  return navigationConfig.find(item => item.key === activePrimary) || null;
}
