import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Download,
  PieChart,
  Users,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — IntraWork" }] }),
  component: AnalyticsDashboard,
});

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

function AnalyticsDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["analytics-stats"],
    queryFn: async () => {
      const [{ count: empCount }, { count: taskCount }, { count: docCount }, { data: deptData }] =
        await Promise.all([
          supabase.from("employees").select("*", { count: "exact", head: true }),
          supabase.from("tasks").select("*", { count: "exact", head: true }),
          supabase.from("legal_documents").select("*", { count: "exact", head: true }),
          supabase.from("employees").select("department"),
        ]);

      // Calculate department distribution
      const depts =
        deptData?.reduce((acc: Record<string, number>, curr) => {
          if (curr.department) acc[curr.department] = (acc[curr.department] || 0) + 1;
          return acc;
        }, {}) || {};

      const deptChartData = Object.entries(depts).map(([name, value]) => ({ name, value }));

      return {
        empCount,
        taskCount,
        docCount,
        deptChartData,
        productivityData: [
          { name: "Mon", value: 45 },
          { name: "Tue", value: 52 },
          { name: "Wed", value: 48 },
          { name: "Thu", value: 61 },
          { name: "Fri", value: 55 },
          { name: "Sat", value: 20 },
          { name: "Sun", value: 15 },
        ],
      };
    },
  });
  return (
    <AppLayout>
      <PageHeader
        title="Company Analytics"
        description="Deep insights into productivity, attendance, and project health."
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mt-6">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Users />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Workforce
            </p>
            <h4 className="text-2xl font-bold">{stats?.empCount || 0}</h4>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-success/10 text-success rounded-xl">
            <CheckCircle2 />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Tasks
            </p>
            <h4 className="text-2xl font-bold">{stats?.taskCount || 0}</h4>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-info/10 text-info rounded-xl">
            <FileCheck />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Legal Docs
            </p>
            <h4 className="text-2xl font-bold">{stats?.docCount || 0}</h4>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Productivity Index
              </h3>
              <p className="text-xs text-muted-foreground">
                Average team output over the last 7 days.
              </p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={stats?.productivityData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-info" /> Department Distribution
              </h3>
              <p className="text-xs text-muted-foreground">Breakdown of employees by department.</p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={stats?.deptChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.deptChartData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
