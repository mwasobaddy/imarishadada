"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { createAuthBrowserClient } from "@/lib/supabase/auth-browser";

type Message = {
  id: string;
  sender_id: string;
  sender_name: string;
  channel: string;
  body: string;
  created_at: string;
};

export function RealtimeChat({ channel = "general", userName }: { channel?: string; userName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createAuthBrowserClient();
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getClaims().then(({ data }) => {
      userIdRef.current = data?.claims?.sub ?? null;
    });

    supabase
      .from("chat_messages")
      .select("*")
      .eq("channel", channel)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setMessages((data as unknown as Message[]).reverse());
      });

    const sub = supabase
      .channel(`chat:${channel}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel=eq.${channel}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as unknown as Message]);
        },
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [channel, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || sending) return;
    setSending(true);
    const userId = userIdRef.current;
    if (!userId) { toast.error("Not authenticated"); setSending(false); return; }

    const { error } = await supabase.from("chat_messages").insert({
      sender_id: userId,
      sender_name: userName,
      channel,
      body: input.trim(),
    });

    if (error) toast.error(error.message);
    else setInput("");
    setSending(false);
  }

  function initials(name: string) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  }

  // Group messages by date for date separators
  const grouped: { date: string; messages: Message[] }[] = [];
  for (const m of messages) {
    const d = formatDate(m.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === d) {
      last.messages.push(m);
    } else {
      grouped.push({ date: d, messages: [m] });
    }
  }

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-brand-50">
          #
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink">Team chat</h3>
          <p className="text-xs text-ink-muted">
            {messages.length} messages · {channel}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-ink-muted">
              No messages yet. Start the conversation.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((g) => (
              <div key={g.date}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-ink-muted/60">
                    {g.date}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-4">
                  {g.messages.map((m, i) => {
                    const isOwn = m.sender_id === userIdRef.current;
                    const prevMsg = i > 0 ? g.messages[i - 1] : null;
                    const showAvatar = !prevMsg || prevMsg.sender_id !== m.sender_id;
                    return (
                      <div key={m.id} className="flex gap-3">
                        {showAvatar ? (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-brand-50">
                            {initials(m.sender_name)}
                          </div>
                        ) : (
                          <div className="w-8 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          {showAvatar && (
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-medium text-ink">
                                {m.sender_name}
                                {isOwn && (
                                  <span className="ml-1.5 text-[10px] text-ink-muted">(you)</span>
                                )}
                              </span>
                              <span className="text-[10px] text-ink-muted/60">
                                {formatTime(m.created_at)}
                              </span>
                            </div>
                          )}
                          <p className="mt-0.5 text-sm leading-relaxed text-ink">
                            {m.body}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-surface px-5 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/50 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-brand-50 transition-colors hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
