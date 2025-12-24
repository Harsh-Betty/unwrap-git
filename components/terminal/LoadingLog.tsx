"use client";
import { useLogStore, type LogEntry } from "@/lib/log-store";
import { useEffect, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

function LogLine({ log, index }: { log: LogEntry; index: number }) {
  const [visible, setVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    if (!visible) return;

    let charIndex = 0;
    const interval = setInterval(() => {
      if (charIndex <= log.message.length) {
        setDisplayedText(log.message.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [visible, log.message]);

  const statusIcon = {
    pending: <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />,
    done: <Check className="w-4 h-4 text-terminal" />,
    error: <X className="w-4 h-4 text-red-500" />,
  };

  if (!visible) return null;

  return (
    <div
      className={`log-line flex items-center gap-3 py-1 font-mono text-sm md:text-base
                  transition-opacity duration-300 ${
                    visible ? "opacity-100" : "opacity-0"
                  }`}
    >
      <span className="shrink-0">{statusIcon[log.status]}</span>
      <span
        className={`
        ${log.status === "done" ? "text-terminal" : ""}
        ${log.status === "error" ? "text-red-400" : ""}
        ${log.status === "pending" ? "text-terminal/80" : ""}
      `}
      >
        {displayedText}
        {displayedText.length < log.message.length && (
          <span className="animate-blink">▊</span>
        )}
      </span>
    </div>
  );
}

export function LoadingLog() {
  const logs = useLogStore((state) => state.logs);

  if (logs.length === 0) return null;

  return (
    <div className="loading-log mt-6 p-4 bg-terminal-surface rounded border border-terminal/20 shadow-[0_0_20px_rgba(255,176,0,0.1)]">
      <div className="log-header flex items-center gap-2 mb-4 pb-2 border-b border-terminal/20">
        <span className="text-terminal-dim text-xs uppercase tracking-widest">
          System Log
        </span>
        <span className="flex-1 h-px bg-linear-to-r from-terminal/30 to-transparent" />
      </div>
      <div className="log-entries space-y-1">
        {logs.map((log, index) => (
          <LogLine key={log.id} log={log} index={index} />
        ))}
      </div>
    </div>
  );
}
