import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock, Activity, UsersRound, Save, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/security")({
  head: () => ({ meta: [{ title: "Security & Admin — IntraWork" }] }),
  component: SecurityDashboard,
});

type AppRole = "super_admin" | "admin" | "manager" | "employee";

function SecurityDashboard() {
  const { roles = [], user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = roles?.includes("super_admin");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["security-users"],
    queryFn: async () => {
      // Fetch employees and join with profiles to get auth user_ids
      const { data: employeesData, error: empError } = await supabase
        .from("employees")
        .select("id, full_name, email, employee_id");
      if (empError) throw empError;

      // Fetch profiles to link emails to auth user_ids
      const { data: profilesData, error: profError } = await supabase
        .from("profiles")
        .select("id, email");
      if (profError) throw profError;

      // Fetch current roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

      // Create a map of email -> user_id -> role
      const emailToUid: Record<string, string> = {};
      profilesData.forEach((p) => {
        if (p.email) emailToUid[p.email] = p.id;
      });

      const uidToRole: Record<string, AppRole> = {};
      rolesData.forEach((r) => {
        uidToRole[r.user_id] = r.role as AppRole;
      });

      // Merge data
      return employeesData.map((emp) => {
        const uid = emailToUid[emp.email];
        const role = uid ? uidToRole[uid] || "employee" : "employee";
        return {
          ...emp,
          auth_uid: uid || null,
          current_role: role as AppRole,
        };
      });
    },
    enabled: isSuperAdmin,
  });

  const handleRoleChange = async (employeeId: string, authUid: string | null, newRole: AppRole) => {
    if (!authUid) {
      toast.error("User does not have an active auth profile.");
      return;
    }

    setUpdatingId(employeeId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: authUid, role: newRole }, { onConflict: "user_id" });

      if (error) throw error;

      toast.success(`Role updated to ${newRole.replace("_", " ")}`);
      queryClient.invalidateQueries({ queryKey: ["security-users"] });
    } catch (err: any) {
      toast.error("Failed to update role", { description: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
          <div className="p-4 bg-destructive/10 text-destructive rounded-full mb-4">
            <Lock className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground max-w-md">
            You do not have the required permissions to access the Security & Admin dashboard.
            Please contact a Super Admin if you believe this is an error.
          </p>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout>
      <PageHeader
        title="Security & Administration"
        description="Manage roles, permissions, audit logs, and security settings."
        actions={<Button variant="outline">Export Logs</Button>}
      />

      <div className="grid gap-4 md:grid-cols-4 mt-6">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <ShieldCheck />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">System Health</p>
            <h4 className="text-2xl font-bold">Secure</h4>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-warning/10 text-warning-foreground rounded-xl">
            <Activity />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Audit Events</p>
            <h4 className="text-2xl font-bold">1,248</h4>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-info/10 text-info rounded-xl">
            <UsersRound />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active Roles</p>
            <h4 className="text-2xl font-bold">4</h4>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-success/10 text-success rounded-xl">
            <Lock />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">2FA Adoption</p>
            <h4 className="text-2xl font-bold">100%</h4>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">User Role Management</h3>
            <p className="text-sm text-muted-foreground">
              Assign system-wide permissions to employees.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
            Refresh List
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading user data...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <div>
                        {u.full_name}
                        <div className="text-[10px] text-muted-foreground">{u.employee_id}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Select
                        disabled={updatingId === u.id || !u.auth_uid}
                        value={u.current_role}
                        onValueChange={(val) => handleRoleChange(u.id, u.auth_uid, val as AppRole)}
                      >
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                          <SelectValue placeholder="Assign Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="admin">HR Admin</SelectItem>
                          <SelectItem value="manager">Team Manager</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                      {!u.auth_uid && (
                        <p className="text-[10px] text-destructive mt-1">No Auth account</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {updatingId === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin inline ml-auto" />
                      ) : (
                        <ShieldCheck
                          className={`h-4 w-4 inline ml-auto ${u.auth_uid ? "text-success" : "text-muted-foreground"}`}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <h3 className="font-semibold mb-4">Recent Audit Logs</h3>
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg bg-muted/20 text-muted-foreground">
          Audit logs will be visible here.
        </div>
      </Card>
    </AppLayout>
  );
}
