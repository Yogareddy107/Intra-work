import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  MessageSquare,
  BookOpen,
  Calendar,
  GitBranch,
  ShieldCheck,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const workspace = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "manager", "employee"],
  },
  { title: "HR & People", url: "/people", icon: Users, roles: ["super_admin", "admin"] },
  {
    title: "Tasks & Projects",
    url: "/tasks",
    icon: KanbanSquare,
    roles: ["super_admin", "manager", "employee"],
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageSquare,
    roles: ["super_admin", "admin", "manager", "employee"],
  },
  {
    title: "Knowledge Base",
    url: "/docs",
    icon: BookOpen,
    roles: ["super_admin", "manager", "employee"],
  },
  {
    title: "Meetings",
    url: "/meetings",
    icon: Calendar,
    roles: ["super_admin", "manager", "employee"],
  },
];

const tools = [
  { title: "Development", url: "/dev", icon: GitBranch, roles: ["super_admin"] },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    roles: ["super_admin", "admin", "manager"],
  },
  { title: "Documents", url: "/legal", icon: FileText, roles: ["super_admin", "admin"] },
  { title: "Security", url: "/security", icon: ShieldCheck, roles: ["super_admin"] },
];

export function AppSidebar() {
  const { roles } = useAuth();
  const role = roles[0] || "employee";

  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => (url === "/" ? path === "/" : path.startsWith(url));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5 px-2 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 border border-white/20 shadow-sm transition-all hover:scale-105">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-white">IntraWork</span>
              <span className="text-[11px] text-white/50">Intrasphere Labs</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspace
                .filter((i) => i.roles.includes(role))
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools
                .filter((i) => i.roles.includes(role))
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
