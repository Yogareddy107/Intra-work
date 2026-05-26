import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, Shield, Bell, Smartphone, FileText } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — IntraWork" },
      { name: "description", content: "Manage your profile and workspace preferences." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Profile Data
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    job_title: "",
    email: "",
    phone: "",
    department: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        job_title: profile.job_title || "",
        email: profile.email || "",
        phone: (profile as any).phone || "",
        department: profile.department || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        job_title: formData.job_title,
        email: formData.email,
        department: formData.department,
        // @ts-ignore
        phone: formData.phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setIsSaving(false);
    if (error) {
      toast.error("Failed to save changes", { description: error.message });
    } else {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Settings"
        description="Manage your personal information and account security."
      />

      <div className="grid gap-8 lg:grid-cols-12 mt-6">
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold tracking-tight">Personal Information</h3>
              <Badge variant="outline" className="font-mono text-[10px]">
                {user?.id.slice(0, 8)}
              </Badge>
            </div>

            <div className="mb-8 flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl font-bold">
                    {getInitials(formData.full_name || "U")}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6" />
                </button>
              </div>
              <div>
                <h4 className="font-semibold">{formData.full_name || "Unknown User"}</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  {formData.job_title} · {formData.department}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    Update Avatar
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive">
                    Remove
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="fn"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Full Name
                </Label>
                <Input
                  id="fn"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Job Title
                </Label>
                <Input
                  id="title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  placeholder="E.g. Senior Developer"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Work Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="yourname@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label
                  htmlFor="dept"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Department
                </Label>
                <Input
                  id="dept"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="E.g. Engineering, Sales"
                />
              </div>
            </div>
            <div className="mt-8 pt-6 border-t flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() =>
                  setFormData({
                    full_name: profile?.full_name || "",
                    job_title: profile?.job_title || "",
                    email: profile?.email || "",
                    phone: (profile as any).phone || "",
                    department: profile?.department || "",
                  })
                }
              >
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-primary text-primary-foreground shadow-glow min-w-[120px]"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6">
            <h3 className="mb-6 text-sm font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Preferences
            </h3>
            <div className="space-y-6">
              {[
                { l: "Email Alerts", d: "Notifications sent to your inbox", icon: Bell, on: true },
                { l: "Desktop Push", d: "System-level notifications", icon: Smartphone, on: true },
                { l: "Marketing", d: "Newsletter and product updates", icon: FileText, on: false },
              ].map((s) => (
                <div key={s.l} className="flex items-start justify-between gap-3 group">
                  <div className="flex gap-3">
                    <div className="mt-1 p-1.5 rounded bg-muted group-hover:bg-primary/10 transition-colors">
                      <s.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{s.l}</div>
                      <div className="text-[11px] text-muted-foreground">{s.d}</div>
                    </div>
                  </div>
                  <Switch defaultChecked={s.on} className="data-[state=checked]:bg-primary" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-destructive/5 border-destructive/20">
            <h3 className="mb-2 text-sm font-bold text-destructive">Danger Zone</h3>
            <p className="text-[11px] text-muted-foreground mb-4">
              Permanently delete your account and all associated data. This action is irreversible.
            </p>
            <Button variant="destructive" size="sm" className="w-full text-xs font-bold">
              Delete Account
            </Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
