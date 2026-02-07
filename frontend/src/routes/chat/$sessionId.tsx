import { createFileRoute } from "@tanstack/react-router";
import { Home } from "lucide-react";

export const Route = createFileRoute("/chat/$sessionId")({
  component: ChatPage,
});

function ChatPage() {
  const { sessionId: _sessionId } = Route.useParams();

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col">
      {/* Gradient accent line */}
      <div className="h-0.5" style={{ background: "var(--gradient-chat)" }} />

      {/* Header */}
      <header className="backdrop-blur-xl bg-white/80 dark:bg-black/60 border-b border-white/10 px-4 py-3 flex items-center gap-2">
        <Home className="h-5 w-5 text-accent" />
        <div>
          <p className="font-medium text-sm">RealEstateMadeEasy</p>
          <p className="text-xs text-muted-foreground">
            Finding your perfect home
          </p>
        </div>
      </header>

      {/* Chat area placeholder */}
      <div className="flex-1 flex items-center justify-center max-w-lg mx-auto px-4">
        <div className="text-center">
          <div className="rounded-2xl bg-accent/10 p-4 mb-4 inline-block">
            <Home className="h-8 w-8 text-accent" />
          </div>
          <p className="text-lg font-medium mb-2">Chat Interface</p>
          <p className="text-sm text-muted-foreground">
            The buyer chat with assistant-ui streaming will be built in Increment
            3.
          </p>
        </div>
      </div>

      {/* Input placeholder */}
      <div className="border-t border-border bg-surface-2 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <div className="flex-1 bg-surface-3 rounded-full px-4 py-2.5 text-sm text-muted-foreground">
            Type your message…
          </div>
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
