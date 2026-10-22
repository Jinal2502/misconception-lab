import { ArrowUp, Brain, Lightbulb, PanelRightClose, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

export default function SageDrawer({ attemptId, question, onClose }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [source, setSource] = useState("fallback");
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    setError("");
  }, [question.questionId]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = drawerRef.current?.querySelectorAll(
        'button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]',
      );
      if (!focusable?.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!drawerRef.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    drawerRef.current?.querySelector("button")?.focus();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(event, suggestedText) {
    event?.preventDefault();
    const content = (suggestedText ?? draft).trim();
    if (!content || sending) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setSending(true);
    setError("");
    try {
      const result = await api("/api/sage/chat", {
        method: "POST",
        body: { attemptId, questionId: question.questionId, messages: next.slice(-8) },
      });
      setSource(result.source);
      setMessages([...next, { role: "assistant", content: result.message, source: result.source }]);
    } catch (caught) {
      setError(caught.message);
      setMessages(next);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="sage-layer">
      <button className="sage-backdrop" onClick={onClose} aria-label="Close SAGE drawer" tabIndex={-1} />
      <aside ref={drawerRef} className="sage-drawer" role="dialog" aria-modal="true" aria-labelledby="sage-title">
        <header className="sage-header">
          <div className="flex items-center gap-3">
            <span className="sage-mark"><Brain size={19} /></span>
            <div>
              <h2 id="sage-title" className="font-medium tracking-tight">SAGE</h2>
              <p className="mt-0.5 text-[11px] text-white/40">Your reasoning companion</p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close SAGE"><PanelRightClose size={17} /></button>
        </header>

        <div className="sage-context">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">{question.topic}</span>
          <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/55">{question.prompt}</p>
        </div>

        <div className="sage-messages" ref={listRef} aria-live="polite">
          <div className="sage-message sage-assistant">
            <span className="sage-message-mark"><Sparkles size={13} /></span>
            <p>Hey, I’m here to help. I can explain an idea in simpler words, give you a small example, or help you find a first step. What would be useful?</p>
          </div>
          {messages.length === 0 && (
            <div className="sage-suggestions" aria-label="Suggested prompts">
              <button type="button" disabled={sending} onClick={(event) => sendMessage(event, "Could you explain this in simpler words?")}>Explain simply</button>
              <button type="button" disabled={sending} onClick={(event) => sendMessage(event, "Can you give me a small example?")}>Give me an example</button>
              <button type="button" disabled={sending} onClick={(event) => sendMessage(event, "What is one small first step I can try?")}>Help me get started</button>
            </div>
          )}
          {messages.map((message, index) => (
            <div className={`sage-message ${message.role === "user" ? "sage-user" : "sage-assistant"}`} key={`${index}-${message.role}`}>
              {message.role === "assistant" && (
                <>
                  <span className="sage-message-mark"><Sparkles size={13} /></span>
                  <div className="sage-message-content">
                    <span className="sage-source-label">{message.source === "sarvam" ? "SAGE · Sarvam" : "SAGE · built-in guide"}</span>
                    <p>{message.content}</p>
                  </div>
                </>
              )}
              {message.role === "user" && <p>{message.content}</p>}
            </div>
          ))}
          {sending && <div className="sage-message sage-assistant"><span className="sage-message-mark"><Lightbulb size={13} /></span><p className="animate-pulse">Thinking through a helpful prompt…</p></div>}
        </div>

        <div className="sage-footer">
          <p className="sage-integrity-note"><Lightbulb size={13} /> Ask for an explanation, example, or next step. SAGE won’t choose for you.</p>
          <form className="sage-compose" onSubmit={sendMessage}>
            <label htmlFor="sage-input" className="sr-only">Ask SAGE for a reasoning hint</label>
            <textarea id="sage-input" rows="2" maxLength={600} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) sendMessage(event); }} placeholder="Ask about the idea, not just the answer…" />
            <button className="sage-send" type="submit" disabled={!draft.trim() || sending} aria-label="Send to SAGE"><ArrowUp size={17} /></button>
          </form>
          <div className="flex items-center justify-between pt-2">
            {error ? <p className="text-xs text-rose-300" role="alert">{error}</p> : <p className="text-[10px] text-white/30">Shift + Enter for a new line · {source === "sarvam" ? "Live Sarvam" : "Built-in guide"}</p>}
            <span className="text-[10px] text-white/25">{draft.length}/600</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
