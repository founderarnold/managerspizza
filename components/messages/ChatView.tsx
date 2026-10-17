"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import { sendMessage } from "@/app/actions/shop";
import type { Message } from "@/lib/messages-db";

const time = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Chat bubbles with a composer. Polls for new messages every 6 seconds while the page is open. */
export function ChatView({ conversationId, initial, side }: { conversationId: string; initial: Message[]; side: "customer" | "staff" }) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = messages.length ? messages[messages.length - 1].id : 0;
  const lastIdRef = useRef(lastId);
  lastIdRef.current = lastId;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(`/api/messages/${conversationId}?after=${lastIdRef.current}`, { cache: "no-store" });
        if (!r.ok) return;
        const { messages: fresh } = (await r.json()) as { messages: Message[] };
        if (!stop && fresh.length) setMessages((m) => [...m, ...fresh.filter((f) => !m.some((x) => x.id === f.id))]);
      } catch {}
    };
    const t = setInterval(tick, 6000);
    tick();
    return () => {
      stop = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);
  const send = () => {
    const body = text.trim();
    if (!body) return;
    setError(null);
    startTransition(async () => {
      const res = await sendMessage(conversationId, body);
      if (res?.error) return setError(res.error);
      setText("");
      const r = await fetch(`/api/messages/${conversationId}?after=${lastIdRef.current}`, { cache: "no-store" });
      if (r.ok) {
        const { messages: fresh } = (await r.json()) as { messages: Message[] };
        setMessages((m) => [...m, ...fresh.filter((f) => !m.some((x) => x.id === f.id))]);
      }
    });
  };

  return (
    <div className="card flex min-h-[60dvh] flex-col overflow-hidden">
      <div className="flex-1 space-y-3 overflow-y-auto bg-cream/60 p-3 sm:p-4" aria-live="polite">
        {messages.map((m) => {
          const mine = side === "staff" ? m.from_staff : !m.from_staff;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:max-w-[70%] ${mine ? "rounded-br-md bg-brand-red-deep text-white" : "rounded-bl-md bg-white shadow-soft"}`}>
                {!mine && <p className="mb-0.5 text-[11px] font-semibold text-brand-red-deep">{m.from_staff ? "Manager's Pizza" : "Customer"}</p>}
                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{m.body}</p>
                <p className={`mt-1 text-right text-[11px] ${mine ? "text-white/70" : "text-muted"}`}>{time(m.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form
        className="flex items-end gap-2 border-t border-line bg-white p-2 sm:p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label className="sr-only" htmlFor="chat-input">Message</label>
        <textarea
          id="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width: 768px)").matches) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Write a message…"
          className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-line px-3.5 py-2.5 text-[15px] focus:border-ink focus:outline-none"
        />
        <button type="submit" disabled={pending || !text.trim()} aria-label="Send" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-red-deep text-white disabled:opacity-40">
          {pending ? <Loader2 size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
        </button>
      </form>
      {error && <p role="alert" className="px-3 pb-2 text-sm text-brand-red-deep">{error}</p>}
    </div>
  );
}
