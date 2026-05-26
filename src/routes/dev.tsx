import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, GitCommit, GitPullRequest, Github, Settings2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dev")({
  head: () => ({ meta: [{ title: "Development — IntraWork" }] }),
  component: DevWorkspace,
});

function DevWorkspace() {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      toast.success("Successfully connected to GitHub Organization: Intrasphere-Labs");
    }, 1500);
  };

  const pullRequests = [
    {
      id: 1,
      title: "Refactor: Auth Middleware",
      author: "janesmith",
      status: "Open",
      date: "2h ago",
      comments: 4,
    },
    {
      id: 2,
      title: "Fix: Sidebar role filtering",
      author: "alexdev",
      status: "Review",
      date: "5h ago",
      comments: 2,
    },
    {
      id: 3,
      title: "Feat: Analytics dashboard v1",
      author: "mikeflow",
      status: "Merged",
      date: "Yesterday",
      comments: 12,
    },
  ];

  return (
    <AppLayout>
      <PageHeader
        title="Development Workspace"
        description="Connected to GitHub Organization: Intrasphere-Labs"
        actions={
          <Button
            className="bg-gradient-primary shadow-glow"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Github className="mr-2 h-4 w-4" />
            )}
            Sync Repositories
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <Card className="p-0 lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2">
              <GitPullRequest className="h-5 w-5 text-primary" /> Active Pull Requests
            </h3>
            <Badge variant="outline">3 Active</Badge>
          </div>
          <div className="divide-y">
            {pullRequests.map((pr) => (
              <div
                key={pr.id}
                className="p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <GitPullRequest
                        className={cn(
                          "h-4 w-4",
                          pr.status === "Merged" ? "text-purple-500" : "text-success",
                        )}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium group-hover:text-primary transition-colors">
                        {pr.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="font-semibold">#{pr.id}</span>
                        <span>by {pr.author}</span>
                        <span>·</span>
                        <span>{pr.date}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {pr.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <GitCommit className="h-5 w-5 text-info" /> Recent Deployments
            </h3>
            <div className="space-y-4">
              {[
                { env: "Production", ver: "v2.4.0", time: "2h ago", status: "success" },
                { env: "Staging", ver: "v2.4.1-rc1", time: "4h ago", status: "success" },
                { env: "Development", ver: "dev-feat-rbac", time: "6h ago", status: "failed" },
              ].map((dep, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-1.5 w-2 h-2 rounded-full",
                      dep.status === "success"
                        ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                        : "bg-destructive",
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{dep.env}</p>
                      <span className="text-[10px] font-mono text-muted-foreground">{dep.ver}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{dep.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <GitBranch className="h-4 w-4" /> Active Branches
            </h4>
            <div className="space-y-2">
              {["main", "develop", "feat/analytics", "fix/auth-leak"].map((b) => (
                <div
                  key={b}
                  className="flex items-center justify-between p-2 rounded bg-background border text-[11px]"
                >
                  <span className="font-mono">{b}</span>
                  <Badge variant="secondary" className="h-4 text-[9px] px-1">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
