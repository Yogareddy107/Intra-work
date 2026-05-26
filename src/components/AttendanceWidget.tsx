import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, Clock, Timer, CheckCircle2, Coffee } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AttendanceWidget() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: activeLog, isLoading } = useQuery({
    queryKey: ["active-attendance", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("user_id", user!.id)
        .is("check_out", null)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const handleCheckIn = async () => {
    if (!user) return;

    const { error } = await supabase.from("attendance_logs").insert({
      user_id: user.id,
      status: "active",
    });

    if (error) {
      toast.error("Check-in failed", { description: error.message });
    } else {
      toast.success("Checked in successfully! Have a great day.");
      queryClient.invalidateQueries({ queryKey: ["active-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    }
  };

  const handleCheckOut = async () => {
    if (!user || !activeLog) return;

    const { error } = await supabase
      .from("attendance_logs")
      .update({
        check_out: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", activeLog.id);

    if (error) {
      toast.error("Check-out failed", { description: error.message });
    } else {
      toast.success("Checked out successfully! See you tomorrow.");
      queryClient.invalidateQueries({ queryKey: ["active-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    }
  };

  const formatElapsedTime = () => {
    if (!activeLog) return "00:00:00";
    const start = new Date(activeLog.check_in).getTime();
    const now = currentTime.getTime();
    const diff = Math.max(0, now - start);

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (isLoading) return null;

  return (
    <Card className="p-6 rounded-[2rem] border-none shadow-premium bg-card/50 backdrop-blur-xl overflow-hidden relative group transition-all hover:shadow-glow">
      <div className="flex flex-col h-full justify-between gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-2xl flex items-center justify-center transition-all",
                activeLog
                  ? "bg-success/20 text-success animate-pulse"
                  : "bg-primary/10 text-primary",
              )}
            >
              {activeLog ? <Timer className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {activeLog ? "On the Clock" : "Ready for Work?"}
              </h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                {activeLog ? "Session Active" : "Shift Pending"}
              </p>
            </div>
          </div>
          {activeLog && (
            <Badge
              variant="outline"
              className="bg-success/10 text-success border-success/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
            >
              Live
            </Badge>
          )}
        </div>

        <div className="flex flex-col items-center justify-center py-4">
          <div className="text-4xl font-black tabular-nums tracking-tighter text-foreground mb-1">
            {activeLog
              ? formatElapsedTime()
              : currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
          </div>
          <p className="text-xs text-muted-foreground font-medium italic">
            {activeLog
              ? `Started at ${new Date(activeLog.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Check in to start your day"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {!activeLog ? (
            <Button
              onClick={handleCheckIn}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="mr-2 h-5 w-5" /> Check In Now
            </Button>
          ) : (
            <Button
              onClick={handleCheckOut}
              variant="outline"
              className="w-full h-12 rounded-2xl border-2 border-destructive/20 hover:bg-destructive/5 text-destructive font-black transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogOut className="mr-2 h-5 w-5" /> Finish Shift
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-muted/50">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            <CheckCircle2
              className={cn("h-3 w-3", activeLog ? "text-success" : "text-muted-foreground/30")}
            />
            System Synced
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            <Coffee className="h-3 w-3" />
            Vibe Check
          </div>
        </div>
      </div>
    </Card>
  );
}
