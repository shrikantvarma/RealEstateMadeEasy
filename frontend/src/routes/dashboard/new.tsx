import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Upload, Loader2, FileText, Sparkles, ArrowRight, X } from "lucide-react";
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
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">New Session</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a buyer conversation to extract preferences automatically.
        </p>
      </div>

      <div className="space-y-6">
        {/* Buyer Name */}
        <div>
          <label
            htmlFor="buyer-name"
            className="text-sm font-medium mb-2 block"
          >
            Buyer Name{" "}
            <span className="text-muted-foreground/70 font-normal">
              (optional)
            </span>
          </label>
          <Input
            id="buyer-name"
            placeholder="e.g., Sarah Martinez"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            className="bg-surface-2 rounded-xl border-border/50 h-11 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-200"
          />
        </div>

        {/* Transcript */}
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
              placeholder="Paste your conversation transcript here..."
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                setFileName(null);
              }}
              className="min-h-[240px] bg-surface-2 rounded-2xl border-border/50 font-mono text-sm leading-relaxed focus:border-accent focus:ring-2 focus:ring-accent/10 resize-y transition-all duration-200"
              autoComplete="off"
              spellCheck={false}
            />
            <div className="absolute bottom-3 right-4 flex items-center gap-3 text-[11px] text-muted-foreground/60 tabular-nums">
              <span>{wordCount} words</span>
              <span className="h-3 w-px bg-border" />
              <span>{charCount} chars</span>
            </div>
          </div>
          {charCount > 0 && charCount < 100 && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-sm text-destructive mt-2"
            >
              Transcript seems too short. Paste the full conversation for best
              results.
            </motion.p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-xs text-muted-foreground/60 uppercase tracking-wide">or</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        {/* File drop zone */}
        <motion.div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          animate={dragOver ? { scale: 1.01 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors duration-200 ${
            dragOver
              ? "border-accent bg-accent/5"
              : fileName
                ? "border-success/30 bg-success/5"
                : "border-border/50 hover:border-accent/30 hover:bg-accent/3"
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
          {fileName ? (
            <div className="flex items-center justify-center gap-3">
              <div className="rounded-xl bg-success/10 p-2.5">
                <FileText className="h-5 w-5 text-success" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{fileName}</p>
                <p className="text-xs text-muted-foreground">{wordCount} words loaded</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFileName(null);
                  setTranscript("");
                }}
                className="ml-2 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-surface-3/60 p-3 mx-auto w-fit mb-3">
                <Upload className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground">
                Drop a <span className="font-medium text-foreground/70">.txt</span> or{" "}
                <span className="font-medium text-foreground/70">.pdf</span> file here, or click to browse
              </p>
            </>
          )}
        </motion.div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/dashboard" })}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            disabled={!isValid || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 disabled:bg-surface-3 disabled:text-muted-foreground shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-200 gap-2 px-6"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze Transcript
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>

        {mutation.isError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-destructive/8 border border-destructive/15 px-4 py-3 text-sm text-destructive"
          >
            {(mutation.error as Error).message}
          </motion.div>
        )}
      </div>
    </div>
  );
}
