import { useEffect, useState } from "react";
import { Heart, MessageCircle, Send, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

interface Props {
  resourceId: string;
}

export const ResourceInteractions = ({ resourceId }: Props) => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [open, setOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ count }, { data: mine }, { data: cmts }] = await Promise.all([
        supabase.from("resource_likes").select("id", { count: "exact", head: true }).eq("resource_id", resourceId),
        user
          ? supabase.from("resource_likes").select("id").eq("resource_id", resourceId).eq("user_id", user.id).maybeSingle()
          : Promise.resolve({ data: null } as any),
        supabase
          .from("resource_comments")
          .select("id, user_id, content, created_at")
          .eq("resource_id", resourceId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (cancelled) return;
      setLikeCount(count || 0);
      setLiked(!!mine);
      const list = (cmts || []) as Comment[];
      // fetch author names
      const ids = [...new Set(list.map((c) => c.user_id))];
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
        const map = new Map((profs || []).map((p: any) => [p.user_id, p.display_name]));
        list.forEach((c) => (c.author_name = resolveName(map.get(c.user_id), c.user_id)));
      }
      if (!cancelled) setComments(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [resourceId, user]);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel(`resource-${resourceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resource_likes", filter: `resource_id=eq.${resourceId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setLikeCount((c) => c + 1);
            if (user && (payload.new as any).user_id === user.id) setLiked(true);
          } else if (payload.eventType === "DELETE") {
            setLikeCount((c) => Math.max(0, c - 1));
            if (user && (payload.old as any).user_id === user.id) setLiked(false);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "resource_comments", filter: `resource_id=eq.${resourceId}` },
        async (payload) => {
          const c = payload.new as Comment;
          const { data: prof } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", c.user_id)
            .maybeSingle();
          c.author_name = prof?.display_name || "Anonymous";
          setComments((prev) => (prev.find((x) => x.id === c.id) ? prev : [c, ...prev]));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "resource_comments", filter: `resource_id=eq.${resourceId}` },
        (payload) => {
          setComments((prev) => prev.filter((c) => c.id !== (payload.old as any).id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [resourceId, user]);

  const toggleLike = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setLikeBusy(true);
    try {
      if (liked) {
        await supabase.from("resource_likes").delete().eq("resource_id", resourceId).eq("user_id", user.id);
      } else {
        await supabase.from("resource_likes").insert({ resource_id: resourceId, user_id: user.id });
      }
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setLikeBusy(false);
    }
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth");
      return;
    }
    const content = newComment.trim();
    if (!content) return;
    setPosting(true);
    try {
      const { error } = await supabase
        .from("resource_comments")
        .insert({ resource_id: resourceId, user_id: user.id, content });
      if (error) throw error;
      setNewComment("");
    } catch (e: any) {
      toast.error(e.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (id: string) => {
    try {
      const { error } = await supabase.from("resource_comments").delete().eq("id", id);
      if (error) throw error;
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2"
          onClick={toggleLike}
          disabled={likeBusy}
          aria-pressed={liked}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-destructive text-destructive")} />
          <span className="text-xs tabular-nums">{likeCount}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2"
          onClick={() => setOpen((o) => !o)}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs tabular-nums">{comments.length}</span>
        </Button>
      </div>

      <Collapsible open={open}>
        <CollapsibleContent className="mt-2 space-y-3">
          <form onSubmit={postComment} className="flex items-end gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Share your feedback..." : "Sign in to comment"}
              maxLength={1000}
              rows={2}
              className="min-h-[40px] resize-none text-sm"
              disabled={!user || posting}
            />
            <Button
              type="submit"
              size="icon"
              variant="hero"
              className="h-9 w-9 shrink-0"
              disabled={!newComment.trim() || posting}
              aria-label="Post comment"
            >
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {comments.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-2">No comments yet. Be the first!</p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg bg-muted/50 p-2.5 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">{c.author_name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-foreground/90">{c.content}</p>
                {(user?.id === c.user_id || isAdmin) && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ResourceInteractions;
