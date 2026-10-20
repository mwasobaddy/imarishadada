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

  useEffect(() => {
    // Load recent messages
    supabase
      .from("chat_messages")
      .select("*")
      .eq("channel", channel)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setMessages((data as unknown as Message[]).reverse());
      });

    // Subscribe to new messages
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
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims?.sub;
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

  return (
    <div className="flex h-[500px] flex-col rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-brand-600">Team chat</h3>
        <p className="text-xs text-ink-muted">Channel: {channel}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col">
            <span className="text-xs font-medium text-ink-muted">
              {m.sender_name} · {new Date(m.created_at).toLocaleTimeString()}
            </span>
            <p className="mt-0.5 text-sm text-ink">{m.body}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type a message…"
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
