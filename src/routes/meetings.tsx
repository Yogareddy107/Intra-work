import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar as CalendarIcon,
  Video,
  Plus,
  Clock,
  Users,
  Loader2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meetings — IntraWork" },
      { name: "description", content: "Schedule meetings and manage your team calendar." },
    ],
  }),
  component: Meetings,
});

const colorMap: Record<string, string> = {
  primary: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  info: "bg-indigo-500/20 border-indigo-500/30 text-indigo-400",
  success: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
  warning: "bg-amber-500/20 border-amber-500/30 text-amber-400",
};

const indicatorMap: Record<string, string> = {
  primary: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
  info: "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]",
  success: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
  warning: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
};

function Meetings() {
  const queryClient = useQueryClient();
  const today = new Date();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30 min");
  const [room, setRoom] = useState("Google Meet");
  const [meetingLink, setMeetingLink] = useState("https://meet.google.com/abc-defg-hij");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

  const days = Array.from({ length: 35 }, (_, i) => {
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;
    return i - startingDayOfWeek + 1;
  });

  const { data: meetings = [], isLoading } = useQuery({
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

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("id, full_name, avatar_url");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const channel = supabase
      .channel("public:meetings")
      .on("postgres_changes", { event: "*", schema: "public", table: "meetings" }, () => {
        queryClient.invalidateQueries({ queryKey: ["meetings"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    const startTime = new Date(`${date}T${time}:00`).toISOString();

    const { error } = await supabase.from("meetings").insert({
      title,
      start_time: startTime,
      duration,
      room,
      meeting_link: meetingLink,
      attendees: selectedAttendees.length > 0 ? selectedAttendees : ["You"],
      color: ["primary", "info", "success", "warning"][Math.floor(Math.random() * 4)],
    });

    if (error) {
      toast.error("Failed to schedule meeting", { description: error.message });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["meetings"] });
    toast.success("Meeting scheduled successfully!");
    setTitle("");
    setDate("");
    setTime("");
    setDuration("30 min");
    setRoom("Google Meet");
    setIsDialogOpen(false);
  };

  const todaysMeetings = meetings.filter((m) => {
    const meetingDate = new Date(m.start_time);
    return (
      meetingDate.getDate() === today.getDate() &&
      meetingDate.getMonth() === today.getMonth() &&
      meetingDate.getFullYear() === today.getFullYear()
    );
  });

  const meetingDays = new Set(
    meetings.map((m) => {
      const meetingDate = new Date(m.start_time);
      if (
        meetingDate.getMonth() === today.getMonth() &&
        meetingDate.getFullYear() === today.getFullYear()
      ) {
        return meetingDate.getDate();
      }
      return -1;
    }),
  );

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  return (
    <AppLayout>
      <div className="relative pb-10">
        {/* Aesthetic Background Blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <header className="relative mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                <CalendarIcon className="h-3 w-3 mr-1" /> Team Linkups
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-foreground">
              Meetings & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">
                Squad Calendar. 📅
              </span>
            </h1>
            <p className="text-muted-foreground mt-3 font-medium text-lg">
              Manage your team's schedule and hop on calls with ease.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-2xl border-2 border-primary/20 hover:bg-primary/5 font-bold h-12 px-6 shadow-sm hidden md:flex"
            >
              View Analytics
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold h-12 px-6 shadow-glow transition-all hover:scale-105 active:scale-95">
                  <Plus className="mr-2 h-5 w-5" /> New Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px] rounded-[2rem] border-none shadow-premium bg-card/95 backdrop-blur-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight">
                    Schedule a Linkup
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleScheduleMeeting} className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="title"
                      className="text-xs font-black uppercase tracking-widest text-muted-foreground"
                    >
                      Meeting Title
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="E.g. Strategy Seshing"
                      className="h-12 rounded-2xl bg-muted/30 border-transparent focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="date"
                        className="text-xs font-black uppercase tracking-widest text-muted-foreground"
                      >
                        Date
                      </Label>
                      <Input
                        type="date"
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="h-12 rounded-2xl bg-muted/30 border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="time"
                        className="text-xs font-black uppercase tracking-widest text-muted-foreground"
                      >
                        Time
                      </Label>
                      <Input
                        type="time"
                        id="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                        className="h-12 rounded-2xl bg-muted/30 border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="duration"
                        className="text-xs font-black uppercase tracking-widest text-muted-foreground"
                      >
                        Duration
                      </Label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-transparent">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-xl">
                          {["15 min", "30 min", "45 min", "1 hour", "2 hours"].map((d) => (
                            <SelectItem key={d} value={d} className="rounded-xl">
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="room"
                        className="text-xs font-black uppercase tracking-widest text-muted-foreground"
                      >
                        Room / Location
                      </Label>
                      <Input
                        id="room"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        required
                        className="h-12 rounded-2xl bg-muted/30 border-transparent"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="meetingLink"
                      className="text-xs font-black uppercase tracking-widest text-muted-foreground"
                    >
                      Meeting Link
                    </Label>
                    <div className="relative">
                      <Video className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <Input
                        id="meetingLink"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        className="pl-11 h-12 rounded-2xl bg-muted/30 border-transparent"
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setIsDialogOpen(false)}
                      className="rounded-xl font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!title || !date || !time}
                      className="rounded-xl bg-gradient-primary font-black px-6 shadow-glow"
                    >
                      Schedule Now
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-12">
          <Card className="lg:col-span-8 p-8 rounded-[2rem] border-none shadow-premium bg-card/50 backdrop-blur-xl overflow-hidden relative group">
            <div></div>

            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <h3 className="text-2xl font-black tracking-tight">
                  {today.toLocaleString("en-US", { month: "long", year: "numeric" })}
                </h3>
                <div className="flex items-center bg-primary/5 rounded-2xl p-1.5 border border-primary/10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 bg-primary/5 rounded-2xl p-1.5 border border-primary/10 font-black text-[10px] uppercase tracking-widest">
                {["Day", "Week", "Month"].map((v) => (
                  <Button
                    key={v}
                    variant={v === "Month" ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 px-5 rounded-xl transition-all",
                      v === "Month"
                        ? "bg-white text-black shadow-sm"
                        : "text-muted-foreground hover:text-primary",
                    )}
                  >
                    {v}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7 border-t border-l border-primary/10 rounded-3xl overflow-hidden shadow-sm">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div
                  key={d}
                  className="py-4 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 bg-primary/5 border-r border-b border-primary/10 text-center"
                >
                  {d}
                </div>
              ))}
              {days.map((d, index) => {
                const isToday = d === today.getDate();
                const hasEvent = meetingDays.has(d);
                const valid = d > 0 && d <= daysInMonth;
                return (
                  <div
                    key={`day-${index}`}
                    className={cn(
                      "relative min-h-[120px] p-3 border-r border-b border-primary/10 transition-all group/day",
                      !valid ? "bg-muted/5" : "hover:bg-primary/[0.02] cursor-pointer",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-black transition-all group-hover/day:scale-110",
                        isToday ? "bg-primary text-white shadow-glow" : "text-foreground/70",
                      )}
                    >
                      {valid ? d : ""}
                    </span>

                    {hasEvent && valid && (
                      <div className="mt-3 space-y-2">
                        {meetings
                          .filter((m) => {
                            const mDate = new Date(m.start_time);
                            return mDate.getDate() === d && mDate.getMonth() === today.getMonth();
                          })
                          .slice(0, 2)
                          .map((m) => (
                            <div
                              key={m.id}
                              className={cn(
                                "text-[9px] font-black px-2.5 py-1.5 rounded-xl border-2 transition-all hover:scale-105 truncate",
                                colorMap[m.color] || colorMap.primary,
                              )}
                            >
                              {m.title}
                            </div>
                          ))}
                        {meetings.filter((m) => new Date(m.start_time).getDate() === d).length >
                          2 && (
                          <div className="text-[10px] text-primary/60 px-2.5 font-black uppercase tracking-widest">
                            + more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="lg:col-span-4 p-0 overflow-hidden border-none shadow-premium bg-card/50 backdrop-blur-xl relative">
            <div></div>

            <div className="p-8 border-b border-primary/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl font-black tracking-tight">Timeline</h3>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                  Live Now
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                You have{" "}
                <span className="text-primary font-bold">{todaysMeetings.length} sessions</span> for
                today.
              </p>
            </div>

            <div className="p-8 overflow-y-auto max-h-[600px] relative scrollbar-none">
              {/* Timeline Line */}
              <div className="absolute left-[51px] top-8 bottom-8 w-1 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 rounded-full" />

              <div className="space-y-10 relative">
                {todaysMeetings.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 text-center group">
                    <div className="h-24 w-24 rounded-[2rem] bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Clock className="h-10 w-10 text-primary opacity-20" />
                    </div>
                    <p className="text-lg font-black tracking-tight">Main Story Clear</p>
                    <p className="text-sm text-muted-foreground mt-1 font-medium italic">
                      Enjoy your focus time! 🧘
                    </p>
                  </div>
                ) : (
                  todaysMeetings.map((m) => (
                    <div key={m.id} className="flex gap-6 group/item">
                      <div className="text-[11px] font-black w-12 pt-1.5 text-right text-muted-foreground whitespace-nowrap uppercase tracking-tighter">
                        {formatTime(m.start_time).split(" ")[0]}
                        <span className="block opacity-40 font-black text-[9px]">
                          {formatTime(m.start_time).split(" ")[1]}
                        </span>
                      </div>

                      <div className="relative pt-2">
                        <div
                          className={cn(
                            "h-5 w-5 rounded-full border-[3px] border-card ring-2 ring-primary/10 z-10 relative transition-all group-hover/item:scale-150 group-hover/item:shadow-glow",
                            indicatorMap[m.color] || indicatorMap.primary,
                          )}
                        />
                      </div>

                      <div className="flex-1 space-y-3 pb-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-black tracking-tight group-hover/item:text-primary transition-colors">
                            {m.title}
                          </h4>
                          <div className="flex -space-x-2">
                            {m.attendees?.slice(0, 3).map((a: string, i: number) => (
                              <Avatar
                                key={`${m.id}-att-${i}`}
                                className="h-7 w-7 border-2 border-card ring-1 ring-primary/10 transition-transform hover:z-20 hover:scale-110"
                              >
                                <AvatarFallback className="text-[9px] font-black bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                                  {a[0]}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-primary" /> {m.duration}
                          </span>
                          <span className="flex items-center gap-1.5 truncate max-w-[120px]">
                            <MapPin className="h-3.5 w-3.5 text-primary" /> {m.room}
                          </span>
                        </div>

                        <div className="pt-2">
                          {m.meeting_link ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-10 w-full rounded-2xl text-xs font-black bg-primary/5 hover:bg-primary hover:text-white border-2 border-primary/10 transition-all shadow-sm active:scale-95"
                              onClick={() => window.open(m.meeting_link, "_blank")}
                            >
                              <Video className="mr-2 h-4 w-4" /> Hop In Now
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-10 w-full rounded-2xl text-xs font-bold opacity-40 border-2"
                              disabled
                            >
                              Internal Sync Only
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 bg-primary/5 border-t border-primary/10 flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-xl"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Event
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
