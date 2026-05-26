import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Folder,
  FileText,
  Search,
  Plus,
  Star,
  Clock,
  Loader2,
  Upload,
  File,
  MoreVertical,
  Download,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Knowledge Base — IntraWork" },
      { name: "description", content: "Company wiki, notes and team documentation." },
    ],
  }),
  component: Docs,
});

function Docs() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [docTitle, setDocTitle] = useState("");
  const [docFolder, setDocFolder] = useState("");

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("public:documents")
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, () => {
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const toggleStar = async (id: string, currentStarred: boolean) => {
    await supabase.from("documents").update({ starred: !currentStarred }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  };

  const handleDelete = async (id: string, fileUrl?: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    // If there's a file in storage, we should ideally delete it too
    if (fileUrl) {
      const filePath = fileUrl.split("/").pop();
      if (filePath) {
        await supabase.storage.from("documents").remove([filePath]);
      }
    }

    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete document");
    } else {
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    }
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("documents").insert({
      title: docTitle,
      folder: docFolder || "Uncategorized",
      starred: false,
    });

    if (error) {
      toast.error("Failed to create document", { description: error.message });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["documents"] });
    toast.success("Document created successfully!");
    setDocTitle("");
    setDocFolder("");
    setIsDialogOpen(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      // 1. Upload to Storage
      const { error: uploadError, data } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      // 3. Insert into Documents table
      const { error: dbError } = await supabase.from("documents").insert({
        title: file.name,
        folder: "Uploads",
        starred: false,
        // @ts-ignore
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
      });

      if (dbError) throw dbError;

      toast.success("File uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (error: any) {
      toast.error("Upload failed", { description: error.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.folder.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const folderCounts = documents.reduce(
    (acc, doc) => {
      acc[doc.folder] = (acc[doc.folder] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const folders = Object.entries(folderCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 24) return diffInHours === 0 ? "Just now" : `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <AppLayout>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
      />
      <PageHeader
        title="Knowledge Base"
        description="Securely store, organize, and share your team's documentation."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-9 px-4"
            >
              {isUploading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-4 w-4" />
              )}
              Upload Document
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-primary-foreground shadow-glow h-9 px-4">
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Add Link
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add External Document</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateDoc} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                      id="title"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="E.g. Q4 Marketing Drive"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link">Google Drive / External Link</Label>
                    <Input
                      id="link"
                      value={docFolder}
                      onChange={(e) => setDocFolder(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      required
                    />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button type="submit">Add to Knowledge Base</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search documents and links..."
          className="h-12 pl-11 text-base bg-card shadow-sm border-transparent focus-visible:ring-primary/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="p-0 overflow-hidden border-none shadow-sm bg-card">
        <div className="p-5 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold">Recent Activity</h3>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest">
            {filteredDocs.length} Total
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-20 bg-muted/10">
            <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
            <h4 className="text-sm font-bold text-muted-foreground">No documents found</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Upload a file or add a Drive link to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredDocs.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/30 cursor-pointer group transition-colors"
                onClick={() => {
                  const url = d.file_url || d.folder; // If it's a link, we stored it in 'folder' temporarily or file_url
                  if (url?.startsWith("http")) window.open(url, "_blank");
                }}
              >
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg shrink-0 transition-all",
                    d.file_url ? "bg-primary/10" : "bg-muted group-hover:bg-background",
                  )}
                >
                  {d.file_url ? (
                    <File className="h-5 w-5 text-primary" />
                  ) : (
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {d.title}
                    </span>
                    {d.starred && <Star className="h-3 w-3 fill-warning text-warning" />}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium mt-1">
                    <span className="flex items-center gap-1">
                      {d.file_url ? (
                        <Upload className="h-3 w-3" />
                      ) : (
                        <ExternalLink className="h-3 w-3" />
                      )}
                      {d.file_url ? "Local Upload" : "External Link"}
                    </span>
                    <span>·</span>
                    <span>
                      {(d as any).file_size ? formatSize((d as any).file_size) : "Cloud Doc"}
                    </span>
                    <span>·</span>
                    <span>Updated {formatTime(d.updated_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(d.id, d.starred);
                    }}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        d.starred ? "fill-warning text-warning" : "text-muted-foreground",
                      )}
                    />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => window.open(d.file_url || d.folder, "_blank")}
                      >
                        <Download className="mr-2 h-4 w-4" /> Open
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(d.id, d.file_url);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppLayout>
  );
}
