import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  UserCheck,
  CalendarOff,
  ListChecks,
  ArrowUpRight,
  Clock,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { Video, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttendanceWidget } from "@/components/AttendanceWidget";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — IntraWork" },
      {
        name: "description",
        content: "IntraWork Dashboard — real-time company overview.",
      },
    ],
  }),
  component: DashboardRouter,
});

const toneClass: Record<string, string> = {
  todo: "bg-muted text-muted-foreground border-transparent",
  progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  review: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  done: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

function GlobalDashboard({ showAllStats = false }: { showAllStats?: boolean }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const channels = ["employees", "tasks", "meetings"].map((table) =>
      supabase
        .channel(`public:${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => {
          queryClient.invalidateQueries({ queryKey: [table] });
        })
        .subscribe(),
    );
    return () => {
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, [queryClient]);

  const totalEmployees = employees.length;
  const presentCount = employees.filter((e) => e.status === "Present").length;
  const onLeaveCount = employees.filter((e) => e.status === "On Leave").length;
  const openTasks = tasks.filter((t) => t.status !== "done").length;
  const todaysMeetings = meetings.filter(
    (m) => new Date(m.start_time).toDateString() === new Date().toDateString(),
  );

  const formatTime = (ts: string) => {
    const diffInHours = Math.floor(
      (new Date().getTime() - new Date(ts).getTime()) / (1000 * 60 * 60),
    );
    if (diffInHours < 24) return diffInHours === 0 ? "Just now" : `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <AppLayout>
      <div className="relative pb-10">
        {/* Aesthetic Background Blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <header className="relative mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck className="h-3 w-3 mr-1" /> Enterprise Workspace
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-foreground">
              {new Date().getHours() < 12
                ? "Good morning,"
                : new Date().getHours() < 18
                  ? "Good afternoon,"
                  : "Good evening,"}{" "}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">
                {user?.user_metadata?.full_name?.split(" ")[0] || "Team Member"}
              </span>
            </h1>
            <p className="text-muted-foreground mt-3 font-medium text-lg">
              Here is your operational summary for today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-2xl border-2 border-primary/20 hover:bg-primary/5 font-bold h-12 px-6 shadow-sm"
              onClick={() => navigate({ to: "/tasks" })}
            >
              Manage Projects
            </Button>
            <Button
              className="rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold h-12 px-6 shadow-glow transition-all hover:scale-105 active:scale-95"
              onClick={() => navigate({ to: "/messages" })}
            >
              <MessageSquare className="mr-2 h-5 w-5" /> Let's Chat
            </Button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {showAllStats ? (
            <>
              <StatCard
                label="The Whole Squad"
                value={totalEmployees.toString()}
                change="+2 this week"
                trend="up"
                icon={Users}
                accent="primary"
              />
              <StatCard
                label="Pulling Up"
                value={presentCount.toString()}
                change="Locked in"
                trend="up"
                icon={UserCheck}
                accent="success"
              />
              <StatCard
                label="Touching Grass"
                value={onLeaveCount.toString()}
                change="Out of office"
                trend="down"
                icon={CalendarOff}
                accent="warning"
              />
              <StatCard
                label="Active Quests"
                value={tasks.length.toString()}
                change="Main story"
                trend="up"
                icon={ListChecks}
                accent="info"
              />
            </>
          ) : (
            <>
              <StatCard
                label="My Main Quest"
                value={
                  tasks.filter((t) => t.assignees?.includes(user?.id || "")).length.toString() ||
                  "0"
                }
                change="To do"
                trend="up"
                icon={ListChecks}
                accent="primary"
              />
              <StatCard
                label="Meetings Linkup"
                value={todaysMeetings.length.toString()}
                change="Today"
                trend="up"
                icon={Calendar}
                accent="info"
              />
              <StatCard
                label="Online Friends"
                value={totalEmployees.toString()}
                change="Active now"
                trend="up"
                icon={UserCheck}
                accent="success"
              />
              <StatCard
                label="Vault Access"
                value="Secure"
                change="Guarded"
                trend="up"
                icon={ShieldCheck}
                accent="warning"
              />
            </>
          )}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-8 order-2 lg:order-1">
            <AttendanceWidget />

            <Card className="p-8 rounded-[2rem] border-none shadow-premium bg-card/50 backdrop-blur-xl relative overflow-hidden">
              <h3 className="text-2xl font-black tracking-tight mb-8">Recent Tea ☕</h3>
              <div className="space-y-8">
                {employees.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    The squad is quiet...
                  </div>
                ) : (
                  employees.slice(0, 4).map((e) => (
                    <div key={e.id} className="flex gap-5 relative group/update">
                      <div className="relative">
                        <Avatar className="h-11 w-11 ring-4 ring-background shadow-lg transition-transform group-hover/update:scale-110">
                          <AvatarImage src={e.avatar_url} />
                          <AvatarFallback className="text-xs font-black bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                            {e.initials || e.full_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">
                          <span className="font-black text-foreground">{e.full_name}</span>{" "}
                          <span className="text-muted-foreground font-medium">is active in</span>{" "}
                          <span className="font-bold text-primary">{e.department}</span>
                        </p>
                        <p className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1.5 font-black uppercase tracking-widest">
                          <Clock className="h-3 w-3" /> {formatTime(e.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                <div className="pt-8 mt-8 border-t border-muted/50">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-5">
                    Upcoming Hype
                  </h4>
                  <div className="space-y-4">
                    {todaysMeetings.slice(0, 2).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-primary/10 border-2 border-primary/5 hover:border-primary/20 transition-all cursor-pointer"
                      >
                        <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-glow">
                          <Video className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black truncate">{m.title}</p>
                          <p className="text-xs text-primary font-bold">
                            {new Date(m.start_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {todaysMeetings.length === 0 && (
                      <div className="text-center py-6 px-4 rounded-2xl bg-muted/10 border-2 border-dashed border-muted">
                        <p className="text-xs font-bold text-muted-foreground italic">
                          No linkups today. Pure focus. 🧘
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="lg:col-span-2 p-8 rounded-[2rem] border-none shadow-premium bg-card/50 backdrop-blur-xl group relative overflow-hidden order-1 lg:order-2">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Active Workstream</h3>
                <p className="text-sm text-muted-foreground mt-1 font-medium">
                  Your current grind is looking fire.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl text-primary font-bold hover:bg-primary/5"
                onClick={() => navigate({ to: "/tasks" })}
              >
                View Board <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {tasks.length === 0 && !tasksLoading ? (
                <div className="py-16 text-center text-sm text-muted-foreground bg-muted/10 rounded-[2rem] border-2 border-dashed border-primary/10">
                  <Timer className="h-12 w-12 mx-auto mb-4 opacity-10" />
                  No quests active right now. Chill vibes.
                </div>
              ) : (
                tasks.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-5 group/item p-3 rounded-2xl hover:bg-primary/5 transition-all"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-black text-sm text-primary group-hover/item:scale-110 transition-transform">
                      {t.title.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-base font-bold group-hover/item:text-primary transition-colors">
                          {t.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] h-6 px-3 rounded-full font-black uppercase border-2",
                            toneClass[t.status],
                          )}
                        >
                          {t.status}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex-1">
                          <Progress
                            value={
                              t.status === "done"
                                ? 100
                                : t.status === "review"
                                  ? 75
                                  : t.status === "progress"
                                    ? 50
                                    : 25
                            }
                            className="h-2 rounded-full"
                          />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground w-8 text-right">
                          {t.status === "done"
                            ? "100%"
                            : t.status === "review"
                              ? "75%"
                              : t.status === "progress"
                                ? "50%"
                                : "25%"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function DashboardRouter() {
  const { roles, loading } = useAuth();
  if (loading)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary/10" />
      </div>
    );

  const role = roles[0] || "employee";

  switch (role) {
    case "super_admin":
    case "admin":
    case "manager":
      return <GlobalDashboard showAllStats={true} />;
    default:
      return <GlobalDashboard showAllStats={false} />;
  }
}
