import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type FormEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { ChatMessageData } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat/$sessionId")({
  component: ChatPage,
});

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const WELCOME_MESSAGE: ChatMessageData = {
  id: "__welcome__",
  role: "assistant",
  content:
    "Hi! I'm Mia, your home search assistant. I've reviewed the notes from your conversation with your agent. Let's dive deeper into what you're looking for. What's most important to you in your new home?",
  strategy_used: null,
  turn_number: 0,
  created_at: new Date().toISOString(),
};

/* -------------------------------------------------------------------------- */
/*  Animations                                                                 */
/* -------------------------------------------------------------------------- */

const messageVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

/* -------------------------------------------------------------------------- */
/*  TypingIndicator                                                            */
/* -------------------------------------------------------------------------- */

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-surface-2 border border-border/50 w-fit max-w-[80px]"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-2 rounded-full bg-muted-foreground/50"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ChatBubble                                                                 */
/* -------------------------------------------------------------------------- */

function ChatBubble({ message }: { message: ChatMessageData }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      layout="position"
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words",
          isUser
            ? "bg-accent text-accent-foreground rounded-br-md"
            : "bg-surface-2 text-foreground border border-border/50 rounded-bl-md",
        )}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  StreamingBubble — renders the in-progress assistant response               */
/* -------------------------------------------------------------------------- */

function StreamingBubble({ content }: { content: string }) {
  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      layout="position"
      className="flex justify-start"
    >
      <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-bl-md bg-surface-2 text-foreground border border-border/50 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
        {content}
        <motion.span
          className="inline-block ml-0.5 w-[2px] h-4 bg-accent align-text-bottom"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ChatPage                                                                   */
/* -------------------------------------------------------------------------- */

function ChatPage() {
  const { sessionId } = Route.useParams();

  /* ---- State ---- */
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [initialised, setInitialised] = useState(false);

  /* ---- Refs ---- */
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* ---- Load existing messages ---- */
  const { data: fetchedMessages, isLoading, isError } = useQuery({
    queryKey: ["chat", sessionId, "messages"],
    queryFn: async () => {
      const res = await api.chat.getMessages(sessionId);
      if (res.error) throw new Error(res.error.message);
      return res.data!;
    },
    // Only run once on mount; after that we manage state locally
    enabled: !initialised,
  });

  /* Hydrate local state when query data arrives */
  useEffect(() => {
    if (fetchedMessages && !initialised) {
      if (fetchedMessages.length === 0) {
        setMessages([WELCOME_MESSAGE]);
      } else {
        setMessages(fetchedMessages);
      }
      setInitialised(true);
    }
  }, [fetchedMessages, initialised]);

  /* ---- Auto-scroll ---- */
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, isStreaming, scrollToBottom]);

  /* ---- Cleanup on unmount ---- */
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  /* ---- Send message with SSE streaming ---- */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      setSendError(null);

      // Optimistic: add user message immediately
      const userMessage: ChatMessageData = {
        id: `temp-user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        strategy_used: null,
        turn_number: messages.length,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setStreamingContent("");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(
          `/api/chat/${sessionId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content.trim() }),
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Request failed with status ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body received");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        let finalized = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const jsonStr = trimmed.slice(6);

            // Skip SSE keep-alive or empty data
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const payload = JSON.parse(jsonStr) as
                | { type: "token"; content: string }
                | { type: "done"; message_id: string };

              if (payload.type === "token") {
                accumulated += payload.content;
                setStreamingContent(accumulated);
              } else if (payload.type === "done") {
                finalized = true;
                // Finalize the assistant message
                const assistantMessage: ChatMessageData = {
                  id: payload.message_id,
                  role: "assistant",
                  content: accumulated,
                  strategy_used: null,
                  turn_number: messages.length + 1,
                  created_at: new Date().toISOString(),
                };

                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent("");
                setIsStreaming(false);
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        // If the stream ended without a "done" event, finalise anyway
        if (accumulated && !finalized) {
          const fallbackMessage: ChatMessageData = {
            id: `msg-${Date.now()}`,
            role: "assistant",
            content: accumulated,
            strategy_used: null,
            turn_number: messages.length + 1,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, fallbackMessage]);
          setStreamingContent("");
          setIsStreaming(false);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User navigated away; silently ignore
          return;
        }
        const errorMessage =
          err instanceof Error ? err.message : "Something went wrong";
        setSendError(errorMessage);
        setStreamingContent("");
        setIsStreaming(false);
      } finally {
        abortRef.current = null;
      }
    },
    [isStreaming, messages.length, sessionId],
  );

  /* ---- Form submit ---- */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;
    const value = inputValue;
    setInputValue("");
    void sendMessage(value);
  };

  /* ---- Loading state ---- */
  if (isLoading && !initialised) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  /* ---- Error state for initial load ---- */
  if (isError && !initialised) {
    return (
      <div className="min-h-screen bg-surface-1 flex flex-col">
        <div
          className="h-0.5"
          style={{ background: "var(--gradient-chat)" }}
        />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="rounded-2xl bg-destructive/10 p-4 mb-4 inline-block">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-lg font-medium mb-2">
              Unable to load conversation
            </p>
            <p className="text-sm text-muted-foreground">
              Please check the session link and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen bg-surface-1 flex flex-col">
      {/* Gradient accent line */}
      <div
        className="h-0.5 shrink-0"
        style={{ background: "var(--gradient-chat)" }}
      />

      {/* Header */}
      <header className="shrink-0 backdrop-blur-xl bg-white/80 dark:bg-black/60 border-b border-border/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-1.5">
            <Home className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="font-medium text-sm leading-none">
              RealEstateMadeEasy
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Finding your perfect home
            </p>
          </div>
        </div>
      </header>

      {/* Message area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {/* Streaming content */}
          <AnimatePresence>
            {isStreaming && streamingContent && (
              <StreamingBubble content={streamingContent} />
            )}
          </AnimatePresence>

          {/* Typing indicator (shows before any tokens arrive) */}
          <AnimatePresence>
            {isStreaming && !streamingContent && (
              <TypingIndicator />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {sendError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="max-w-2xl mx-auto px-4 py-2">
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive flex-1">
                  {sendError}
                </p>
                <button
                  onClick={() => setSendError(null)}
                  className="text-xs text-destructive/70 hover:text-destructive underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="shrink-0 border-t border-border/50 bg-surface-2">
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              isStreaming ? "Waiting for response..." : "Type your message..."
            }
            disabled={isStreaming}
            autoComplete="off"
            className={cn(
              "flex-1 bg-surface-3 rounded-full px-4 py-2.5 text-sm",
              "placeholder:text-muted-foreground",
              "border border-border/50",
              "outline-none focus:border-accent focus:ring-2 focus:ring-accent/20",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || !inputValue.trim()}
            className={cn(
              "h-10 w-10 rounded-full shrink-0 transition-all duration-200",
              inputValue.trim() && !isStreaming
                ? "bg-accent text-accent-foreground hover:bg-accent/90"
                : "bg-muted text-muted-foreground",
            )}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
