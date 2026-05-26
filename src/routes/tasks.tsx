import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  MessageCircle,
  Paperclip,
  Flag,
  MoreHorizontal,
  Trash2,
  Send,
  Download,
  Loader2,
  Clock,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks & Projects — IntraWork" },
      {
        name: "description",
        content: "Kanban boards, sprints and project tracking for your team.",
      },
    ],
  }),
  component: Tasks,
});

type Priority = "low" | "med" | "high";
type Status = "todo" | "progress" | "review" | "done";

const priorityTone: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground border-transparent",
  med: "bg-info/10 text-info border-info/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

const columnDefs: { id: Status; title: string; color: string }[] = [
  { id: "todo", title: "Todo", color: "bg-muted-foreground" },
  { id: "progress", title: "In Progress", color: "bg-info" },
  { id: "review", title: "Review", color: "bg-warning" },
  { id: "done", title: "Completed", color: "bg-success" },
];

function Tasks() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("med");
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
        *,
        projects (
          name,
          color
        )
      `,
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const channel = supabase
      .channel("public:tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateStatus = async (id: string, newStatus: Status) => {
    await supabase.from("tasks").update({ status: newStatus }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete task");
    } else {
      toast.success("Task deleted");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const { error } = await supabase.from("tasks").insert({
      title: newTaskTitle,
      tag: newTaskTag || "General",
      priority: newTaskPriority,
      status: "todo",
      project_id: newTaskProjectId || null,
      comments_count: 0,
      files_count: 0,
      assignees: [user?.email?.split("@")[0].toUpperCase() || "ME"],
    });

    if (error) {
      toast.error("Failed to create task", { description: error.message });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    toast.success("Task created successfully!");
    setNewTaskTitle("");
    setNewTaskTag("");
    setNewTaskPriority("med");
    setNewTaskProjectId("");
    setIsDialogOpen(false);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Atlas Web Platform"
        description="Sprint 14 · Kanban board (Live Data)"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
                <Plus className="mr-1.5 h-4 w-4" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="E.g. Update onboarding flow"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag">Tag / Category</Label>
                  <Input
                    id="tag"
                    value={newTaskTag}
                    onChange={(e) => setNewTaskTag(e.target.value)}
                    placeholder="E.g. Design, Frontend"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTaskPriority}
                    onValueChange={(v) => setNewTaskPriority(v as Priority)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="med">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select value={newTaskProjectId} onValueChange={setNewTaskProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={!newTaskTitle}>
                    Create Task
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columnDefs.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="flex flex-col rounded-xl border bg-muted/30 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", col.color)} />
                  <h3 className="text-sm font-semibold">{col.title}</h3>
                  <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">
                    {colTasks.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2.5">
                {colTasks.map((t) => (
                  <Card
                    key={t.id}
                    className="cursor-pointer p-3.5 transition-all hover:shadow-md hover:-translate-y-0.5 relative group"
                    onClick={() => {
                      setSelectedTask(t);
                      setIsDetailsOpen(true);
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium max-w-[100px] truncate"
                      >
                        {t.projects?.name || t.tag}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", priorityTone[t.priority as Priority])}
                        >
                          <Flag className="mr-1 h-2.5 w-2.5" />
                          {t.priority}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {columnDefs.map((c) => (
                              <DropdownMenuItem
                                key={c.id}
                                disabled={c.id === t.status}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus(t.id, c.id);
                                }}
                              >
                                Move to {c.title}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTask(t.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-sm font-medium leading-snug">{t.title}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex -space-x-1.5">
                        {t.assignees?.map((a: string) => (
                          <Avatar key={a} className="h-6 w-6 border-2 border-card">
                            <AvatarFallback className="text-[9px] font-semibold bg-gradient-primary text-primary-foreground">
                              {a[0]}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {t.comments_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          {t.files_count}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          isOpen={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />
      )}
    </AppLayout>
  );
}

function TaskDetailsDialog({
  task,
  isOpen,
  onOpenChange,
}: {
  task: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["task-comments", task.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  const { data: attachments = [], isLoading: attachmentsLoading } = useQuery({
    queryKey: ["task-attachments", task.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen) return;
    const channels = [
      supabase
        .channel(`comments:${task.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "task_comments", filter: `task_id=eq.${task.id}` },
          () => {
            queryClient.invalidateQueries({ queryKey: ["task-comments", task.id] });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
          },
        )
        .subscribe(),
      supabase
        .channel(`attachments:${task.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "task_attachments",
            filter: `task_id=eq.${task.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ["task-attachments", task.id] });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
          },
        )
        .subscribe(),
    ];
    return () => {
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, [isOpen, task.id, queryClient]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const { error } = await supabase.from("task_comments").insert({
      task_id: task.id,
      user_id: user?.id,
      content: comment,
    });

    if (error) {
      toast.error("Failed to post comment");
    } else {
      setComment("");
      // Update local task count
      await supabase.rpc("increment_task_comments", { row_id: task.id });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileName = `${Math.random().toString(36).substring(2)}-${file.name}`;
    const filePath = `tasks/${task.id}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("task_attachments").insert({
        task_id: task.id,
        user_id: user?.id,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
      });

      if (dbError) throw dbError;
      toast.success("File attached");
      await supabase.rpc("increment_task_files", { row_id: task.id });
    } catch (error: any) {
      toast.error("Upload failed", { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-2">
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-wider font-bold text-primary"
            >
              {task.projects?.name || task.tag}
            </Badge>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn("text-[10px]", priorityTone[task.priority as Priority])}
              >
                <Flag className="mr-1 h-3 w-3" /> {task.priority}
              </Badge>
              <Badge
                className={cn(
                  "text-[10px] uppercase",
                  task.status === "done" ? "bg-success" : "bg-info",
                )}
              >
                {task.status}
              </Badge>
            </div>
          </div>
          <h2 className="text-xl font-bold leading-tight">{task.title}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Attachments Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" /> Attachments
              </h3>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-primary text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Plus className="h-3 w-3 mr-1" />
                )}
                Attach File
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group"
                  onClick={() => window.open(att.file_url, "_blank")}
                >
                  <div className="h-9 w-9 rounded bg-background flex items-center justify-center border shadow-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold truncate">{att.file_name}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {(att.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Download className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </div>
              ))}
              {attachments.length === 0 && (
                <p className="col-span-2 text-center py-4 text-[11px] text-muted-foreground italic bg-muted/5 rounded-lg border border-dashed">
                  No attachments yet.
                </p>
              )}
            </div>
          </section>

          {/* Comments Section */}
          <section>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <MessageCircle className="h-4 w-4 text-muted-foreground" /> Discussion
            </h3>

            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[9px] font-bold bg-muted uppercase">
                      {c.user_id?.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted/40 p-3 rounded-2xl rounded-tl-none">
                      <p className="text-sm leading-relaxed">{c.content}</p>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1 ml-1 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />{" "}
                      {new Date(c.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center py-4 text-[11px] text-muted-foreground italic">
                  No comments yet. Start the conversation!
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="p-4 border-t bg-muted/10">
          <form onSubmit={handleAddComment} className="flex gap-2">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="bg-background"
            />
            <Button type="submit" size="icon" className="shrink-0" disabled={!comment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
