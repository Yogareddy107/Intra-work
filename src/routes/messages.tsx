import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Hash,
  Lock,
  Plus,
  Send,
  Smile,
  Paperclip,
  Loader2,
  FileText,
  Download,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — IntraWork" },
      { name: "description", content: "Real-time team chat, channels and direct messages." },
    ],
  }),
  component: Messages,
});

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "✅", "🚀", "🙌", "✨", "💯", "👋"];

function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isNewChannelOpen, setIsNewChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("channels").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (channels.length > 0 && !activeChannelId && !activeDmUserId) {
      const firstPublic = channels.find((c) => !c.name.includes(":"));
      if (firstPublic) setActiveChannelId(firstPublic.id);
    }
  }, [channels, activeChannelId, activeDmUserId]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", activeChannelId],
    enabled: !!activeChannelId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          profiles (
            full_name,
            avatar_url
          )
        `,
        )
        .eq("channel_id", activeChannelId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("messages_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !pendingFile) || !activeChannelId || !user) return;

    let attachmentUrl = null;
    setIsUploading(true);

    if (pendingFile) {
      const fileExt = pendingFile.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, pendingFile);

      if (uploadError) {
        toast.error("File upload failed");
        setIsUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("attachments").getPublicUrl(filePath);

      attachmentUrl = publicUrl;
    }

    const content = newMessage.trim();
    setNewMessage("");
    setPendingFile(null);

    const { error } = await supabase.rpc("send_chat_message", {
      p_channel_id: activeChannelId,
      p_content: content || (pendingFile ? `Sent a file: ${pendingFile.name}` : ""),
      p_is_dm: !!activeDmUserId,
      p_recipient_id: activeDmUserId || null,
      p_attachment_url: attachmentUrl,
    });

    setIsUploading(false);

    if (error) {
      toast.error("Send failed", { description: error.message });
      setNewMessage(content);
    } else {
      queryClient.invalidateQueries({ queryKey: ["messages", activeChannelId] });
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };

  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !user) return;

    const { data, error } = await supabase
      .from("channels")
      .insert({
        name: newChannelName.trim().toLowerCase().replace(/\s+/g, "-"),
        is_private: isPrivate,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error("Create failed");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["channels"] });
    toast.success("Channel created!");
    setNewChannelName("");
    setIsPrivate(false);
    setIsNewChannelOpen(false);
    if (data) setActiveChannelId(data.id);
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const activeDmUser = employees.find((e) => e.id === activeDmUserId);

  return (
    <AppLayout>
      <Card className="flex h-[calc(100vh-9rem)] overflow-hidden p-0 border-none shadow-premium bg-card">
        <aside className="w-64 shrink-0 border-r bg-muted/20 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-bold text-sm tracking-tight">Intrasphere Labs</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                Workspace Online
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            <div>
              <div className="px-3 py-2 flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>Channels</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 hover:bg-primary/10 hover:text-primary"
                  onClick={() => setIsNewChannelOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-0.5">
                {channels
                  .filter((c) => !c.name.includes(":"))
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveChannelId(c.id);
                        setActiveDmUserId(null);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                        activeChannelId === c.id && !activeDmUserId
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {c.is_private ? (
                        <Lock className="h-3.5 w-3.5 opacity-60" />
                      ) : (
                        <Hash className="h-3.5 w-3.5 opacity-60" />
                      )}
                      <span className="flex-1 text-left truncate">{c.name}</span>
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <div className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Direct Messages
              </div>
              <div className="space-y-0.5">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={async () => {
                      if (!user) return;
                      const dmName = [user.id, emp.id].sort().join(":");
                      let dmChannel = channels.find((c) => c.name === dmName);
                      if (!dmChannel) {
                        const { data } = await supabase
                          .from("channels")
                          .insert({ name: dmName, is_private: true, created_by: user.id })
                          .select()
                          .single();
                        dmChannel = data;
                        queryClient.invalidateQueries({ queryKey: ["channels"] });
                      }
                      if (dmChannel) {
                        setActiveChannelId(dmChannel.id);
                        setActiveDmUserId(emp.id);
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      activeDmUserId === emp.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[9px] bg-muted font-bold">
                          {emp.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-success" />
                    </div>
                    <span className="flex-1 text-left truncate">{emp.full_name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 flex flex-col bg-background/50">
          {!activeChannelId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <div className="h-16 w-16 rounded-3xl bg-muted/20 flex items-center justify-center mb-4">
                <Hash className="h-8 w-8 opacity-20" />
              </div>
              <h3 className="font-bold text-foreground">No Chat Selected</h3>
              <p className="text-sm mt-1">Choose a channel or team member to start chatting.</p>
            </div>
          ) : (
            <>
              <header className="px-6 py-4 border-b bg-background/80 backdrop-blur-md flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {activeDmUserId ? (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{activeDmUser?.initials}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Hash className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold leading-none">
                      {activeDmUser?.full_name || activeChannel?.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">
                      Active Now
                    </p>
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messagesLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary/20" />
                    <p className="text-xs text-muted-foreground font-medium">
                      Encrypting messages...
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                      <Send className="h-8 w-8 text-primary/20" />
                    </div>
                    <h4 className="font-bold text-foreground">Begin the Conversation</h4>
                    <p className="text-xs text-muted-foreground max-w-[200px] mt-2">
                      Messages are secure and available to all team members in this space.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isSelf = m.user_id === user?.id;
                    const profile = m.profiles || {};
                    const senderName = isSelf ? "You" : profile.full_name || "System";
                    const isImage =
                      m.attachment_url &&
                      (m.attachment_url.match(/\.(jpeg|jpg|gif|png)$/) ||
                        m.attachment_url.includes("image"));

                    return (
                      <div key={m.id} className={cn("flex gap-3", isSelf && "flex-row-reverse")}>
                        <Avatar className="h-8 w-8 shrink-0 shadow-sm">
                          <AvatarFallback
                            className={cn(
                              "text-[10px] font-bold",
                              isSelf ? "bg-primary text-primary-foreground" : "bg-muted",
                            )}
                          >
                            {isSelf ? "ME" : senderName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn("max-w-[70%]", isSelf && "text-right")}>
                          <div
                            className={cn(
                              "flex items-center gap-2 mb-1",
                              isSelf && "flex-row-reverse",
                            )}
                          >
                            <span className="text-[11px] font-bold">{senderName}</span>
                            <span className="text-[9px] text-muted-foreground font-medium">
                              {new Date(m.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all flex flex-col gap-2",
                              isSelf
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-card border rounded-tl-none",
                            )}
                          >
                            {m.attachment_url &&
                              (isImage ? (
                                <img
                                  src={m.attachment_url}
                                  alt="attachment"
                                  className="rounded-lg max-w-full h-auto max-h-60 cursor-pointer hover:opacity-90 transition"
                                  onClick={() => window.open(m.attachment_url, "_blank")}
                                />
                              ) : (
                                <div
                                  className="flex items-center gap-2 p-2 rounded bg-muted/20 border border-current/10 cursor-pointer"
                                  onClick={() => window.open(m.attachment_url, "_blank")}
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="text-[10px] font-bold truncate">
                                    View Attachment
                                  </span>
                                  <Download className="h-3 w-3 ml-auto" />
                                </div>
                              ))}
                            {m.content && <span>{m.content}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <footer className="p-4 bg-background border-t relative">
                {pendingFile && (
                  <div className="absolute top-0 left-4 -translate-y-full bg-background border border-b-0 rounded-t-xl px-3 py-2 flex items-center gap-3 shadow-premium animate-in slide-in-from-bottom-2">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                      {pendingFile.type.startsWith("image/") ? (
                        <ImageIcon className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold truncate max-w-[150px]">
                        {pendingFile.name}
                      </p>
                      <p className="text-[8px] text-muted-foreground">
                        {(pendingFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground"
                      onClick={() => setPendingFile(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                <form
                  onSubmit={sendMessage}
                  className="flex items-center gap-2 bg-muted/30 rounded-2xl p-1.5 focus-within:bg-card border border-transparent focus-within:border-primary/20 focus-within:ring-4 focus-within:ring-primary/5 transition-all"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>
                  <Input
                    placeholder={`Message ${activeDmUserId ? activeDmUser?.full_name : "#" + activeChannel?.name}...`}
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm h-9"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    autoComplete="off"
                    disabled={isUploading}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-primary"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-40 p-2 grid grid-cols-4 gap-1 border-none shadow-premium"
                      side="top"
                    >
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => addEmoji(e)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded text-lg transition-colors"
                        >
                          {e}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="submit"
                    disabled={(!newMessage.trim() && !pendingFile) || isUploading}
                    size="icon"
                    className="h-9 w-9 bg-primary text-primary-foreground shadow-glow shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </footer>
            </>
          )}
        </section>
      </Card>

      <Dialog open={isNewChannelOpen} onOpenChange={setIsNewChannelOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Channel</DialogTitle>
          </DialogHeader>
          <form onSubmit={createChannel} className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label
                htmlFor="channelName"
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >
                Channel Name
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="channelName"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="pl-9 h-11 bg-muted/30 border-transparent focus:bg-background"
                  placeholder="marketing"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/10">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Private Channel</Label>
                <p className="text-[10px] text-muted-foreground">
                  Only invited team members can join.
                </p>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => setIsNewChannelOpen(false)}
                className="font-bold"
              >
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground shadow-glow px-6 font-bold"
                type="submit"
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
