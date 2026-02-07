import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard/new")({
  component: NewSessionPage,
});

function NewSessionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [buyerName, setBuyerName] = useState("");
  const [transcript, setTranscript] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const charCount = transcript.length;
  const isValid = charCount >= 100;

  const mutation = useMutation({
    mutationFn: async () => {
      const sessionRes = await api.sessions.create(buyerName || undefined);
      if (sessionRes.error) throw new Error(sessionRes.error.message);
      const session = sessionRes.data!;

      const transcriptRes = await api.sessions.uploadTranscript(
        session.id,
        transcript,
      );
      if (transcriptRes.error) throw new Error(transcriptRes.error.message);

      return session.id;
    },
    onSuccess: (sessionId) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      navigate({ to: "/dashboard/$sessionId", params: { sessionId } });
    },
  });

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (!file.name.endsWith(".txt") && !file.name.endsWith(".pdf")) return;

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setTranscript((ev.target?.result as string) || "");
      };
      reader.readAsText(file);
    },
    [],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setTranscript((ev.target?.result as string) || "");
      };
      reader.readAsText(file);
    },
    [],
  );

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">
        New Session
      </h1>

      <div className="space-y-6">
        <div>
          <label
            htmlFor="buyer-name"
            className="text-sm font-medium mb-2 block"
          >
            Buyer Name{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <Input
            id="buyer-name"
            placeholder="e.g., Sarah Martinez"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            className="bg-surface-3 rounded-xl border-border focus:border-accent focus:ring-accent/10"
          />
        </div>

        <div>
          <label
            htmlFor="transcript"
            className="text-sm font-medium mb-2 block"
          >
            Conversation Transcript
          </label>
          <div className="relative">
            <Textarea
              id="transcript"
              placeholder="Paste your conversation transcript here…"
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                setFileName(null);
              }}
              className="min-h-[240px] bg-surface-3 rounded-xl border-border font-mono text-sm focus:border-accent focus:shadow-[0_0_0_3px_rgba(var(--accent),0.1)] resize-y"
              autoComplete="off"
              spellCheck={false}
            />
            <div className="absolute bottom-2 right-3 text-[11px] text-muted-foreground tabular-nums">
              {wordCount} words / {charCount} chars
            </div>
          </div>
          {charCount > 0 && charCount < 100 && (
            <p className="text-sm text-destructive mt-2">
              Transcript seems too short. Paste the full conversation for best
              results.
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? "border-accent bg-accent/5 scale-[1.01]"
              : "border-border hover:border-border/80"
          }`}
          onClick={() => document.getElementById("file-input")?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              document.getElementById("file-input")?.click();
          }}
        >
          <input
            id="file-input"
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileInput}
            className="hidden"
          />
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          {fileName ? (
            <p className="text-sm font-medium">{fileName}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Drop a .txt or .pdf file here, or click to browse
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/dashboard" })}
          >
            Cancel
          </Button>
          <Button
            disabled={!isValid || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="bg-accent text-accent-foreground hover:bg-accent/90 disabled:bg-surface-3 disabled:text-muted-foreground"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              "Analyze →"
            )}
          </Button>
        </div>

        {mutation.isError && (
          <p className="text-sm text-destructive">
            {(mutation.error as Error).message}
          </p>
        )}
      </div>
    </div>
  );
}
