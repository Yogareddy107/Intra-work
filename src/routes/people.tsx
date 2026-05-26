import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  UserCheck,
  CalendarOff,
  Briefcase,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Clock,
  History,
  Timer,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/people")({
  head: () => ({
    meta: [
      { title: "HR & People — IntraWork" },
      {
        name: "description",
        content: "Manage employees, attendance, and leave across your organization.",
      },
    ],
  }),
  component: People,
});

const statusTone: Record<string, string> = {
  Present: "bg-success/10 text-success border-success/20",
  Remote: "bg-info/10 text-info border-info/20",
  "On Leave": "bg-warning/15 text-warning-foreground border-warning/30",
  Absent: "bg-destructive/10 text-destructive border-destructive/20",
};

const statuses = ["Present", "Remote", "On Leave", "Absent"] as const;
type Status = (typeof statuses)[number];

function People() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [dept, setDept] = useState("");

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: attendanceLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["all-attendance-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_logs")
        .select(
          `
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `,
        )
        .order("check_in", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes for logs
  });

  useEffect(() => {
    const channels = ["employees", "attendance_logs"].map((table) =>
      supabase
        .channel(`public:${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => {
          queryClient.invalidateQueries({
            queryKey: [table === "attendance_logs" ? "all-attendance-logs" : table],
          });
        })
        .subscribe(),
    );

    return () => {
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, [queryClient]);

  const updateStatus = async (id: string, newStatus: Status) => {
    await supabase.from("employees").update({ status: newStatus }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["employees"] });
  };

  const deleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;

    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete employee", { description: error.message });
    } else {
      toast.success("Employee record deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    // We use a temporary client so signing up the new user doesn't log the admin out.
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
    const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
    const tempClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Register the employee in Supabase Auth
    const { error: authError } = await tempClient.auth.signUp({
      email,
      password,
    });

    if (authError) {
      toast.error("Failed to register credentials", { description: authError.message });
      return;
    }

    // 2. Add them to the public.employees table
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const employee_id = `ISL-${Math.floor(1000 + Math.random() * 9000)}`;

    const { error: dbError } = await supabase.from("employees").insert({
      full_name: name,
      email,
      role,
      department: dept,
      employee_id,
      initials,
      status: "Present",
    });

    if (dbError) {
      toast.error("Failed to add employee record", { description: dbError.message });
      return;
    }

    // Force an immediate refresh
    queryClient.invalidateQueries({ queryKey: ["employees"] });

    toast.success("Employee added and credentials registered!");
    setName("");
    setEmail("");
    setPassword("");
    setRole("");
    setDept("");
    setIsDialogOpen(false);
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalEmployees = employees.length;
  const presentCount = employees.filter((e) => e.status === "Present").length;
  const onLeaveCount = employees.filter((e) => e.status === "On Leave").length;
  const departmentsCount = new Set(employees.map((e) => e.department)).size;

  return (
    <AppLayout>
      <PageHeader
        title="HR & People"
        description="Employees, attendance, leave and onboarding (Live Data)."
        actions={
          <div className="flex items-center gap-3">
            <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-2xl border-2 border-primary/20 hover:bg-primary/5 font-bold h-12 px-6"
                >
                  <History className="mr-1.5 h-4 w-4" /> Attendance Logs
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 border-b">
                  <DialogTitle className="text-2xl font-black tracking-tight">
                    Daily Attendance Logs
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-0">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest px-6">
                          Employee
                        </TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest px-6">
                          Date
                        </TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest px-6">
                          Check In
                        </TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest px-6">
                          Check Out
                        </TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest px-6">
                          Duration
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceLogs.length === 0 && !logsLoading ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-10 text-muted-foreground font-medium italic"
                          >
                            No logs found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        attendanceLogs.map((log: any) => {
                          const duration = log.check_out
                            ? `${Math.floor((new Date(log.check_out).getTime() - new Date(log.check_in).getTime()) / 3600000)}h ${Math.floor(((new Date(log.check_out).getTime() - new Date(log.check_in).getTime()) % 3600000) / 60000)}m`
                            : "Active";

                          return (
                            <TableRow key={log.id} className="hover:bg-muted/5">
                              <TableCell className="px-6">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black uppercase">
                                      {log.profiles?.full_name?.substring(0, 2) || "EM"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-bold text-sm">
                                    {log.profiles?.full_name || "Unknown User"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 text-sm font-medium">
                                {new Date(log.work_date).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="px-6">
                                <Badge
                                  variant="secondary"
                                  className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[10px] px-2 py-0.5"
                                >
                                  {new Date(log.check_in).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-6">
                                {log.check_out ? (
                                  <Badge
                                    variant="secondary"
                                    className="bg-amber-500/10 text-amber-500 border-none font-bold text-[10px] px-2 py-0.5"
                                  >
                                    {new Date(log.check_out).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="animate-pulse border-emerald-500/50 text-emerald-500 font-bold text-[10px] px-2 py-0.5"
                                  >
                                    Online Now
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="px-6 text-sm font-black text-muted-foreground">
                                {duration}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95 h-12 px-6 rounded-2xl">
                  <Plus className="mr-1.5 h-4 w-4" /> Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddEmployee} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input
                      type="text"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role / Job Title</Label>
                      <Input
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dept">Department</Label>
                      <Input
                        id="dept"
                        value={dept}
                        onChange={(e) => setDept(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button type="submit">Add Employee</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Employees"
          value={isLoading ? "-" : totalEmployees.toString()}
          icon={Users}
          accent="primary"
        />
        <StatCard
          label="Present"
          value={isLoading ? "-" : presentCount.toString()}
          icon={UserCheck}
          accent="success"
        />
        <StatCard
          label="On Leave"
          value={isLoading ? "-" : onLeaveCount.toString()}
          icon={CalendarOff}
          accent="warning"
        />
        <StatCard
          label="Departments"
          value={isLoading ? "-" : departmentsCount.toString()}
          icon={Briefcase}
          accent="info"
        />
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold">Directory</h3>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employees…"
              className="pl-9 h-9 bg-muted/50 border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Employee</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">
                            {e.initials || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium leading-tight">{e.full_name}</div>
                          <div className="text-xs text-muted-foreground leading-tight">
                            {e.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {e.employee_id}
                    </TableCell>
                    <TableCell className="text-sm">{e.role}</TableCell>
                    <TableCell className="text-sm">{e.department}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusTone[e.status] || "bg-muted"}>
                        {e.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {statuses.map((s) => (
                            <DropdownMenuItem
                              key={s}
                              disabled={s === e.status}
                              onClick={() => updateStatus(e.id, s)}
                            >
                              Mark as {s}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteEmployee(e.id, e.full_name)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </AppLayout>
  );
}
