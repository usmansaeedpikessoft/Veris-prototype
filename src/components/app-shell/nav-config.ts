import type { NavKey } from "@/lib/rbac";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  TriangleAlert,
  UserPlus,
  Bell,
  ScrollText,
  BookMarked,
  ListTree,
  UsersRound,
  Plug,
  IdCard,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: NavKey;
  label: string;
  href: string;
  icon: LucideIcon;
  group: "Operations" | "Communications" | "Governance" | "Administration" | "Me";
  module: string;
}

export const NAV_ITEMS: Record<NavKey, NavItem> = {
  dashboard: { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Operations", module: "DASH" },
  register: { key: "register", label: "Credential Register", href: "/register", icon: Users, group: "Operations", module: "REG" },
  cases: { key: "cases", label: "Case Queue", href: "/cases", icon: FolderKanban, group: "Operations", module: "REN" },
  exceptions: { key: "exceptions", label: "Exceptions", href: "/exceptions", icon: TriangleAlert, group: "Operations", module: "EXC" },
  onboarding: { key: "onboarding", label: "Onboarding", href: "/onboarding", icon: UserPlus, group: "Operations", module: "WF-B" },
  notifications: { key: "notifications", label: "Notifications", href: "/notifications", icon: Bell, group: "Communications", module: "NOT" },
  audit: { key: "audit", label: "Audit Log", href: "/audit", icon: ScrollText, group: "Governance", module: "AUD" },
  "admin-rules": { key: "admin-rules", label: "Authority Rule Sets", href: "/admin/rules", icon: BookMarked, group: "Administration", module: "ADM" },
  "admin-escalation": { key: "admin-escalation", label: "Escalation Ladder", href: "/admin/escalation", icon: ListTree, group: "Administration", module: "ADM" },
  "admin-users": { key: "admin-users", label: "Users & Roles", href: "/admin/users", icon: UsersRound, group: "Administration", module: "ADM/SEC" },
  "admin-integrations": { key: "admin-integrations", label: "Integrations", href: "/admin/integrations", icon: Plug, group: "Administration", module: "INT" },
  me: { key: "me", label: "My Credentials", href: "/me", icon: IdCard, group: "Me", module: "REG (self)" },
};

export const GROUP_ORDER: NavItem["group"][] = [
  "Operations",
  "Communications",
  "Governance",
  "Administration",
  "Me",
];
