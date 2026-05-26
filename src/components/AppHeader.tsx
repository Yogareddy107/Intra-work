import { Bell, Search, Moon, Sun, Check, Clock, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const [dark, setDark] = useState(false);
  const { profile, user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Fetch Notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`public:notifications:header:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel = roles.includes("super_admin")
    ? "Super Admin"
    : roles.includes("admin")
      ? "Admin"
      : roles.includes("manager")
        ? "Manager"
        : "Employee";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger />
      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search people, projects, docs…"
          className="h-9 pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center bg-primary text-primary-foreground">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between p-4 pb-2">
              <DropdownMenuLabel className="p-0 font-bold">Recent Notifications</DropdownMenuLabel>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] px-2"
                onClick={() => navigate({ to: "/notifications" })}
              >
                View All
              </Button>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 opacity-40">
                  <BellOff className="h-8 w-8 mb-2" />
                  <p className="text-xs">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className={cn(
                      "flex flex-col items-start gap-1 p-4 cursor-pointer",
                      !n.is_read && "bg-primary/5",
                    )}
                    onClick={() => navigate({ to: "/notifications" })}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-xs font-bold truncate",
                          !n.is_read ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {n.title}
                      </span>
                      {!n.is_read && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                    <span className="text-[11px] text-muted-foreground line-clamp-2">
                      {n.content}
                    </span>
                    <span className="text-[9px] text-muted-foreground/60 flex items-center gap-1 mt-1">
                      <Clock className="h-2.5 w-2.5" />{" "}
                      {new Date(n.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              className="w-full h-10 text-xs rounded-none font-bold"
              onClick={() => navigate({ to: "/notifications" })}
            >
              Open Notification Center
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-muted transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">
                  {initials || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <div className="text-xs font-semibold leading-tight">{displayName}</div>
                <div className="text-[11px] text-muted-foreground leading-tight">{roleLabel}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={async () => {
                await signOut();
                navigate({ to: "/login" });
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
