import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Bell,
  CheckCircle2,
  Clock,
  MessageSquare,
  Calendar,
  Briefcase,
  AlertCircle,
  MoreVertical,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — IntraWork" },
      { name: "description", content: "Stay updated with your latest activities and alerts." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`public:notifications:${user.id}`)
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

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);

    if (error) {
      toast.error("Failed to update notification");
    } else {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      toast.error("Failed to update notifications");
    } else {
      toast.success("All caught up!");
      queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case "meeting":
        return <Calendar className="h-4 w-4 text-info" />;
      case "task":
        return <Briefcase className="h-4 w-4 text-success" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Notifications"
        description="Stay updated with your latest activities, mentions, and system alerts."
        actions={
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        }
      />

      <div className="mt-6 max-w-4xl mx-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/4 bg-muted rounded" />
                    <div className="h-3 w-3/4 bg-muted rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <CheckCircle2 className="h-16 w-16 mb-4 text-success" />
            <h3 className="text-lg font-bold">You're all caught up!</h3>
            <p className="text-sm">New notifications will appear here as they arrive.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Card
                key={n.id}
                className={cn(
                  "p-4 transition-all hover:shadow-md border-l-4",
                  n.is_read
                    ? "opacity-75 border-l-transparent bg-muted/20"
                    : "border-l-primary bg-card shadow-sm",
                )}
              >
                <div className="flex gap-4">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      n.is_read ? "bg-muted" : "bg-primary/10 shadow-sm",
                    )}
                  >
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={cn(
                          "text-sm font-semibold truncate",
                          !n.is_read && "text-foreground",
                        )}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" />{" "}
                        {new Date(n.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {n.content}
                    </p>
                    {!n.is_read && (
                      <div className="mt-3 flex items-center gap-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-[10px] px-3 font-bold"
                          onClick={() => markAsRead(n.id)}
                        >
                          Mark Read
                        </Button>
                        {n.link && (
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] px-3">
                            View Details
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
