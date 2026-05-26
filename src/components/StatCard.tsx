import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "info";
}

const accentMap = {
  primary: "from-primary/15 to-primary/5 text-primary",
  success: "from-success/15 to-success/5 text-success",
  warning: "from-warning/20 to-warning/5 text-warning-foreground",
  info: "from-info/15 to-info/5 text-info",
};

export function StatCard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  accent = "primary",
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {change && (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                trend === "up" ? "text-success" : "text-destructive",
              )}
            >
              {trend === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {change}
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br",
            accentMap[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
