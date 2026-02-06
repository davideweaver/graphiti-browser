import {
  LayoutDashboard,
  FolderKanban,
  Brain,
  Search,
  MessageSquare,
  Users,
  Clock,
  Plus,
  FileText
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
    key: 'documents',
    icon: FileText,
    label: 'Documents',
    defaultPath: '/documents',
    secondaryItems: []
  },
  {
    key: 'memory',
    icon: Brain,
    label: 'Memory',
    defaultPath: '/memory/search',
    secondaryItems: [
      { path: '/memory/search', icon: Search, label: 'Search' },
      { path: '/memory/chat', icon: MessageSquare, label: 'Chat' },
      { path: '/memory/entities', icon: Users, label: 'Entities' },
      { path: '/memory/sessions', icon: Clock, label: 'Sessions' },
      { path: '/memory/add', icon: Plus, label: 'Add Memory' }
    ]
  }
];

export function getActivePrimary(pathname: string): string | null {
  if (pathname === '/') return 'dashboard';
  // Project routes - including project-specific sessions
  if (pathname.startsWith('/projects') || pathname.startsWith('/project/')) return 'projects';
  if (pathname.startsWith('/documents')) return 'documents';
  // Memory routes
  if (pathname.startsWith('/memory')) return 'memory';
  return null;
}

export function getActivePrimaryConfig(pathname: string): PrimaryNavItem | null {
  const activePrimary = getActivePrimary(pathname);
  if (!activePrimary) return null;
  return navigationConfig.find(item => item.key === activePrimary) || null;
}
