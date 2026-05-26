import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Upload,
  Plus,
  Loader2,
  Download,
  Trash2,
  ExternalLink,
  Search,
  Clock,
  Star,
  MoreVertical,
  File,
  UserPlus,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/legal")({
  head: () => ({ meta: [{ title: "Documents & Files — IntraWork" }] }),
  component: LegalDashboard,
});

function LegalDashboard() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Forms State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("none");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["legal-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("id, full_name");
      if (error) throw error;
      return data;
    },
  });

  const employeeMap = employees.reduce((acc: Record<string, string>, curr: any) => {
    acc[curr.id] = curr.full_name;
    return acc;
  }, {});

  useEffect(() => {
    const channel = supabase
      .channel("public:legal_documents")
      .on("postgres_changes", { event: "*", schema: "public", table: "legal_documents" }, () => {
        queryClient.invalidateQueries({ queryKey: ["legal-documents"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const fileExt = selectedFile.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `legal/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("legal_documents").insert({
        title: selectedFile.name,
        type: selectedFile.type.includes("pdf") ? "pdf" : "document",
        status: "signed",
        // @ts-ignore
        file_url: publicUrl,
        employee_id: selectedEmployee === "none" ? null : selectedEmployee,
        content: `Uploaded file: ${selectedFile.name}`,
      });

      if (dbError) throw dbError;

      toast.success("Document uploaded and tagged!");
      queryClient.invalidateQueries({ queryKey: ["legal-documents"] });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedEmployee("none");
    } catch (error: any) {
      toast.error("Upload failed", { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.startsWith("http")) {
      toast.error("Please enter a valid URL");
      return;
    }

    const { error } = await supabase.from("legal_documents").insert({
      title: linkTitle,
      type: "link",
      status: "signed",
      // @ts-ignore
      file_url: linkUrl,
      employee_id: selectedEmployee === "none" ? null : selectedEmployee,
      content: `External link: ${linkUrl}`,
    });

    if (error) {
      toast.error("Failed to add link");
    } else {
      toast.success("Link added and tagged!");
      setLinkTitle("");
      setLinkUrl("");
      setSelectedEmployee("none");
      setIsLinkDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["legal-documents"] });
    }
  };

  const handleDelete = async (id: string, fileUrl?: string) => {
    if (!confirm("Delete this document?")) return;

    if (fileUrl && fileUrl.includes("legal/")) {
      const filePath = `legal/${fileUrl.split("legal/").pop()}`;
      await supabase.storage.from("documents").remove([filePath]);
    }

    const { error } = await supabase.from("legal_documents").delete().eq("id", id);
    if (!error) {
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: ["legal-documents"] });
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatTime = (ts: string) => {
    const diffInHours = Math.floor(
      (new Date().getTime() - new Date(ts).getTime()) / (1000 * 60 * 60),
    );
    if (diffInHours < 24) return diffInHours === 0 ? "Just now" : `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <AppLayout>
      <PageHeader
        title="Documents Vault"
        description="Securely manage organization files, contracts, and cloud documentation."
        actions={
          <div className="flex gap-2">
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-9 px-4">
                  <Upload className="mr-2 h-4 w-4" /> Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload & Tag Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Select File</Label>
                    <Input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tag Employee (Optional)</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">General / Unassigned</SelectItem>
                        {employees.map((e: any) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full bg-gradient-primary"
                    onClick={handleFileUpload}
                    disabled={!selectedFile || isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Confirm Upload
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary h-9 px-4">
                  <ExternalLink className="mr-2 h-4 w-4" /> Add Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add & Tag Cloud Document</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddLink} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Document Name</Label>
                    <Input
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="e.g. Offer Letter - Alex"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Drive / External URL</Label>
                    <Input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tag Employee (Optional)</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">General / Unassigned</SelectItem>
                        {employees.map((e: any) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    Save to Vault
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="mt-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vault..."
            className="pl-10 h-11 bg-card border-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card className="overflow-hidden border-none shadow-sm">
          <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Recent Activities
            </h3>
            <Badge variant="secondary" className="font-mono text-[10px] uppercase">
              {filteredDocs.length} Documents
            </Badge>
          </div>

          <div className="divide-y">
            {docsLoading ? (
              <div className="p-20 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/20" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center">
                <FileText className="h-12 w-12 text-muted-foreground/10 mb-4" />
                <h4 className="text-sm font-bold text-muted-foreground">The vault is empty</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Start by uploading a document or linking a cloud file.
                </p>
              </div>
            ) : (
              filteredDocs.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 cursor-pointer group transition-all"
                  onClick={() => doc.file_url && window.open(doc.file_url, "_blank")}
                >
                  <div
                    className={cn(
                      "h-11 w-11 rounded-lg flex items-center justify-center transition-all",
                      doc.type === "link"
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/5 text-primary group-hover:bg-primary/10",
                    )}
                  >
                    {doc.type === "link" ? (
                      <ExternalLink className="h-5 w-5" />
                    ) : (
                      <File className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                        {doc.title}
                      </h4>
                      {doc.employee_id && (
                        <Badge className="h-4 px-1.5 text-[8px] bg-primary/10 text-primary border-primary/20 uppercase">
                          {employeeMap[doc.employee_id]}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium mt-1">
                      <span className="flex items-center gap-1 uppercase tracking-wider">
                        {doc.type === "link" ? "Cloud Link" : "Local File"}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatTime(doc.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        <DropdownMenuItem onClick={() => window.open(doc.file_url, "_blank")}>
                          <Download className="mr-2 h-4 w-4" /> Open / Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id, doc.file_url);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
